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

  // Year built — common across permits + inspections
  const yb = ai.year_built || rep?.year_built;
  if (yb) {
    items.push({
      key: "year_built",
      label: "Year built",
      value: String(yb),
      target: { kind: "property", column: "year_built" },
      decision: null,
    });
  }

  // HVAC units extracted from inspection findings or summary
  const hvac = rep?.hvac_units || ai.hvac_units;
  if (Array.isArray(hvac)) {
    hvac.forEach((u: any, i: number) => {
      items.push({
        key: `hvac_${i}`,
        label: `HVAC unit ${i + 1}`,
        value: [u.location, u.year, u.brand, u.condition].filter(Boolean).join(" · "),
        target: { kind: "system", systemName: "HVAC", spec: u },
        decision: null,
      });
    });
  }

  // Water heaters
  const wh = rep?.water_heaters || ai.water_heaters;
  if (Array.isArray(wh)) {
    wh.forEach((u: any, i: number) => {
      items.push({
        key: `wh_${i}`,
        label: `Water heater ${i + 1}`,
        value: [u.brand, u.type, u.capacity_gallons ? `${u.capacity_gallons} gal` : null, u.year].filter(Boolean).join(" · "),
        target: { kind: "system", systemName: "Water Heater", spec: u },
        decision: null,
      });
    });
  }

  // Electrical panel
  const panel = rep?.electrical_panel || ai.electrical_panel;
  if (panel) {
    items.push({
      key: "electrical_panel",
      label: "Electrical panel",
      value: [panel.amperage ? `${panel.amperage} amp` : null, panel.brand].filter(Boolean).join(" · "),
      target: { kind: "system", systemName: "Electrical", spec: panel },
      decision: null,
    });
  }

  // Foundation type
  const ft = rep?.foundation_type || ai.foundation_type;
  if (ft) {
    items.push({
      key: "foundation_type",
      label: "Foundation type",
      value: String(ft),
      target: { kind: "system", systemName: "Foundation", spec: { foundation_type: ft } },
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

    for (const item of items) {
      if (item.decision !== "add") continue;

      try {
        if (item.target.kind === "property" && item.target.column === "year_built") {
          const yb = parseInt(item.value, 10);
          if (!Number.isNaN(yb)) {
            await supabase
              .from("properties")
              .update({ year_built: yb })
              .eq("id", activeProperty.id);
            added++;
          }
        } else if (item.target.kind === "system") {
          await supabase.from("system_details").insert({
            property_id: activeProperty.id,
            user_id: user.id,
            system_name: item.target.systemName,
            specs: item.target.spec as any,
            data_status: "ai_extracted" as any,
          } as any);
          added++;
        }
      } catch (e) {
        console.warn("Import item failed", item.key, e);
      }
    }

    setSaving(false);
    setSummary({ added });
    setDone(true);
    if (added > 0) toast.success(`${added} item${added !== 1 ? "s" : ""} added to your profile`);
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}