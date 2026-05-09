import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download, Share2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { parseStateFromAddress } from "@/data/stateData";
import { toast } from "sonner";
import ShareWithRealtorDialog from "@/components/ShareWithRealtorDialog";

interface DisclosureField {
  key: string;
  category: string;
  label: string;
  value: string;
  source: string | null;
  known: boolean;
}

const SellerDisclosureScreen = () => {
  const navigate = useNavigate();
  const { activeProperty } = useAuth();
  const [fields, setFields] = useState<DisclosureField[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const propertyState = useMemo(
    () => activeProperty ? parseStateFromAddress(activeProperty.address) || activeProperty.state || "" : "",
    [activeProperty]
  );

  useEffect(() => {
    if (!activeProperty?.id) return;
    let cancelled = false;
    (async () => {
      const propertyId = activeProperty.id;
      const [systemsRes, recordsRes, findingsRes, requirementsRes] = await Promise.all([
        supabase.from("system_details").select("system_name, install_date, specs, brand").eq("property_id", propertyId),
        supabase.from("property_records").select("record_type, document_date, file_name, ai_extracted_data").eq("property_id", propertyId),
        supabase.from("inspection_findings").select("level, category, status, description").eq("property_id", propertyId).in("status", ["open", "in_progress"]),
        propertyState
          ? supabase.from("state_disclosure_requirements").select("trigger_category, requirement_text").eq("state", propertyState).limit(50)
          : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (cancelled) return;

      const systems = (systemsRes.data || []) as any[];
      const records = (recordsRes.data || []) as any[];
      const findings = (findingsRes.data || []) as any[];
      const requirements = (requirementsRes.data || []) as any[];

      const findSystem = (re: RegExp) => systems.find((s) => re.test(s.system_name));
      const hvac = findSystem(/hvac/i);
      const roof = findSystem(/roof/i);
      const wh = findSystem(/water heater/i);
      const elec = findSystem(/electrical/i);
      const water = findSystem(/water source|well/i);
      const sewer = findSystem(/sewer|septic/i);

      const permits = records.filter((r) => /permit/i.test(r.record_type || ""));
      const inspections = records.filter((r) => /inspection/i.test(r.record_type || ""));

      // Pull onboarding-derived environmental flags from a representative system's specs
      const allSpecs = systems.map((s) => s.specs || {});
      const flood = allSpecs.find((sp) => sp.fema_flood_zone)?.fema_flood_zone;
      const epa = allSpecs.find((sp) => sp.epa_echo_facilities_count)?.epa_echo_facilities_count;
      const hoa = allSpecs.find((sp) => sp.hoa_name)?.hoa_name;

      const level1or2 = findings.filter((f) => Number(f.level) >= 1 && Number(f.level) <= 2);

      const built: DisclosureField[] = [];
      const push = (category: string, key: string, label: string, value: string | null | undefined, source: string | null) =>
        built.push({ category, key, label, value: value ? String(value) : "", source: value ? source : null, known: !!value });

      // Defects
      push("Known Defects", "open_findings",
        "Open inspection findings (Level 1–2)",
        level1or2.length ? `${level1or2.length} item(s): ${level1or2.slice(0, 3).map((f) => f.description || f.category).filter(Boolean).join("; ")}` : "",
        level1or2.length ? "Inspection findings" : null
      );

      // System ages
      push("Major Systems", "hvac_age", "HVAC install year", hvac?.install_date, "system_details");
      push("Major Systems", "roof_age", "Roof install year", roof?.install_date, "system_details");
      push("Major Systems", "wh_age", "Water heater install year", wh?.install_date, "system_details");
      push("Major Systems", "elec_age", "Electrical panel install year", elec?.install_date, "system_details");

      // Permits
      push("Permits & Records", "permits", "Permits on file", permits.length ? permits.map((p) => p.file_name || p.record_type).join(", ") : "", permits.length ? "Permit records" : null);
      push("Permits & Records", "inspections", "Inspection reports on file", inspections.length ? `${inspections.length} report(s)` : "", inspections.length ? "Inspection records" : null);

      // Environmental
      push("Environmental Hazards", "flood_zone", "FEMA flood zone", flood, "FEMA");
      push("Environmental Hazards", "epa_facilities", "Nearby EPA-regulated facilities", epa, "EPA ECHO");
      push("Environmental Hazards", "lead_paint", "Built before 1978 (lead-paint disclosure required)",
        activeProperty.year_built && Number(activeProperty.year_built) < 1978 ? "Yes — federal disclosure required" : (activeProperty.year_built ? "No" : ""),
        activeProperty.year_built ? "Property record" : null
      );

      // HOA
      push("HOA", "hoa_name", "HOA name", hoa, "Onboarding");

      // Well/Septic
      push("Water & Sewer", "water_type", "Water source type", water?.specs?.water_type || (water ? "Documented" : ""), water ? "system_details" : null);
      push("Water & Sewer", "sewer_type", "Sewer/septic type", sewer?.specs?.sewer_type || (sewer ? "Documented" : ""), sewer ? "system_details" : null);

      // Append state-required items as their own category if not already covered
      requirements.forEach((req, i) => {
        built.push({
          category: `${propertyState} State Requirements`,
          key: `state_${i}`,
          label: req.requirement_text?.slice(0, 120) || req.trigger_category,
          value: "",
          source: null,
          known: false,
        });
      });

      setFields(built);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeProperty?.id, propertyState]);

  const completion = useMemo(() => {
    if (!fields.length) return 0;
    const known = fields.filter((f) => f.known).length;
    return Math.round((known / fields.length) * 100);
  }, [fields]);

  const updateField = (key: string, value: string) => {
    setFields((prev) => prev.map((f) => f.key === key ? { ...f, value, known: !!value } : f));
  };

  const grouped = useMemo(() => {
    const map: Record<string, DisclosureField[]> = {};
    fields.forEach((f) => { (map[f.category] = map[f.category] || []).push(f); });
    return map;
  }, [fields]);

  const downloadPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(16);
      doc.text("Seller Property Disclosure", 20, y); y += 8;
      doc.setFontSize(10);
      doc.text(`Property: ${activeProperty?.address || ""}`, 20, y); y += 6;
      doc.text(`State: ${propertyState || "—"}`, 20, y); y += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y); y += 10;

      Object.entries(grouped).forEach(([cat, items]) => {
        doc.setFontSize(12);
        doc.text(cat, 20, y); y += 6;
        doc.setFontSize(9);
        items.forEach((f) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const line = `${f.label}: ${f.value || "(unknown)"}${f.source ? ` [${f.source}]` : ""}`;
          const split = doc.splitTextToSize(line, 170);
          doc.text(split, 22, y); y += 5 * split.length + 1;
        });
        y += 4;
      });
      doc.save(`seller-disclosure-${(activeProperty?.address || "home").replace(/\s+/g, "-")}.pdf`);
      toast.success("Disclosure PDF downloaded");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate PDF");
    }
  };

  if (loading) {
    return <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 animate-pulse"><div className="h-32 bg-secondary rounded-xl" /></div>;
  }

  if (!activeProperty?.id) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground">No active property. <button className="text-primary underline" onClick={() => navigate("/property")}>Add one</button>.</p>
      </div>
    );
  }

  const unknown = fields.length - fields.filter((f) => f.known).length;

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate("/handover")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Handover
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">Seller Disclosure</h1>
      <p className="text-xs text-muted-foreground mb-4">{activeProperty.address} · {propertyState || "Federal disclosures only"}</p>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Your disclosure is {completion}% complete</span>
          <span className="text-xs text-muted-foreground">{unknown} field{unknown !== 1 ? "s" : ""} need your input</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
        </div>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h2>
          <div className="space-y-2">
            {items.map((f) => (
              <div key={f.key}
                className={`rounded-xl border p-3 ${f.known ? "border-border bg-card" : "border-amber-500/40 bg-amber-500/5"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground flex-1">{f.label}</p>
                  {f.known
                    ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                </div>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  placeholder={f.known ? "" : "Enter your answer"}
                  className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-xs"
                />
                {f.source && <p className="text-[10px] text-muted-foreground mt-1">Auto-filled from {f.source}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 mt-6">
        <button onClick={downloadPdf}
          className="flex-1 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2">
          <Download className="h-4 w-4" /> Download Disclosure PDF
        </button>
        <button onClick={() => setShareOpen(true)}
          className="flex-1 rounded-xl border border-border bg-card py-3.5 font-semibold text-foreground hover:bg-secondary/30 flex items-center justify-center gap-2">
          <Share2 className="h-4 w-4" /> Share with Realtor
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
        This document is generated from your ComingHomeIQ data. Review carefully and consult a licensed real estate attorney before signing or delivering to a buyer.
      </p>

      <ShareWithRealtorDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={activeProperty.id}
        documents={{ disclosure: true, completion, fields: fields.length }}
      />
    </div>
  );
};

export default SellerDisclosureScreen;