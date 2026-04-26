import { useState } from "react";
import { AlertOctagon, AlertTriangle, Wrench, Info, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

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
}

export default function InspectionFindingsReview({ data }: Props) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const grouped: Record<1 | 2 | 3 | 4, InspectionFinding[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const f of data.findings || []) {
    if ([1, 2, 3, 4].includes(f.level)) grouped[f.level].push(f);
  }

  const totalFindings = data.findings?.length || 0;

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
                <div className="space-y-2 p-3 pt-1">
                  {items.map((finding) => {
                    const isExpanded = expandedFinding === finding.id;
                    const showCitation = (lvl === 1 || lvl === 2) && finding.standard_citation;
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
                              <p className="text-xs font-semibold text-foreground">{finding.title}</p>
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
    </div>
  );
}