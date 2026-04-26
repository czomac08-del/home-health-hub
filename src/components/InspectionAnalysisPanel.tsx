import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, AlertTriangle, Wrench, BarChart3, HardHat, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { InspectionReportData, InspectionFinding } from "@/components/InspectionFindingsReview";
import AddToProfileModal from "@/components/AddToProfileModal";
import PrintFindingsButton from "@/components/PrintFindingsButton";
import type { PrintFilter } from "@/components/PrintFindingsReport";

interface Props {
  propertyRecordId: string;
  propertyId: string | null;
  reportUrl: string | null;
  storagePath: string | null;
  initialReport: InspectionReportData | null;
  yearBuilt?: string | null;
  /** Print filter is owned by the parent so a single PrintFindingsReport is mounted once. */
  printFilter?: PrintFilter;
  onPrintFilterChange?: (f: PrintFilter) => void;
  /** Called once extraction completes so the parent can render the print payload. */
  onReportLoaded?: (r: InspectionReportData) => void;
  /** Jump the linked PDF viewer to a specific page (used by "→ Page N" finding links). */
  onJumpToPage?: (page: number) => void;
}

type Phase = "ready" | "extracting" | "done" | "error";

// Plain-English cost estimates by category — kept conservative and labeled "Est."
const DIY_COST: Record<string, string> = {
  plumbing: "$10–$50 in parts",
  electrical: "$5–$30 in parts",
  hvac: "$20–$60 (filter / cleaning)",
  exterior: "$15–$80 (caulk / paint)",
  interior: "$10–$50",
  safety: "$15–$50 (detector / battery)",
  roof: "$20–$60 (sealant)",
  appliances: "$0–$50",
  structural: "$0–$100",
  other: "$10–$60",
};
const PRO_COST: Record<string, string> = {
  plumbing: "$200–$1,500",
  electrical: "$250–$2,500",
  hvac: "$400–$8,000",
  roof: "$500–$15,000",
  structural: "$1,000–$10,000+",
  exterior: "$300–$3,000",
  interior: "$200–$2,000",
  safety: "$150–$800",
  appliances: "$200–$2,500",
  other: "$200–$2,000",
};

function diyCost(f: InspectionFinding) {
  return DIY_COST[(f.category || "other").toLowerCase()] || DIY_COST.other;
}
function proCost(f: InspectionFinding) {
  return PRO_COST[(f.category || "other").toLowerCase()] || PRO_COST.other;
}
function whyItMatters(f: InspectionFinding) {
  if (f.level === 1) return "This is a safety issue.";
  if ((f.category || "").toLowerCase() === "structural") return "Could affect sale price.";
  return "Buyers will flag this.";
}
// Crude total estimator — sum mid-points of pro ranges for major + DIY for minor.
function estimateTotal(findings: InspectionFinding[]): { low: number; high: number } {
  let low = 0, high = 0;
  for (const f of findings) {
    const range = f.level <= 2 ? proCost(f) : diyCost(f);
    const m = range.match(/\$([\d,]+)\s*[–-]\s*\$?([\d,]+)/);
    if (!m) continue;
    low += parseInt(m[1].replace(/,/g, ""), 10);
    high += parseInt(m[2].replace(/,/g, ""), 10);
  }
  return { low, high };
}
function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n.toLocaleString()}`;
}

export default function InspectionAnalysisPanel({
  propertyRecordId,
  propertyId,
  reportUrl,
  storagePath,
  initialReport,
  yearBuilt,
  printFilter = "all",
  onPrintFilterChange,
  onReportLoaded,
  onJumpToPage,
}: Props) {
  const [report, setReport] = useState<InspectionReportData | null>(initialReport);
  const [phase, setPhase] = useState<Phase>(initialReport ? "done" : "ready");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPrompted, setImportPrompted] = useState(false);
  const [showAllMinor, setShowAllMinor] = useState(false);
  const [showAllMajor, setShowAllMajor] = useState(false);

  // Notify parent whenever the report becomes available (for printing).
  useEffect(() => {
    if (report && onReportLoaded) onReportLoaded(report);
  }, [report, onReportLoaded]);

  // Auto-trigger extraction on first mount when no analysis exists yet.
  useEffect(() => {
    if (initialReport || phase !== "ready") return;
    void runExtraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runExtraction(force = false) {
    if (!reportUrl && !storagePath) {
      setPhase("error");
      setErrMsg("Original PDF not found in storage.");
      return;
    }
    setPhase("extracting");
    setErrMsg(null);
    try {
      // Get a fresh signed URL for the edge function to fetch.
      let docUrl = reportUrl;
      if (storagePath) {
        const { data: signed } = await supabase.storage
          .from("property-records")
          .createSignedUrl(storagePath, 60 * 30);
        if (signed?.signedUrl) docUrl = signed.signedUrl;
      }
      if (!docUrl) throw new Error("No accessible document URL");

      const { data, error } = await supabase.functions.invoke("extract-document-data", {
        body: { documentUrl: docUrl, systemType: "inspection_report", source: "homeowner" },
      });
      if (error) throw error;
      const rep = data?.inspectionReport ?? null;
      if (!rep || !Array.isArray(rep.findings)) {
        throw new Error("AI did not return inspection findings");
      }

      // Persist permanently so we don't re-run.
      const merged = { ...(data?.extracted || {}), inspection_report: rep };
      await supabase
        .from("property_records")
        .update({ ai_extracted_data: merged, ai_verified: true })
        .eq("id", propertyRecordId);

      setReport(rep);
      setPhase("done");
      onReportLoaded?.(rep);
      if (!importPrompted && !force) {
        setImportPrompted(true);
        // Slight delay so the panel renders before the modal slides up.
        setTimeout(() => setShowImportModal(true), 600);
      }
    } catch (e: any) {
      console.error("extract-document-data failed", e);
      setPhase("error");
      setErrMsg(e?.message || "Unknown error");
    }
  }

  const findings = report?.findings ?? [];
  const minor = useMemo(() => findings.filter((f) => f.level >= 3), [findings]);
  const major = useMemo(() => findings.filter((f) => f.level <= 2), [findings]);
  const totals = useMemo(() => estimateTotal(findings), [findings]);

  // ---------- Loading / error / empty states ----------
  if (phase === "extracting") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <Sparkles className="h-10 w-10 text-primary mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-foreground">
          Analyzing your inspection report with AI…
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          This usually takes 30–60 seconds for a full report. We'll save the results so you only pay for this once.
        </p>
        <Loader2 className="h-5 w-5 text-primary animate-spin mt-4" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-semibold text-foreground">
          We had trouble reading this report automatically.
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          You can still view the original on the left. Try again or contact support.
        </p>
        {errMsg && <p className="text-[10px] text-muted-foreground mt-2 italic">{errMsg}</p>}
        <Button size="sm" className="mt-4" onClick={() => runExtraction(true)}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    );
  }

  if (!report || findings.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm text-muted-foreground">
          No findings were extracted from this report.
        </p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => runExtraction(true)}>
          <RefreshCw className="h-3.5 w-3.5" /> Run extraction again
        </Button>
      </div>
    );
  }

  const minorVisible = showAllMinor ? minor : minor.slice(0, 10);
  const majorVisible = showAllMajor ? major : major.slice(0, 10);

  // Build top-2/3 issue titles for the summary paragraph.
  const topIssues = major.slice(0, 3).map((f) => f.title.toLowerCase()).join(", ");
  const yearText = yearBuilt ? `This ${yearBuilt} home` : "This home";

  return (
    <div className="space-y-5">
      {/* Print / Save PDF — top of the findings panel */}
      {onPrintFilterChange && (
        <div className="flex items-center justify-end">
          <PrintFindingsButton filter={printFilter} onFilterChange={onPrintFilterChange} />
        </div>
      )}

      {/* SECTION A — MINOR */}
      <section className="rounded-xl border border-health-green/30 overflow-hidden">
        <header className="bg-health-green/10 px-3 py-2 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-health-green" />
          <div>
            <p className="text-sm font-bold text-foreground">Minor Repairs</p>
            <p className="text-[11px] text-muted-foreground">
              Things you can likely handle yourself or are low cost to fix
            </p>
          </div>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-health-green/20 text-health-green">
            {minor.length}
          </span>
        </header>
        <ul className="divide-y divide-border">
          {minorVisible.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">No minor items found.</li>
          )}
          {minorVisible.map((f) => (
            <li key={f.id} className="px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">{f.title}</p>
              {f.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.description}</p>
              )}
              {f.page_reference && onJumpToPage && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(f.page_reference as number)}
                  className="text-[11px] font-medium text-primary hover:underline mt-1"
                >
                  → Page {f.page_reference}
                </button>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">Est. DIY: {diyCost(f)}</p>
            </li>
          ))}
        </ul>
        {minor.length > 10 && (
          <button
            className="w-full text-xs text-primary py-2 hover:bg-muted/40"
            onClick={() => setShowAllMinor((v) => !v)}
          >
            {showAllMinor ? "Show fewer" : `Show all ${minor.length} minor items →`}
          </button>
        )}
      </section>

      {/* SECTION B — MAJOR */}
      <section className="rounded-xl border border-destructive/30 overflow-hidden">
        <header className="bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <div>
            <p className="text-sm font-bold text-foreground">Major Repairs</p>
            <p className="text-[11px] text-muted-foreground">
              These need professional attention before listing or buying
            </p>
          </div>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
            {major.length}
          </span>
        </header>
        <ul className="divide-y divide-border">
          {majorVisible.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">No major items found. Great news!</li>
          )}
          {majorVisible.map((f) => (
            <li key={f.id} className="px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">{f.title}</p>
              {f.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.description}</p>
              )}
              {f.page_reference && onJumpToPage && (
                <button
                  type="button"
                  onClick={() => onJumpToPage(f.page_reference as number)}
                  className="text-[11px] font-medium text-primary hover:underline mt-1"
                >
                  → Page {f.page_reference}
                </button>
              )}
              <p className="text-[11px] text-destructive/80 mt-1 italic">{whyItMatters(f)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Est. Pro Repair: {proCost(f)}</p>
            </li>
          ))}
        </ul>
        {major.length > 10 && (
          <button
            className="w-full text-xs text-primary py-2 hover:bg-muted/40"
            onClick={() => setShowAllMajor((v) => !v)}
          >
            {showAllMajor ? "Show fewer" : `Show all ${major.length} major items →`}
          </button>
        )}
      </section>

      {/* SECTION C — OVERALL */}
      <section className="rounded-xl border border-[hsl(var(--navy))]/30 overflow-hidden">
        <header className="bg-[hsl(var(--navy))]/10 px-3 py-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[hsl(var(--navy))]" />
          <p className="text-sm font-bold text-foreground">Overall Summary</p>
        </header>
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <p className="text-lg font-bold text-foreground">{minor.length}</p>
              <p className="text-[10px] text-muted-foreground">Minor Items</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <p className="text-lg font-bold text-foreground">{major.length}</p>
              <p className="text-[10px] text-muted-foreground">Major Items</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <p className="text-sm font-bold text-foreground">
                {totals.low > 0 ? `${fmt(totals.low)}–${fmt(totals.high)}` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Est. Total Repair</p>
            </div>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {yearText} has {findings.length} finding{findings.length !== 1 ? "s" : ""} total.
            {topIssues
              ? ` The most urgent issues are ${topIssues}.`
              : " No major issues were flagged."}
            {minor.length > 0 &&
              " The majority of minor items can be handled with basic DIY skills or routine maintenance."}
          </p>
        </div>
      </section>

      {/* CONTRACTOR CTA */}
      <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <HardHat className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Need help with any of these repairs?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We can help you find licensed contractors for HVAC, electrical, plumbing, and more.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/home-defense?tab=hire">Find a Contractor in My Area</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* "Add to Profile" entry point if user dismissed initial prompt */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowImportModal(true)}
      >
        <Sparkles className="h-4 w-4" />
        Add findings to my property profile
      </Button>

      <AddToProfileModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        recordId={propertyRecordId}
      />
    </div>
  );
}
