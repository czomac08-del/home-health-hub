import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Wrench, ClipboardList, Tag, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { InspectionFinding, InspectionReportData } from "@/components/InspectionFindingsReview";

interface Props {
  propertyId: string;
}

type FindingStatus = "open" | "fixed" | "skipped";

/**
 * Heuristic DIY classification: short, low-cost items typically L3/L4 + keyword match
 * (filter, battery, caulk, tighten, clean, lubricate, replace bulb, weatherstrip, etc.)
 */
const DIY_KEYWORDS = [
  "filter", "battery", "batteries", "caulk", "weatherstrip", "weather-strip",
  "tighten", "lubricate", "clean", "bulb", "smoke alarm battery", "co alarm",
  "gutter", "downspout", "screen", "vent cover", "register", "trim", "paint",
  "door stop", "hinge", "doorbell", "outlet cover", "switch plate",
];
function isDiy(f: InspectionFinding): boolean {
  if (f.level === 1) return false; // safety items go to a pro
  const t = `${f.title} ${f.description ?? ""}`.toLowerCase();
  return DIY_KEYWORDS.some((k) => t.includes(k));
}

function scoreLabel(l1: number, l2: number, total: number): { label: string; cls: string } {
  if (l1 >= 3) return { label: "CRITICAL", cls: "bg-destructive text-destructive-foreground" };
  if (l1 >= 1) return { label: "POOR", cls: "bg-destructive/80 text-destructive-foreground" };
  if (l2 >= 5) return { label: "FAIR", cls: "bg-[hsl(var(--health-amber))] text-background" };
  if (total > 0) return { label: "GOOD", cls: "bg-health-green text-background" };
  return { label: "GOOD", cls: "bg-health-green text-background" };
}

function estCost(f: InspectionFinding): [number, number] {
  // Rough industry-style ranges by level. These are display-only ballparks.
  if (f.level === 1) return [400, 2500];
  if (f.level === 2) return [200, 1200];
  return [75, 400];
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function InspectionAlertBanner({ propertyId }: Props) {
  const navigate = useNavigate();
  const [report, setReport] = useState<InspectionReportData | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, FindingStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("property_records")
        .select("id, ai_extracted_data, document_date, created_at")
        .eq("property_id", propertyId)
        .eq("system_type", "inspection")
        .order("document_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const extracted = (data?.ai_extracted_data as any) || null;
      const ir: InspectionReportData | null = extracted?.inspection_report ?? null;
      setReport(ir);
      setRecordId(data?.id ?? null);
      setReportDate(data?.document_date ?? data?.created_at ?? null);
      // Load per-finding status from localStorage (lightweight tracking).
      try {
        const raw = localStorage.getItem(`inspection_status_${data?.id ?? ""}`);
        setStatusMap(raw ? JSON.parse(raw) : {});
      } catch {
        setStatusMap({});
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  const inspectorName = report?.inspector?.inspector_name ?? null;

  const findings = report?.findings ?? [];
  const openFindings = useMemo(
    () => findings.filter((f) => (statusMap[f.id] ?? "open") === "open"),
    [findings, statusMap],
  );

  const l1Open = openFindings.filter((f) => f.level === 1);
  const l2Open = openFindings.filter((f) => f.level === 2);
  const diyOpen = openFindings.filter(isDiy);
  const proOpen = [...l1Open, ...l2Open];

  const proCostRange = proOpen.reduce<[number, number]>(
    ([lo, hi], f) => {
      const [a, b] = estCost(f);
      return [lo + a, hi + b];
    },
    [0, 0],
  );

  const summary = report?.summary;
  const score = scoreLabel(
    summary?.level_1_count ?? findings.filter((f) => f.level === 1).length,
    summary?.level_2_count ?? findings.filter((f) => f.level === 2).length,
    findings.length,
  );

  if (loading || !report || findings.length === 0) return null;

  // All resolved → collapsed green bar.
  const anyUnresolvedHighPriority = openFindings.some((f) => f.level === 1 || f.level === 2);
  if (!anyUnresolvedHighPriority) {
    return (
      <div className="rounded-xl border border-health-green/40 bg-health-green/10 p-3 mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-health-green shrink-0" />
        <p className="text-sm font-medium text-foreground">Inspection review complete</p>
      </div>
    );
  }

  const dateLabel = reportDate ? new Date(reportDate).toLocaleDateString() : "Date unknown";
  const safetyDisclosureCount = l1Open.length;
  // Buyer credit ballpark: midpoint of pro range, rounded to nearest $250.
  const buyerCreditMid = Math.round(((proCostRange[0] + proCostRange[1]) / 2) / 250) * 250;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6">
      {/* Headline */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Inspection uploaded · {dateLabel}
            {inspectorName ? <> · {inspectorName}</> : null}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Review what to fix yourself, what to hire out, and what buyers will see.
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${score.cls}`}>
          {score.label}
        </span>
      </div>

      {/* Three quick-action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* DIY */}
        <ActionCard
          icon={<Wrench className="h-4 w-4 text-[hsl(var(--brain-blue))]" />}
          title={`${diyOpen.length} things you can fix yourself`}
          subtitle="Quick DIY Wins"
          items={diyOpen.slice(0, 3).map((f) => f.title)}
          ctaLabel="See Full DIY List"
          onClick={() => navigate(`/property/inspection?tab=diy${recordId ? `&record=${recordId}` : ""}`)}
          accent="brain-blue"
        />

        {/* Hire a Pro */}
        <ActionCard
          icon={<ClipboardList className="h-4 w-4 text-[hsl(var(--health-amber))]" />}
          title={`${proOpen.length} items recommended before selling`}
          subtitle="Fix Before You List"
          items={proOpen.slice(0, 3).map((f) => f.title)}
          ctaLabel="See Full Fix List"
          onClick={() => navigate(`/property/inspection?tab=pro${recordId ? `&record=${recordId}` : ""}`)}
          accent="health-amber"
          footer={
            proOpen.length > 0
              ? `Estimated combined: ${fmtMoney(proCostRange[0])} – ${fmtMoney(proCostRange[1])}`
              : undefined
          }
        />

        {/* Selling As-Is */}
        <ActionCard
          icon={<Tag className="h-4 w-4 text-primary" />}
          title="Here's what buyers will see"
          subtitle="Selling As-Is?"
          items={[
            `${safetyDisclosureCount} safety item${safetyDisclosureCount === 1 ? "" : "s"} require disclosure`,
            buyerCreditMid > 0
              ? `Expect ~${fmtMoney(buyerCreditMid)} buyer credit requests`
              : "Minimal buyer credit risk",
          ]}
          ctaLabel="See Selling Options"
          onClick={() => navigate(`/property/inspection?tab=selling${recordId ? `&record=${recordId}` : ""}`)}
          accent="primary"
        />
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  items,
  ctaLabel,
  onClick,
  footer,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: string[];
  ctaLabel: string;
  onClick: () => void;
  footer?: string;
  accent: "brain-blue" | "health-amber" | "primary";
}) {
  const ringCls =
    accent === "brain-blue"
      ? "border-[hsl(var(--brain-blue))]/30"
      : accent === "health-amber"
      ? "border-[hsl(var(--health-amber))]/30"
      : "border-primary/30";

  return (
    <div className={`rounded-xl border ${ringCls} bg-card p-3 flex flex-col`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {subtitle}
        </p>
      </div>
      <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((it, i) => (
            <li key={i} className="text-[11px] text-muted-foreground line-clamp-1">
              • {it}
            </li>
          ))}
        </ul>
      )}
      {footer && (
        <p className="mt-2 text-[10px] text-foreground/80 font-medium">{footer}</p>
      )}
      <button
        onClick={onClick}
        className="mt-3 inline-flex items-center justify-between gap-1 rounded-lg bg-secondary/60 hover:bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors"
      >
        {ctaLabel}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}