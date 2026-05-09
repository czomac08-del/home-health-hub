import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExtractedItem {
  key: string;
  label: string;
  value: string;
  // What table/system to write to
  target:
    | { kind: "property"; column: "year_built" | "address" }
    | { kind: "system"; systemName: string; spec: Record<string, any> }
    | { kind: "note" };
  decision: "add" | "manual" | "skip" | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recordId: string;
}

function buildItemsFromExtraction(ai: any): ExtractedItem[] {
  if (!ai || typeof ai !== "object") return [];
  const items: ExtractedItem[] = [];
  const rep = ai.inspection_report;

  // Helper: build a worst-case condition rating from a list of findings.
  // level 4 = Major Defect, 3 = Significant, 2 = Minor, 1 = Info.
  const conditionFromFindings = (fs: any[]): string => {
    if (!fs.length) return "";
    const max = fs.reduce((m, f) => Math.max(m, Number(f.level) || 0), 0);
    if (max >= 4) return "Major Defect Noted";
    if (max >= 3) return "Significant Issues Noted";
    if (max >= 2) return "Minor Issues Noted";
    return "No major issues noted";
  };

  // Year built — common across permits + inspections
  const yb = ai.year_built || rep?.year_built || rep?.inspector?.year_built;
  if (yb) {
    items.push({
      key: "year_built",
      label: "Year built",
      value: String(yb),
      target: { kind: "property", column: "year_built" },
      decision: null,
    });
  }

  // HVAC units — from explicit field or by inferring from findings.
  // CRITICAL: even if no brand/year is present, we still create a system row so
  // the dashboard tile flips from "Add Info" to a real, inspector-verified system.
  let hvac: any[] | null = rep?.hvac_units || ai.hvac_units || null;
  let hvacFindingsRaw: any[] = [];
  if (!hvac && Array.isArray(rep?.findings)) {
    const hvacFindings = rep.findings.filter((f: any) =>
      (f.category || "").toLowerCase() === "hvac" || /hvac|condenser|furnace|air handler/i.test(f.title || ""),
    );
    hvacFindingsRaw = hvacFindings;
    // Detect "left/right" or "unit 1/2" mentions
    const seen = new Map<string, any>();
    for (const f of hvacFindings) {
      const text = `${f.title} ${f.description || ""} ${f.location || ""}`;
      const side = /left|unit\s*1|first/i.test(text) ? "Unit 1"
        : /right|unit\s*2|second/i.test(text) ? "Unit 2"
        : "Main";
      const yearMatch = text.match(/\b(19|20)\d{2}\b/);
      const functional = !/not\s+function|inoperable|fail|broken/i.test(text);
      const existing = seen.get(side) || { location: side };
      if (yearMatch && !existing.year) existing.year = yearMatch[0];
      existing.condition = functional ? "Functional" : "Not functional";
      seen.set(side, existing);
    }
    if (seen.size > 0) hvac = Array.from(seen.values());
    // Fallback: report has HVAC findings but no per-unit detail — still create one row
    // so the system is documented.
    if (!hvac && hvacFindings.length > 0) {
      hvac = [{
        location: "Main",
        condition: conditionFromFindings(hvacFindings),
        inspector_findings_count: hvacFindings.length,
      }];
    }
  }
  if (Array.isArray(hvac)) {
    hvac.forEach((u: any, i: number) => {
      items.push({
        key: `hvac_${i}`,
        label: `HVAC ${u.location || `Unit ${i + 1}`}`,
        value: [u.location, u.year, u.brand, u.condition].filter(Boolean).join(" · ") || "Documented from inspection",
        target: { kind: "system", systemName: i === 0 ? "HVAC" : `HVAC ${u.location || i + 1}`, spec: u },
        decision: null,
      });
    });
  }

  // Water heaters — explicit or inferred
  let wh: any[] | null = rep?.water_heaters || ai.water_heaters || null;
  if (!wh && Array.isArray(rep?.findings)) {
    const whFindings = rep.findings.filter((f: any) =>
      /water heater|tankless|navien|rheem/i.test(`${f.title} ${f.description || ""}`),
    );
    const seen: any[] = [];
    for (const f of whFindings) {
      const text = `${f.title} ${f.description || ""}`;
      const brand =
        /navien/i.test(text) ? "Navien" :
        /rheem/i.test(text) ? "Rheem" :
        /bradford/i.test(text) ? "Bradford White" : null;
      const type = /tankless/i.test(text) ? "Tankless" : /tank/i.test(text) ? "Tank" : null;
      const yearMatch = text.match(/\b(19|20)\d{2}\b/);
      const gallons = text.match(/(\d{2,3})\s*-?\s*gal/i);
      const key = `${brand || ""}-${yearMatch?.[0] || ""}`;
      if (key !== "-" && !seen.find((s) => s.key === key)) {
        seen.push({
          key,
          brand,
          type,
          year: yearMatch?.[0] || null,
          capacity_gallons: gallons ? parseInt(gallons[1], 10) : null,
        });
      }
    }
    if (seen.length) wh = seen;
  }
  if (Array.isArray(wh)) {
    wh.forEach((u: any, i: number) => {
      items.push({
        key: `wh_${i}`,
        label: `Water heater ${i + 1}`,
        value: [u.brand, u.type, u.capacity_gallons ? `${u.capacity_gallons} gal` : null, u.year].filter(Boolean).join(" · "),
        target: { kind: "system", systemName: i === 0 ? "Water Heater" : `Water Heater ${i + 1}`, spec: u },
        decision: null,
      });
    });
  }

  // Electrical panel — explicit or inferred from findings.
  // Like HVAC, always create a row when the report has any electrical category content.
  let panel: any | null = rep?.electrical_panel || ai.electrical_panel || null;
  let electricalFindingsRaw: any[] = [];
  if (!panel && Array.isArray(rep?.findings)) {
    electricalFindingsRaw = rep.findings.filter((f: any) =>
      (f.category || "").toLowerCase() === "electrical" ||
      /panel|amp|breaker|outlet|wiring|gfci/i.test(`${f.title} ${f.description || ""}`),
    );
    const elec = electricalFindingsRaw.find((f: any) =>
      /panel|amp|breaker/i.test(`${f.title} ${f.description || ""}`),
    ) || electricalFindingsRaw[0];
    if (elec) {
      const text = `${elec.title} ${elec.description || ""}`;
      const amp = text.match(/(\d{2,4})\s*-?\s*amp/i);
      const brand = /federal pacific|fpe/i.test(text) ? "Federal Pacific" : null;
      panel = {
        amperage: amp ? parseInt(amp[1], 10) : null,
        brand,
        notes: elec.title,
        condition: conditionFromFindings(electricalFindingsRaw),
        inspector_findings_count: electricalFindingsRaw.length,
      };
    }
  }
  if (panel) {
    items.push({
      key: "electrical_panel",
      label: "Electrical panel",
      value: [panel.amperage ? `${panel.amperage} amp` : null, panel.brand, panel.notes, panel.condition]
        .filter(Boolean).join(" · ") || "Documented from inspection",
      target: { kind: "system", systemName: "Electrical", spec: panel },
      decision: null,
    });
  }

  // Foundation type — explicit or inferred
  let ft = rep?.foundation_type || ai.foundation_type;
  if (!ft && Array.isArray(rep?.findings)) {
    const fnd = rep.findings.find((f: any) =>
      /crawlspace|crawl space|basement|slab/i.test(`${f.title} ${f.description || ""} ${f.location || ""}`),
    );
    if (fnd) {
      const text = `${fnd.title} ${fnd.description || ""} ${fnd.location || ""}`;
      ft = /crawl/i.test(text) ? "Crawlspace" : /basement/i.test(text) ? "Basement" : /slab/i.test(text) ? "Slab" : null;
    }
  }
  if (ft) {
    items.push({
      key: "foundation_type",
      label: "Foundation type",
      value: String(ft),
      target: { kind: "system", systemName: "Foundation", spec: { foundation_type: ft } },
      decision: null,
    });
  }

  // Plumbing — inferred from any plumbing-category findings (so a generic plumbing
  // section in the report still produces a documented system tile).
  if (Array.isArray(rep?.findings)) {
    const plumbingFindings = rep.findings.filter((f: any) =>
      (f.category || "").toLowerCase() === "plumbing" ||
      /plumbing|pipe|leak|drain|supply line/i.test(`${f.title} ${f.description || ""}`),
    );
    if (plumbingFindings.length > 0) {
      const conditions = plumbingFindings.map((f: any) => f.title).slice(0, 3);
      items.push({
        key: "plumbing",
        label: "Plumbing",
        value: `${plumbingFindings.length} finding${plumbingFindings.length !== 1 ? "s" : ""} noted`,
        target: {
          kind: "system",
          systemName: "Plumbing",
          spec: {
            condition_noted: conditions.join("; "),
            condition: conditionFromFindings(plumbingFindings),
            inspector_findings_count: plumbingFindings.length,
          },
        },
        decision: null,
      });
    }
  }

  // Roof — explicit or inferred from any roof-category findings.
  if (!rep?.roof && !ai.roof && Array.isArray(rep?.findings)) {
    const roofFindings = rep.findings.filter((f: any) =>
      (f.category || "").toLowerCase() === "roof" ||
      /\broof|shingle|flashing|gutter|chimney/i.test(`${f.title} ${f.description || ""}`),
    );
    if (roofFindings.length > 0) {
      items.push({
        key: "roof_inferred",
        label: "Roof",
        value: `${roofFindings.length} finding${roofFindings.length !== 1 ? "s" : ""} noted`,
        target: {
          kind: "system",
          systemName: "Roof",
          spec: {
            condition: conditionFromFindings(roofFindings),
            inspector_findings_count: roofFindings.length,
            notes: roofFindings.slice(0, 3).map((f: any) => f.title).join("; "),
          },
        },
        decision: null,
      });
    }
  }

  // Inspector record — pulled from the report header
  const insp = rep?.inspector || ai;
  if (insp && (insp.inspector_name || insp.inspector_company)) {
    items.push({
      key: "inspector",
      label: "Inspector on file",
      value: [insp.inspector_name, insp.inspector_company, insp.inspection_date].filter(Boolean).join(" · "),
      target: { kind: "note" },
      decision: null,
    });
  }

  // Roof
  const roof = rep?.roof || ai.roof;
  if (roof) {
    items.push({
      key: "roof",
      label: "Roof",
      value: [roof.material, roof.age ? `${roof.age} yrs` : null].filter(Boolean).join(" · "),
      target: { kind: "system", systemName: "Roof", spec: roof },
      decision: null,
    });
  }

  // Generic extracted scalar fields
  // Detected system (water filter, appliance, etc.) from "other" doc uploads
  const detectedSystem = ai.detected_system;
  const detectedSystemName = ai.system_name;
  if (detectedSystem && detectedSystem !== "other") {
    const systemNameMap: Record<string, string> = {
      water_filtration: "Water Filtration",
      plumbing: "Plumbing",
      hvac: "HVAC",
      electrical: "Electrical",
      structural: "Structural",
      roof: "Roof",
      appliance: "Appliances",
      water_heater: "Water Heater",
      well: "Well",
      septic: "Septic",
    };
    const mappedName = detectedSystemName || systemNameMap[detectedSystem] || String(detectedSystem).replace(/_/g, " ");
    const spec: Record<string, any> = {};
    if (ai.brand) spec.brand = ai.brand;
    if (ai.model) spec.model = ai.model;
    if (ai.serial) spec.serial_number = ai.serial;
    if (ai.install_date) spec.install_date = ai.install_date;
    if (ai.service_date) spec.last_service = ai.service_date;
    if (ai.next_service_date) spec.next_service = ai.next_service_date;
    if (ai.filter_life_months) spec.filter_life_months = ai.filter_life_months;
    if (ai.notes) spec.notes = ai.notes;

    const displayParts = [ai.brand, ai.model, ai.notes].filter(Boolean);
    items.push({
      key: "detected_system",
      label: mappedName,
      value: displayParts.join(" · ") || "Documented from uploaded file",
      target: { kind: "system", systemName: mappedName, spec },
      decision: null,
    });
  }

  const skipKeys = new Set([
    "inspection_report",
    "year_built",
    "hvac_units",
    "water_heaters",
    "electrical_panel",
    "foundation_type",
    "roof",
    "address",
    "property_address",
    "detected_system",
    "system_name",
  ]);
  for (const [k, v] of Object.entries(ai)) {
    if (skipKeys.has(k)) continue;
    if (v == null || v === "" || typeof v === "object") continue;
    items.push({
      key: k,
      label: k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: String(v),
      target: { kind: "note" },
      decision: null,
    });
  }

  return items;
}

export default function AddToProfileModal({ open, onOpenChange, recordId }: Props) {
  const { user, activeProperty } = useAuth();
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ added: number } | null>(null);

  useEffect(() => {
    if (!open || !recordId) return;
    setLoading(true);
    setDone(false);
    setSummary(null);
    supabase
      .from("property_records")
      .select("ai_extracted_data")
      .eq("id", recordId)
      .maybeSingle()
      .then(({ data }) => {
        const built = buildItemsFromExtraction(data?.ai_extracted_data || {});
        // Auto-select all by default
        setItems(built.map((b) => ({ ...b, decision: "add" })));
        setLoading(false);
      });
  }, [open, recordId]);

  const selectedCount = useMemo(
    () => items.filter((i) => i.decision === "add").length,
    [items],
  );

  const setDecision = (key: string, decision: ExtractedItem["decision"]) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, decision } : i)));
  };

  const acceptAll = () => setItems((prev) => prev.map((i) => ({ ...i, decision: "add" })));

  const handleSave = async () => {
    if (!user || !activeProperty) return;
    setSaving(true);
    let added = 0;

    // Detect "from inspection" so we can mark items as inspector_verified rather than ai_extracted.
    const isInspectionSource = items.some((i) => i.key === "inspector");
    const dataStatus = isInspectionSource ? "inspector_verified" : "ai_extracted";

    // Pull the inspection date once so we can stamp every system row's specs with it.
    let inspectionDate: string | null = null;
    if (isInspectionSource) {
      const { data: rec } = await supabase
        .from("property_records")
        .select("ai_extracted_data, document_date")
        .eq("id", recordId)
        .maybeSingle();
      const ai = (rec?.ai_extracted_data as any) || {};
      const rep = ai.inspection_report;
      inspectionDate =
        rep?.inspector?.inspection_date ||
        ai.inspection_date ||
        rec?.document_date ||
        null;
    }

    for (const item of items) {
      if (item.decision !== "add") continue;

      try {
        if (item.target.kind === "property" && item.target.column === "year_built") {
          const yb = parseInt(item.value, 10);
          if (!Number.isNaN(yb)) {
            await supabase
              .from("properties")
              .update({ year_built: String(yb), data_status: dataStatus as any })
              .eq("id", activeProperty.id);
            added++;
          }
        } else if (item.target.kind === "system") {
          // Stamp inspection date inside specs so the system carries its source-of-truth date,
          // even for historical inspections (e.g. a 2022 report is still valid baseline data).
          const specWithDate = {
            ...(item.target.spec as Record<string, any>),
            ...(inspectionDate ? { last_inspected_date: inspectionDate } : {}),
            ...(isInspectionSource ? { source_record_id: recordId } : {}),
          };
          // Upsert by (property_id, system_name) to avoid unique-constraint failures
          // when the user already added this system manually.
          const { error } = await supabase.from("system_details").upsert(
            {
              property_id: activeProperty.id,
              user_id: user.id,
              system_name: item.target.systemName,
              specs: specWithDate as any,
              install_date: (item.target.spec as any)?.year || null,
              brand: (item.target.spec as any)?.brand || null,
              location_in_home: (item.target.spec as any)?.location || null,
              status: "configured",
              data_status: dataStatus as any,
            } as any,
            { onConflict: "property_id,system_name" },
          );
          if (error) {
            console.warn("system_details upsert failed", item.target.systemName, error);
          } else {
            added++;
          }
        }
      } catch (e) {
        console.warn("Import item failed", item.key, e);
      }
    }

    setSaving(false);
    setSummary({ added });
    setDone(true);
    if (added > 0) {
      toast.success(`${added} item${added !== 1 ? "s" : ""} added to your profile`);
      // Mark the source document as imported so the vault button flips to
      // "Added to Profile" and stays that way across refreshes.
      try {
        await supabase
          .from("property_records")
          .update({ ai_verified: true })
          .eq("id", recordId);
      } catch (e) {
        console.warn("Failed to mark record as added to profile", e);
      }
      // Notify the dashboard / IQ ring to recompute immediately — no page refresh needed.
      try {
        window.dispatchEvent(new CustomEvent("system-details-updated"));
      } catch {}
    }
  };

  // "Skip for Now" — record pending imports in needs_info so the dashboard can resurface them.
  const handleSkipForNow = async () => {
    if (!user || !activeProperty) {
      onOpenChange(false);
      return;
    }
    const rows = items.map((i) => ({
      user_id: user.id,
      property_id: activeProperty.id,
      section: "inspection_import",
      field_name: i.key,
      field_label: i.label,
    }));
    if (rows.length) {
      await supabase
        .from("needs_info" as any)
        .upsert(rows, { onConflict: "property_id,section,field_name", ignoreDuplicates: true });
    }
    toast("We'll remind you about these on your dashboard.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add to Profile
          </DialogTitle>
          <DialogDescription>
            We found information in this document that can improve your property profile. Choose what to add.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
          </div>
        ) : done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-health-green mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {summary?.added || 0} items added to your property profile
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              These are marked as <span className="font-medium">AI Extracted</span> until verified.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">Close</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No new data points found in this document.</p>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-lg border p-3 transition-colors ${
                    item.decision === "add"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.decision === "add"}
                      onCheckedChange={(c) => setDecision(item.key, c ? "add" : "skip")}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.value}</p>
                      <p className="text-[10px] text-primary mt-1">
                        Found in inspection report — Inspector Verified
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2 ml-7">
                    <button
                      onClick={() => setDecision(item.key, "add")}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        item.decision === "add"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      Add to Profile
                    </button>
                    <button
                      onClick={() => setDecision(item.key, "manual")}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        item.decision === "manual"
                          ? "bg-secondary text-foreground border-border"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      I'll enter manually
                    </button>
                    <button
                      onClick={() => setDecision(item.key, "skip")}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        item.decision === "skip"
                          ? "bg-muted text-muted-foreground border-border"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={acceptAll} className="flex-1">
                Add All to Profile
              </Button>
              <Button onClick={handleSave} disabled={saving || selectedCount === 0} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
            <button
              onClick={handleSkipForNow}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
            >
              Skip for now
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}