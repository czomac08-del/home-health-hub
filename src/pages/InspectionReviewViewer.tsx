import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Share2, FileText, ListChecks, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InspectionPdfViewer from "@/components/InspectionPdfViewer";
import InspectionFindingsReview, {
  type InspectionReportData,
} from "@/components/InspectionFindingsReview";
import InspectionAnalysisPanel from "@/components/InspectionAnalysisPanel";
import { scoreLabel } from "@/lib/inspectionScoring";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import SEO from "@/components/SEO";
import PrintFindingsButton from "@/components/PrintFindingsButton";
import PrintFindingsReport, { type PrintFilter } from "@/components/PrintFindingsReport";
import { useInspectionFindings } from "@/hooks/useInspectionFindings";

/**
 * /inspection-review/:id/viewer
 * Full-screen split view: original PDF on the left, ComingHomeIQ extracted
 * intelligence on the right. On mobile the panels become tabs.
 */
export default function InspectionReviewViewer() {
  const { id: propertyRecordId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InspectionReportData | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyAddress, setPropertyAddress] = useState<string>("");
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [yearBuilt, setYearBuilt] = useState<string | null>(null);

  const initialPage = searchParams.get("page") ? Number(searchParams.get("page")) : null;
  const [jumpToPage] = useState<number | null>(initialPage);
  const [mobileTab, setMobileTab] = useState<"analysis" | "report">("analysis");

  // Print state — shared between TopBar button and the analysis panel button.
  const [printFilter, setPrintFilter] = useState<PrintFilter>("all");
  const [printableReport, setPrintableReport] = useState<InspectionReportData | null>(null);

  useEffect(() => {
    if (!propertyRecordId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rec, error } = await supabase
        .from("property_records")
        .select("id, property_id, ai_extracted_data, document_date, created_at, storage_path, url, file_name")
        .eq("id", propertyRecordId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !rec) {
        toast.error("Inspection record not found.");
        setLoading(false);
        return;
      }

      const extracted = (rec.ai_extracted_data as any) || null;
      const ir: InspectionReportData | null = extracted?.inspection_report ?? null;
      setReport(ir);
      if (ir) setPrintableReport(ir);
      setPropertyId(rec.property_id);
      setReportDate(rec.document_date ?? rec.created_at ?? null);
      setStoragePath(rec.storage_path ?? null);

      // Resolve a usable URL for the PDF. Prefer a fresh signed URL, fall back to stored url.
      let url: string | null = rec.url ?? null;
      if (rec.storage_path) {
        const { data: signed } = await supabase.storage
          .from("property-records")
          .createSignedUrl(rec.storage_path, 60 * 60); // 1h
        if (signed?.signedUrl) url = signed.signedUrl;
      }
      setReportUrl(url);

      // Pull property address for the top bar.
      if (rec.property_id) {
        const { data: prop } = await supabase
          .from("properties")
          .select("address, year_built")
          .eq("id", rec.property_id)
          .maybeSingle();
        if (prop) {
          setPropertyAddress(prop.address ?? "");
          setYearBuilt(prop.year_built ?? null);
        }
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyRecordId]);

  // Compute overall score badge from open level 1/2 findings in the report payload.
  const score = useMemo(() => {
    const findings = report?.findings ?? [];
    const l1 = findings.filter((f) => f.level === 1).length;
    const l2 = findings.filter((f) => f.level === 2).length;
    return scoreLabel(l1, l2);
  }, [report]);

  // Estimated total for the print summary — mirrors the analysis panel logic.
  const printEstTotal = useMemo(() => {
    const findings = printableReport?.findings ?? [];
    const PRO: Record<string, [number, number]> = {
      plumbing: [200, 1500], electrical: [250, 2500], hvac: [400, 8000],
      roof: [500, 15000], structural: [1000, 10000], exterior: [300, 3000],
      interior: [200, 2000], safety: [150, 800], appliances: [200, 2500], other: [200, 2000],
    };
    const DIY: Record<string, [number, number]> = {
      plumbing: [10, 50], electrical: [5, 30], hvac: [20, 60], exterior: [15, 80],
      interior: [10, 50], safety: [15, 50], roof: [20, 60], appliances: [0, 50],
      structural: [0, 100], other: [10, 60],
    };
    let low = 0, high = 0;
    for (const f of findings) {
      const cat = (f.category || "other").toLowerCase();
      const [l, h] = (f.level <= 2 ? PRO : DIY)[cat] || (f.level <= 2 ? PRO.other : DIY.other);
      low += l; high += h;
    }
    return { low, high };
  }, [printableReport]);

  // DB-backed findings for status (Fixed / In Progress / Unaddressed) on print.
  const { findings: dbFindings } = useInspectionFindings({
    propertyId,
    inspectionRecordId: propertyRecordId ?? null,
    report: printableReport,
  });

  const handleShare = async () => {
    if (!propertyId) return;
    try {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id;
      if (!uid) {
        toast.error("Please sign in again to share.");
        return;
      }
      const { data, error } = await supabase
        .from("certification_shares")
        .insert({ property_id: propertyId, user_id: uid })
        .select("share_token")
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/report/${data.share_token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Share link copied to clipboard");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate share link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading inspection report…
      </div>
    );
  }

  // Mobile-friendly link to open original PDF rather than embed it.
  const openOriginalButton = (
    <Button asChild variant="outline" size="sm" className="h-9">
      <a href={reportUrl ?? "#"} target="_blank" rel="noopener noreferrer">
        <Download className="h-4 w-4" />
        View Original Report
      </a>
    </Button>
  );

  const TopBar = (
    <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => (propertyId ? navigate(`/property`) : navigate(-1))}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Property</span>
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {propertyAddress || "Inspection Report"}
          </p>
          {reportDate && (
            <p className="text-[11px] text-muted-foreground">
              Inspection · {new Date(reportDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${score.cls}`}>
          {score.label}
        </span>

        <Button variant="outline" size="sm" className="h-8" onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share Report</span>
        </Button>

        <PrintFindingsButton
          filter={printFilter}
          onFilterChange={setPrintFilter}
        />

        {reportUrl && (
          <Button asChild variant="outline" size="sm" className="h-8">
            <a href={reportUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </a>
          </Button>
        )}
      </div>
    </div>
  );

  const inspector = report?.inspector;
  const inspectorMeta = inspector ? (
    <p className="text-[11px] text-muted-foreground px-3 py-2 border-b border-border">
      {inspector.inspector_name || "Inspector unknown"}
      {inspector.inspector_company ? ` · ${inspector.inspector_company}` : ""}
      {inspector.inspection_date ? ` · ${inspector.inspection_date}` : ""}
      {propertyRecordId ? ` · Report ID ${propertyRecordId.slice(0, 8)}` : ""}
    </p>
  ) : null;

  // Right panel content shared between desktop and mobile.
  const AnalysisPanel = (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">ComingHomeIQ Analysis</p>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {propertyRecordId && (
          <InspectionAnalysisPanel
            propertyRecordId={propertyRecordId}
            propertyId={propertyId}
            reportUrl={reportUrl}
            storagePath={storagePath}
            initialReport={report}
            yearBuilt={yearBuilt}
            printFilter={printFilter}
            onPrintFilterChange={setPrintFilter}
            onReportLoaded={setPrintableReport}
          />
        )}
        <p className="text-[10px] text-muted-foreground italic border-t border-border pt-3">
          ComingHomeIQ analysis is AI-extracted from the original report shown.
          Always refer to the original report for complete findings. The
          inspector's report is the authoritative source.
        </p>
      </div>
    </div>
  );

  const ReportPanel = (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Original Inspection Report</p>
      </div>
      {inspectorMeta}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          <div className="flex flex-col items-center justify-center h-full p-6 gap-3">
            <p className="text-sm text-muted-foreground text-center">
              For the best reading experience on mobile, open the report in a new tab.
            </p>
            {openOriginalButton}
          </div>
        ) : (
          <InspectionPdfViewer fileUrl={reportUrl} jumpToPage={jumpToPage} />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <SEO
        title="Inspection Report — Side by Side"
        description="Compare the ComingHomeIQ analysis with the original inspection report side by side."
        path={`/inspection-review/${propertyRecordId}/viewer`}
      />
      {TopBar}

      {/* Desktop: split panes; Mobile: tabs */}
      {isMobile ? (
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "analysis" | "report")}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-3 mt-3 grid grid-cols-2">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis" className="flex-1 min-h-0 mt-2">
            {AnalysisPanel}
          </TabsContent>
          <TabsContent value="report" className="flex-1 min-h-0 mt-2">
            {ReportPanel}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 grid grid-cols-2 min-h-0">
          <div className="border-r border-border min-h-0 overflow-hidden">{ReportPanel}</div>
          <div className="min-h-0 overflow-hidden">{AnalysisPanel}</div>
        </div>
      )}

      {/* Print-only block — hidden on screen via #print-findings-root CSS. */}
      {printableReport && (
        <PrintFindingsReport
          report={printableReport}
          dbFindings={dbFindings}
          propertyAddress={propertyAddress}
          yearBuilt={yearBuilt}
          reportDateLabel={reportDate}
          estTotal={printEstTotal}
          scoreLabel={score.label}
          filter={printFilter}
        />
      )}
    </div>
  );
}
