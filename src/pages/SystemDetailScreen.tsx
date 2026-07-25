import { useParams, useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import { ArrowLeft, AlertTriangle, CheckCircle2, Circle, Sparkles, Calendar, Fan, Droplets, Zap, Home, ShoppingCart, Info, Share2, ShieldCheck } from "lucide-react";
import { systems } from "./DashboardScreen";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BreakerPanelMapper from "@/components/BreakerPanelMapper";
import { FloatingAiScanButton, AiPhotoPicker, AiScanReview, ScanHistory } from "@/components/AiPhotoScanner";
import type { ScanResult } from "@/components/AiPhotoScanner";
import WarrantySection from "@/components/WarrantySection";
import ApplianceScanner from "@/components/ApplianceScanner";
import RecordsStatusSelector from "@/components/RecordsStatusSelector";
import QuickCheckInButton from "@/components/QuickCheckInButton";
import UploadPromptCard from "@/components/UploadPromptCard";
import ContractorShareModal from "@/components/ContractorShareModal";
import PendingContractorSubmissions from "@/components/PendingContractorSubmissions";
import { toast } from "sonner";
import { savePhotoAiResult } from "@/lib/photoAiSave";

const AMAZON_TAG = "cominghomeiq2-20";

const iconMap: Record<string, ReactNode> = {
  hvac: <Fan className="h-6 w-6 text-primary" />,
  plumbing: <Droplets className="h-6 w-6 text-primary" />,
  electrical: <Zap className="h-6 w-6 text-primary" />,
  roof: <Home className="h-6 w-6 text-primary" />,
};

const systemPrompts: Record<string, string> = {
  hvac: "Tell us about your HVAC system to get an accurate health score. Scan the label on your unit or enter details manually.",
  plumbing: "Tell us about your plumbing to get an accurate health score. Add your water heater age, pipe material, or upload an inspection report.",
  electrical: "Tell us about your electrical panel to get an accurate health score. Scan your panel label or enter details manually.",
  roof: "Tell us about your roof to get an accurate health score. Add your roof age, material type, or last inspection date.",
};

const systemNotDocumentedLabels: Record<string, string> = {
  hvac: "HVAC Not Documented",
  plumbing: "Plumbing Not Documented",
  electrical: "Panel Not Documented",
  roof: "Roof Not Documented",
};

const systemUploadPrompts: Record<string, { title: string; description: string; docType: string }> = {
  hvac: {
    title: "Have a service record? Upload it here.",
    description: "Tune-up receipt, install paperwork, or warranty — we'll log the details automatically.",
    docType: "repair_receipt",
  },
  roof: {
    title: "Have an inspection report or warranty? Add it.",
    description: "Roof age, material, and warranty terms strengthen your home's record.",
    docType: "inspection_report",
  },
  plumbing: {
    title: "Water heater receipt or plumbing permit? Add it.",
    description: "Documenting age and parts protects you against future surprises.",
    docType: "repair_receipt",
  },
  electrical: {
    title: "Panel inspection or electrician invoice? Upload it.",
    description: "Helps document panel age, amperage, and safety upgrades.",
    docType: "inspection_report",
  },
};

const systemDetails: Record<string, {
  lastService: string;
  warning?: string;
  aiRecommendation: string;
  steps: string[];
}> = {
  hvac: {
    lastService: "March 15, 2024",
    aiRecommendation: "Your HVAC system is performing well. Consider scheduling a pre-summer tune-up to maintain peak efficiency and extend system lifespan by 3–5 years.",
    steps: ["Replace the air filter (check if it's a 1\" or 4\" filter for your unit)", "Clean condenser coils with a garden hose — remove debris and dirt buildup", "Inspect the blower motor and lubricate bearings if accessible"],
  },
  plumbing: {
    lastService: "January 8, 2024",
    warning: "Water heater is 9 years old — consider replacement within 2 years to avoid potential leaks or failure.",
    aiRecommendation: "Your plumbing is in good shape overall. The water heater is approaching end-of-life. Budget $1,200–$2,000 for a tankless or traditional replacement within 24 months.",
    steps: ["Test water pressure at the main valve — ideal range is 40–60 PSI", "Locate and label the main water shutoff valve for emergencies", "Check under all sinks for slow drips or mineral buildup on fittings"],
  },
  electrical: {
    lastService: "November 22, 2023",
    warning: "Electrical panel is original (1998) — 26+ years old. Risk of overloaded circuits and potential fire hazard. Licensed electrician inspection strongly recommended.",
    aiRecommendation: "Your electrical panel is outdated. Modern 200-amp panels improve safety and support today's electrical loads. Schedule a professional evaluation — estimated cost $1,500–$3,000.",
    steps: ["Test all GFCI outlets by pressing the 'Test' and 'Reset' buttons monthly", "Open the breaker panel and visually check for corrosion, scorch marks, or loose wires", "Replace any outlets or switches that feel warm to the touch or spark when used"],
  },
  roof: {
    lastService: "June 3, 2022",
    warning: "Shingles show significant curling and granule loss. Estimated 3–5 years of remaining life. Risk of leaks during heavy storms.",
    aiRecommendation: "Roof condition is declining. Begin getting quotes for full replacement ($8,000–$15,000). Address any active leaks and clear debris regularly to extend remaining life.",
    steps: ["Walk the perimeter and look for missing, cracked, or curled shingles", "Clear all gutters and downspouts of leaves and debris — check for proper drainage", "Inspect the attic interior for water stains, daylight through boards, or mold growth"],
  },
};

// Same pattern map the dashboard uses to associate dashboard tile IDs
// with the system_name strings stored in system_details.
const systemMatchers: Record<string, RegExp> = {
  hvac: /^hvac/i,
  plumbing: /^(plumbing|water heater)/i,
  electrical: /^electrical/i,
  roof: /^roof/i,
};

type DbSystemRow = {
  id: string;
  system_name: string;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  data_status: string | null;
  status: string | null;
  specs: any;
};

// Inspector-verified or AI-extracted rows score in the 70-85 band, scaled by
// finding severity. No findings → 85. Major defect → 60. Significant → 70.
function scoreFromRows(rows: DbSystemRow[], findingsByLevel: Record<number, number>): number {
  if (!rows.length) return 50;
  const isInspector = rows.some((r) => r.data_status === "inspector_verified");
  const max = Math.max(0, ...rows.map((r) => Number(r.specs?.inspector_findings_count) || 0));
  // Pull worst-case condition string out of any matching row.
  const condition = (rows.find((r) => r.specs?.condition)?.specs?.condition || "").toLowerCase();
  let base = isInspector ? 82 : 70;
  if (/major defect/i.test(condition) || (findingsByLevel[4] || 0) > 0) base = 60;
  else if (/significant/i.test(condition) || (findingsByLevel[3] || 0) > 0) base = 70;
  else if (/minor/i.test(condition) || (findingsByLevel[2] || 0) > 0) base = 78;
  if (max >= 5) base -= 5;
  return Math.max(40, Math.min(95, base));
}

function formatInspectionDate(d?: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

const SystemDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProperty, user } = useAuth();
  const system = systems.find((s) => s.id === id);
  const details = id ? systemDetails[id] : undefined;
  const [checked, setChecked] = useState<boolean[]>(details ? details.steps.map(() => false) : []);
  const [showPicker, setShowPicker] = useState(false);
  const [scanReview, setScanReview] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [rows, setRows] = useState<DbSystemRow[]>([]);
  const [findingsByLevel, setFindingsByLevel] = useState<Record<number, number>>({});
  const [inspector, setInspector] = useState<{ name: string | null; date: string | null } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareSystemId, setShareSystemId] = useState<string | null>(null);
  // Bumping this triggers a re-fetch of system_details rows after a scan save.
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!activeProperty?.id || !id) { setLoaded(true); return; }
    const matcher = systemMatchers[id];
    if (!matcher) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { data: details } = await supabase
        .from("system_details")
        .select("id, system_name, brand, model, install_date, data_status, status, specs")
        .eq("property_id", activeProperty.id);
      const matched = ((details as any[]) || []).filter((r) => matcher.test(r.system_name)) as DbSystemRow[];

      // Pull inspection findings tied to this system category so the score
      // can react to severity beyond what's stamped in specs.
      const categoryMap: Record<string, string> = { hvac: "hvac", plumbing: "plumbing", electrical: "electrical", roof: "roof" };
      let levelCounts: Record<number, number> = {};
      let inspectorInfo: { name: string | null; date: string | null } | null = null;
      const cat = categoryMap[id];
      if (cat) {
        const { data: f } = await supabase
          .from("inspection_findings")
          .select("level, inspection_record_id")
          .eq("property_id", activeProperty.id)
          .ilike("category", cat);
        for (const row of (f || []) as any[]) {
          const lv = Number(row.level) || 0;
          levelCounts[lv] = (levelCounts[lv] || 0) + 1;
        }
        const recId = (f as any[] | null)?.[0]?.inspection_record_id;
        if (recId) {
          const { data: rec } = await supabase
            .from("property_records")
            .select("ai_extracted_data, document_date")
            .eq("id", recId)
            .maybeSingle();
          const ai = (rec?.ai_extracted_data as any) || {};
          inspectorInfo = {
            name: ai.inspector_name || ai.inspection_report?.inspector?.inspector_name || null,
            date: ai.inspection_date || ai.inspection_report?.inspector?.inspection_date || rec?.document_date || null,
          };
        }
      }

      if (cancelled) return;
      setRows(matched);
      setFindingsByLevel(levelCounts);
      setInspector(inspectorInfo);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [activeProperty?.id, id, refreshTick]);

  // Pull the most useful display fields out of the imported rows.
  const importedView = useMemo(() => {
    if (!rows.length) return null;
    const brand = rows.find((r) => r.brand)?.brand || null;
    const condition = rows.find((r) => r.specs?.condition)?.specs?.condition
      || rows.find((r) => r.specs?.condition_noted)?.specs?.condition_noted
      || null;
    const lastInspectedRaw = rows.find((r) => r.specs?.last_inspected_date)?.specs?.last_inspected_date
      || inspector?.date
      || null;
    const lastInspected = formatInspectionDate(lastInspectedRaw);
    const findingsCount = rows.reduce((sum, r) => sum + (Number(r.specs?.inspector_findings_count) || 0), 0)
      || Object.values(findingsByLevel).reduce((a, b) => a + b, 0);
    const isInspector = rows.some((r) => r.data_status === "inspector_verified");
    const score = scoreFromRows(rows, findingsByLevel);
    return { brand, condition, lastInspected, findingsCount, isInspector, score, inspectorName: inspector?.name || null };
  }, [rows, inspector, findingsByLevel]);

  if (!system || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        System not found.
      </div>
    );
  }

  // A system is "assessed" if either (a) the static demo system has health, or
  // (b) we found inspector_verified / ai_extracted rows in system_details.
  const isAssessed = (system.assessed && system.health !== null) || !!importedView;
  const displayHealth = system.assessed && system.health !== null ? system.health : importedView?.score ?? null;
  const documentedLine = importedView
    ? [importedView.condition, importedView.lastInspected ? `Inspected ${importedView.lastInspected}` : null].filter(Boolean).join(" — ")
    : "";

  const toggleStep = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleScanComplete = (result: ScanResult) => {
    setScanReview(result);
    setScanHistory(prev => [...prev, result]);
  };

  const handleConfirmScan = async (fields: Record<string, string>) => {
    if (!activeProperty?.id || !user?.id || !system) {
      toast.error("Sign in and pick a property first.");
      return;
    }
    try {
      const raw = (scanReview?.data as Record<string, any>) || {};
      const result = await savePhotoAiResult({
        propertyId: activeProperty.id,
        userId: user.id,
        systemName: system.name,
        result: raw,
        overrides: fields,
      });
      if (result.failed > 0 && result.written === 0) {
        toast.error(`Couldn't save any scanned fields to ${system.name}.`);
      } else if (result.failed > 0) {
        toast.warning(`Saved ${result.written} of ${result.written + result.failed} scanned fields — ${result.failed} failed.`);
      } else if (result.written > 0) {
        toast.success(`Saved ${result.written} field${result.written === 1 ? "" : "s"} to ${system.name}.`);
      } else {
        toast.info("Nothing new to save from that scan.");
      }
      setRefreshTick((t) => t + 1);
    } catch (e) {
      console.error("[SystemDetailScreen] scan save failed", e);
      toast.error("Couldn't save scanned data. Please try again.");
    } finally {
      setScanReview(null);
    }
  };

  const handleApplianceFieldsScanned = async (_fields: unknown) => {
    // ApplianceScanner persists PHOTO_AI values internally when propertyId +
    // userId are provided; we just need to refresh the header so the newly
    // saved brand/model/serial show up without a full page reload.
    setRefreshTick((t) => t + 1);
  };

  const openShare = async () => {
    if (!activeProperty?.id || !system) return;
    let sid = rows[0]?.id || null;
    if (!sid) {
      const { data, error } = await supabase
        .from("system_details")
        .insert({ property_id: activeProperty.id, system_name: system.name, data_status: "homeowner_provided" } as any)
        .select("id")
        .single();
      if (error || !data) {
        toast.error("Could not prepare share");
        return;
      }
      sid = (data as any).id;
    }
    setShareSystemId(sid);
    setShowShare(true);
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center gap-3">
          {iconMap[system.id]}
          <h1 className="text-2xl font-bold text-foreground">{system.name}</h1>
        </div>
        <HealthRing percentage={displayHealth} size={130} strokeWidth={9} />
        {importedView ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-medium text-foreground">
              {documentedLine || "Documented from inspection"}
            </span>
            {(importedView.brand || importedView.findingsCount > 0) && (
              <span className="text-xs text-muted-foreground">
                {[importedView.brand, importedView.findingsCount > 0 ? `${importedView.findingsCount} finding${importedView.findingsCount !== 1 ? "s" : ""}` : null].filter(Boolean).join(" · ")}
              </span>
            )}
            {importedView.inspectorName && (
              <span className="text-[11px] text-muted-foreground">Inspector: {importedView.inspectorName}</span>
            )}
            <span className="mt-1 inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {importedView.isInspector ? "Inspector Verified" : "AI Extracted"}
            </span>
          </div>
        ) : isAssessed ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>Last serviced: {details.lastService}</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {systemNotDocumentedLabels[system.id] || "Not Documented"}
          </span>
        )}
        {isAssessed && (
          <div className="mt-2">
            <QuickCheckInButton systemName={system.name} />
          </div>
        )}
      </div>

      {/* Not Assessed prompt — only when there's no system_details row at all */}
      {/* Inspection data summary — shows what the inspection actually captured */}
      {rows.some(r => r.data_status === "inspector_verified") && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4" />
            From your inspection report
          </div>
          {inspector?.name && (
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Inspector: {inspector.name}{inspector.date ? ` · ${inspector.date}` : ""}
            </p>
          )}
          {rows.find(r => r.specs?.condition) && (
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Condition noted: <span className="font-medium">{rows.find(r => r.specs?.condition)?.specs.condition}</span>
            </p>
          )}
          {rows.find(r => r.specs?.inspector_findings_count) && (
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {rows.find(r => r.specs?.inspector_findings_count)?.specs.inspector_findings_count} finding(s) recorded for this system
            </p>
          )}
          {!rows.find(r => r.brand || r.model) && (
            <p className="text-xs text-muted-foreground italic mt-1">
              Brand and model weren't in the report — tap "Add Details" to fill those in manually.
            </p>
          )}
        </div>
      )}

      {loaded && !isAssessed && (
        <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-3 mb-6">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h3 className="text-foreground font-semibold text-sm mb-1">No Data Yet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {systemPrompts[system.id] || `Tell us about your ${system.name} to get an accurate health score.`}
            </p>
          </div>
        </div>
      )}

      {/* Contextual upload prompt */}
      {systemUploadPrompts[system.id] && (
        <UploadPromptCard
          title={systemUploadPrompts[system.id].title}
          description={systemUploadPrompts[system.id].description}
          defaultDocType={systemUploadPrompts[system.id].docType}
          defaultSystemType={system.id}
          className="mb-6"
        />
      )}

      {/* AI Recommendation — ONLY shown when assessed */}
      {isAssessed && (
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-primary font-semibold text-sm mb-1">AI Recommendation</h3>
            <p className="text-sm text-foreground leading-relaxed">{details.aiRecommendation}</p>
          </div>
        </div>
      )}

      {/* Alert — ONLY shown when assessed AND health < 70 */}
      {isAssessed && details.warning && system.health !== null && system.health < 70 && (
        <div className="rounded-xl border-l-4 border-destructive bg-destructive/10 p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-destructive font-semibold text-sm mb-1">Alert</h3>
            <p className="text-sm text-foreground">{details.warning}</p>
          </div>
        </div>
      )}

      {isAssessed && details.warning && system.health !== null && system.health >= 70 && (
        <div className="rounded-xl border-l-4 border-[hsl(var(--health-amber))] bg-[hsl(var(--health-amber))]/10 p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--health-amber))] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[hsl(var(--health-amber))] font-semibold text-sm mb-1">Warning</h3>
            <p className="text-sm text-foreground">{details.warning}</p>
          </div>
        </div>
      )}

      {/* AI Appliance Scanner */}
      <ApplianceScanner
        systemName={system.name}
        propertyId={activeProperty?.id}
        userId={user?.id}
        onFieldsScanned={handleApplianceFieldsScanned}
      />

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="mb-6">
          <ScanHistory scans={scanHistory} />
        </div>
      )}

      {/* DIY Checklist */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h2 className="text-foreground font-semibold text-lg mb-4">DIY Maintenance Checklist</h2>
        <div className="flex flex-col gap-3">
          {details.steps.map((step, i) => (
            <button
              key={i}
              onClick={() => toggleStep(i)}
              className="flex items-start gap-3 text-left group"
            >
              {checked[i] ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
              )}
              <span className={`text-sm ${checked[i] ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {step}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Records Status & Recovery */}
      <div className="mb-6">
        <RecordsStatusSelector systemName={system.name} />
      </div>

      {/* Pending contractor submissions */}
      {activeProperty?.id && rows[0]?.id && (
        <PendingContractorSubmissions
          propertyId={activeProperty.id}
          systemId={rows[0].id}
          systemName={system.name}
        />
      )}

      {/* Share with Contractor */}
      {activeProperty?.id && (
        <button
          onClick={openShare}
          className="w-full mb-6 mt-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors py-3 text-sm font-semibold text-primary flex items-center justify-center gap-2"
        >
          <Share2 className="h-4 w-4" /> Share with a Contractor
        </button>
      )}

      {showShare && shareSystemId && activeProperty?.id && (
        <ContractorShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          propertyId={activeProperty.id}
          systemId={shareSystemId}
          systemName={system.name}
        />
      )}

      {/* Warranty Section */}
      <div className="mb-6">
        <WarrantySection
          systemDetailId={id || ""}
          propertyId={activeProperty?.id || ""}
          systemInfo={{ id: id || "", system_name: system.name, brand: null, model: null, serial_number: null, purchase_date: null, install_date: null }}
        />
      </div>

      {/* Breaker Panel Mapper — Electrical only */}
      {id === "electrical" && (
        <div className="mb-6">
          <BreakerPanelMapper />
        </div>
      )}

      {/* Amazon Affiliate Buttons */}
      {id === "hvac" && (
        <a
          href={`https://www.amazon.com/s?k=hvac+air+filter+16x25x1&tag=${AMAZON_TAG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-xl border border-primary bg-primary/10 py-4 font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <ShoppingCart className="h-5 w-5" /> Buy This Filter on Amazon
        </a>
      )}

      {id === "plumbing" && (
        <a
          href={`https://www.amazon.com/s?k=water+heater+replacement+parts&tag=${AMAZON_TAG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-xl border border-primary bg-primary/10 py-4 font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <ShoppingCart className="h-5 w-5" /> Buy Replacement Parts on Amazon
        </a>
      )}

      {/* Schedule a Pro */}
      <button className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 mb-4">
        Schedule a Pro
      </button>

      {/* Affiliate Disclosure */}
      {(id === "hvac" || id === "plumbing") && (
        <p className="text-[10px] text-muted-foreground/60 text-center mb-4">
          As an Amazon Associate, ComingHomeIQ earns from qualifying purchases.
        </p>
      )}

      {/* Floating AI Scan Button */}
      <FloatingAiScanButton onClick={() => setShowPicker(true)} />

      {/* AI Photo Picker */}
      <AiPhotoPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onPhotoSelected={() => {}}
        onScanComplete={handleScanComplete}
        showReceiptMode={true}
      />

      {/* AI Scan Review */}
      {scanReview && (
        <AiScanReview
          result={scanReview}
          onConfirm={handleConfirmScan}
          onClose={() => setScanReview(null)}
        />
      )}
    </div>
  );
};

export default SystemDetailScreen;
