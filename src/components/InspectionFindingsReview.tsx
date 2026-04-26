import { useState } from "react";
import { AlertOctagon, AlertTriangle, Wrench, Info, ChevronDown, ChevronUp, BookOpen, ShieldAlert, UserCheck, Flag, CheckCircle2 } from "lucide-react";
import { DisputeDialog } from "@/components/DisputeDialog";
import FixVerificationModal from "@/components/FixVerificationModal";
import { useInspectionFindings } from "@/hooks/useInspectionFindings";
import { findingKey } from "@/lib/inspectionScoring";
import FindingSourceLink from "@/components/FindingSourceLink";
import { Link } from "react-router-dom";
import { ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface InspectionFinding {
  id: string;
  title: string;
  description?: string;
  location?: string | null;
  category?: string;
  level: 1 | 2 | 3 | 4;
  standard_citation?: string | null;
  standard_source?: string | null;
  rationale?: string;
  confidence?: number;
}

export interface InspectionReportData {
  document_type?: string;
  inspector?: {
    inspector_name?: string | null;
    inspector_company?: string | null;
    inspector_license?: string | null;
    inspection_date?: string | null;
    property_address?: string | null;
  } | null;
  findings: InspectionFinding[];
  summary?: {
    level_1_count: number;
    level_2_count: number;
    level_3_count: number;
    level_4_count: number;
  };
}

const LEVEL_META = {
  1: {
    label: "Must Fix",
    sublabel: "Safety Concern",
    icon: AlertOctagon,
    badgeBg: "bg-destructive/10",
    badgeText: "text-destructive",
    border: "border-destructive/30",
    accent: "bg-destructive",
    description: "Safety hazards, code violations, or items affecting habitability. Typically required to be corrected before closing or negotiated as seller credits.",
  },
  2: {
    label: "Should Fix Before Listing",
    sublabel: "Buyer Negotiation Risk",
    icon: AlertTriangle,
    badgeBg: "bg-[hsl(var(--health-amber))]/10",
    badgeText: "text-[hsl(var(--health-amber))]",
    border: "border-[hsl(var(--health-amber))]/30",
    accent: "bg-[hsl(var(--health-amber))]",
    description: "Every buyer's inspector will flag these. Fixing in advance protects your sale price.",
  },
  3: {
    label: "Recommended",
    sublabel: "Maintenance Items",
    icon: Wrench,
    badgeBg: "bg-[hsl(var(--brain-blue))]/10",
    badgeText: "text-[hsl(var(--brain-blue))]",
    border: "border-[hsl(var(--brain-blue))]/30",
    accent: "bg-[hsl(var(--brain-blue))]",
    description: "Deferred maintenance — not deal-breakers, but worth addressing if time allows.",
  },
  4: {
    label: "Seller's Discretion",
    sublabel: "Negotiable / Cosmetic",
    icon: Info,
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
    border: "border-border",
    accent: "bg-muted-foreground",
    description: "Cosmetic or normal wear for home age. Must be disclosed; fixing is optional.",
  },
} as const;

interface Props {
  data: InspectionReportData;
  /** When true, show the pre-save attribution disclaimer banner. */
  showAttributionDisclaimer?: boolean;
  /** When provided, enables the "Dispute This Finding" button per finding (post-save context). */
  propertyId?: string;
  propertyRecordId?: string;
  /** Direct URL to the original PDF in storage — drives source links and viewer. */
  reportUrl?: string | null;
}

export default function InspectionFindingsReview({ data, showAttributionDisclaimer = false, propertyId, propertyRecordId, reportUrl }: Props) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [disputeFinding, setDisputeFinding] = useState<InspectionFinding | null>(null);
  const [fixFinding, setFixFinding] = useState<{ id: string; title: string } | null>(null);
  const [showFixed, setShowFixed] = useState(false);
  const canDispute = Boolean(propertyId);
  const canMarkFixed = Boolean(propertyId && propertyRecordId);

  // Load DB-backed status when we have a saved record
  const { findings: dbFindings, reload } = useInspectionFindings({
    propertyId: propertyId ?? null,
    inspectionRecordId: propertyRecordId ?? null,
    report: canMarkFixed ? data : null,
  });

  // Map: finding_key → { id, status }
  const dbByKey = new Map(dbFindings.map((d) => [d.finding_key, d]));

  const grouped: Record<1 | 2 | 3 | 4, InspectionFinding[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const f of data.findings || []) {
    if ([1, 2, 3, 4].includes(f.level)) grouped[f.level].push(f);
  }

  // Build a lookup so each finding card knows its DB row + status
  const findingMeta = (f: InspectionFinding, idx: number) => {
    const key = findingKey(f, idx);
    const row = dbByKey.get(key);
    return { dbId: row?.id ?? null, status: (row?.status ?? "open") as "open" | "fixed" | "skipped" };
  };

  const totalFindings = data.findings?.length || 0;
  const inspector = data.inspector || null;
  const inspectorName = inspector?.inspector_name || "Unknown inspector";
  const inspectorCompany = inspector?.inspector_company || "Company not extracted";
  const inspectorLicense = inspector?.inspector_license || null;
  const inspectionDate = inspector?.inspection_date || null;

  if (totalFindings === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No inspection findings could be extracted from this document.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Side-by-side viewer entry point — only when we have a saved record */}
      {propertyRecordId && (
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link to={`/inspection-review/${propertyRecordId}/viewer`}>
              <Maximize2 className="h-3.5 w-3.5" />
              View Side by Side
            </Link>
          </Button>
          {reportUrl && (
            <Button asChild variant="ghost" size="sm" className="h-8">
              <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Original PDF
              </a>
            </Button>
          )}
        </div>
      )}

      {showAttributionDisclaimer && (
        <div className="rounded-xl border border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/10 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-[hsl(var(--health-amber))] shrink-0 mt-0.5" />
            <div className="text-[11px] text-foreground leading-relaxed">
              <p className="font-semibold mb-1">Inspector attribution — please review before saving</p>
              <p className="text-muted-foreground">
                The findings in this report were made by a licensed home inspector at the time of inspection.
                ComingHomeIQ extracts and organizes this information to help you track your home — we do not
                independently verify, certify, or guarantee any inspection finding. All conclusions, severity
                ratings, and recommendations are those of the inspector of record, not ComingHomeIQ or its AI.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1 text-[11px]">
                <p><span className="text-muted-foreground">Inspector:</span> <span className="font-medium text-foreground">{inspectorName}</span></p>
                <p><span className="text-muted-foreground">Company:</span> <span className="font-medium text-foreground">{inspectorCompany}</span></p>
                <p><span className="text-muted-foreground">License:</span> <span className="font-medium text-foreground">{inspectorLicense || "Not present on report"}</span></p>
                <p><span className="text-muted-foreground">Inspection date:</span> <span className="font-medium text-foreground">{inspectionDate || "Not extracted"}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showAttributionDisclaimer && inspector && (inspector.inspector_name || inspector.inspector_company) && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex items-center gap-2">
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Findings reported by{" "}
            <span className="font-medium text-foreground">{inspector.inspector_name || "inspector of record"}</span>
            {inspector.inspector_company && <> · <span className="text-foreground">{inspector.inspector_company}</span></>}
            {inspectorLicense && <> · Lic. {inspectorLicense}</>}
            {inspectionDate && <> · {inspectionDate}</>}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-foreground mb-2">
          {totalFindings} findings categorized by industry standards (ASHI, InterNACHI, NFPA)
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {([1, 2, 3, 4] as const).map((lvl) => {
            const meta = LEVEL_META[lvl];
            const count = grouped[lvl].length;
            return (
              <div key={lvl} className={`rounded-lg ${meta.badgeBg} px-2 py-1.5`}>
                <p className={`text-lg font-bold ${meta.badgeText}`}>{count}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">L{lvl}</p>
              </div>
            );
          })}
        </div>
      </div>

      {([1, 2, 3, 4] as const).map((lvl) => {
        const meta = LEVEL_META[lvl];
        const items = grouped[lvl];
        if (items.length === 0) return null;
        const Icon = meta.icon;
        const isOpen = expandedLevel === lvl;

        return (
          <div key={lvl} className={`rounded-xl border ${meta.border} bg-card overflow-hidden`}>
            <button
              onClick={() => setExpandedLevel(isOpen ? null : lvl)}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
            >
              <div className={`h-8 w-8 rounded-full ${meta.badgeBg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${meta.badgeText}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">
                  Level {lvl} — {meta.label}
                  <span className={`ml-2 text-xs ${meta.badgeText}`}>({items.length})</span>
                </p>
                <p className="text-[10px] text-muted-foreground">{meta.sublabel}</p>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {isOpen && (
              <div className="border-t border-border">
                <p className="px-3 pt-3 pb-2 text-[10px] text-muted-foreground italic">
                  {meta.description}
                </p>
                {canMarkFixed && items.some((f, i) => findingMeta(f, i).status === "fixed") && (
                  <div className="px-3 pb-2 -mt-1">
                    <button
                      onClick={() => setShowFixed((v) => !v)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      {showFixed ? "Hide fixed items" : "View fixed items"}
                    </button>
                  </div>
                )}
                <div className="space-y-2 p-3 pt-1">
                  {items.map((finding) => {
                    const isExpanded = expandedFinding === finding.id;
                    const showCitation = (lvl === 1 || lvl === 2) && finding.standard_citation;
                    const idxInLevel = items.indexOf(finding);
                    const { dbId, status } = findingMeta(finding, idxInLevel);
                    if (status === "fixed" && !showFixed) return null;
                    return (
                      <div
                        key={finding.id}
                        className={`rounded-lg border ${meta.border} bg-background overflow-hidden`}
                      >
                        <button
                          onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                          className="w-full text-left p-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-1 self-stretch rounded-full ${meta.accent} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                {status === "fixed" && <CheckCircle2 className="h-3 w-3 text-health-green" />}
                                <span className={status === "fixed" ? "line-through text-muted-foreground" : ""}>
                                  {finding.title}
                                </span>
                              </p>
                              {finding.location && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">📍 {finding.location}</p>
                              )}
                              {showCitation && (
                                <div className="mt-1.5 flex items-start gap-1">
                                  <BookOpen className={`h-3 w-3 ${meta.badgeText} shrink-0 mt-0.5`} />
                                  <p className={`text-[10px] ${meta.badgeText} font-medium leading-tight`}>
                                    {finding.standard_citation}
                                  </p>
                                </div>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                            {finding.description && (
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                                  Report Says
                                </p>
                                <p className="text-xs text-foreground">{finding.description}</p>
                              </div>
                            )}
                            {finding.rationale && (
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                                  Why This Level
                                </p>
                                <p className="text-xs text-foreground">{finding.rationale}</p>
                              </div>
                            )}
                            {finding.standard_source && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText} font-semibold`}>
                                  {finding.standard_source}
                                </span>
                                {finding.category && (
                                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                                    {finding.category}
                                  </span>
                                )}
                              </div>
                            )}
                            <FindingSourceLink
                              inspectorName={inspector?.inspector_name}
                              inspectionDate={inspectionDate}
                              reportUrl={reportUrl ?? null}
                              propertyRecordId={propertyRecordId ?? null}
                              findingId={finding.id}
                            />
                            {canDispute && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDisputeFinding(finding);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
                              >
                                <Flag className="h-3 w-3" />
                                Dispute This Finding
                              </button>
                            )}
                            {canMarkFixed && status !== "fixed" && dbId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFixFinding({ id: dbId, title: finding.title });
                                }}
                                className="mt-2 ml-3 inline-flex items-center gap-1 text-[10px] font-semibold text-health-green hover:underline"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Mark as Fixed
                              </button>
                            )}
                            {status === "fixed" && (
                              <p className="mt-2 text-[10px] text-health-green font-medium">
                                ✅ Fixed — record saved permanently
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[10px] text-muted-foreground text-center pt-1">
        Severity assigned via ASHI, InterNACHI, NFPA, NEC, and IRC standards — never by AI judgment alone.
      </p>

      {canDispute && propertyId && (
        <DisputeDialog
          open={!!disputeFinding}
          onOpenChange={(o) => !o && setDisputeFinding(null)}
          propertyId={propertyId}
          propertyRecordId={propertyRecordId}
          findingId={disputeFinding?.id ?? null}
          inspectorFindingText={
            disputeFinding ? `${disputeFinding.title}${disputeFinding.description ? " — " + disputeFinding.description : ""}` : null
          }
        />
      )}

      {canMarkFixed && propertyId && fixFinding && (
        <FixVerificationModal
          open={!!fixFinding}
          onOpenChange={(o) => !o && setFixFinding(null)}
          propertyId={propertyId}
          findingId={fixFinding.id}
          findingTitle={fixFinding.title}
          onSubmitted={() => {
            reload();
            window.dispatchEvent(new CustomEvent("inspection-findings-changed"));
          }}
        />
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Conflicting data?</span> If a finding conflicts with
          county records or previous entries, ComingHomeIQ shows both sources. Conflicts between inspector
          findings and public records are the responsibility of the licensed inspector of record, not ComingHomeIQ.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          ComingHomeIQ is an information platform. We organize what inspectors, government agencies, and you tell us.
          We are not responsible for conditions that develop after the inspection date, for issues a visual inspection
          could not detect, or for any actions taken or not taken based on this information. Always consult licensed
          professionals before making repair or purchase decisions.
        </p>
      </div>
    </div>
  );
}