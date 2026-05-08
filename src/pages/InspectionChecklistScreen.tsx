import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, HardHat, BookOpen, AlertTriangle, Wrench, ClipboardList, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { estCost, fmtMoney } from "@/lib/inspectionScoring";
import FindContractorModal from "@/components/FindContractorModal";

export type ChecklistMode = "progress" | "diy" | "fix-list" | "selling";

interface Finding {
  id: string;
  title: string;
  description: string | null;
  recommendation: string | null;
  level: number;
  category: string | null;
  system_category: string | null;
  is_diy: boolean;
  status: string;
  resolved_at: string | null;
  resolution_cost: number | null;
}

const MODE_META: Record<ChecklistMode, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; }> = {
  progress: { title: "Inspection Progress", subtitle: "Track every finding from this report.", icon: ClipboardList },
  diy: { title: "Quick DIY Wins", subtitle: "Things you can fix yourself.", icon: Wrench },
  "fix-list": { title: "Fix Before You Sell", subtitle: "Items every buyer's inspector will flag.", icon: AlertTriangle },
  selling: { title: "Selling As-Is", subtitle: "What buyers will see in disclosure.", icon: Tag },
};

function severityLabel(level: number) {
  if (level === 1) return { label: "Safety", cls: "bg-destructive/15 text-destructive" };
  if (level === 2) return { label: "Recommended", cls: "bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))]" };
  if (level === 3) return { label: "Maintenance", cls: "bg-blue-brain/15 text-blue-brain" };
  return { label: "Cosmetic", cls: "bg-muted text-muted-foreground" };
}

function isResolved(s: string) {
  return s === "resolved" || s === "fixed";
}

function diyKeywordFor(f: Finding): string {
  return (f.system_category || f.category || f.title || "").toLowerCase();
}

interface Props { mode: ChecklistMode; }

export default function InspectionChecklistScreen({ mode }: Props) {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();
  const { activeProperty } = useAuth();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordMeta, setRecordMeta] = useState<{ document_date: string | null; created_at: string | null } | null>(null);
  const [contractorFor, setContractorFor] = useState<Finding | null>(null);

  useEffect(() => {
    if (!inspectionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: rec }, { data: rows }] = await Promise.all([
        supabase
          .from("property_records")
          .select("document_date, created_at")
          .eq("id", inspectionId)
          .maybeSingle(),
        supabase
          .from("inspection_findings")
          .select("id, title, description, recommendation, level, category, system_category, is_diy, status, resolved_at, resolution_cost")
          .eq("inspection_record_id", inspectionId)
          .order("level", { ascending: true })
          .order("title", { ascending: true }),
      ]);
      if (cancelled) return;
      setRecordMeta(rec ?? null);
      setFindings((rows ?? []) as Finding[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [inspectionId]);

  const filtered = useMemo(() => {
    switch (mode) {
      case "diy": return findings.filter((f) => f.is_diy);
      case "fix-list": return findings.filter((f) => f.level === 1 || f.level === 2);
      case "selling": return findings.filter((f) => f.level === 1 && !isResolved(f.status));
      default: return findings;
    }
  }, [findings, mode]);

  const open = filtered.filter((f) => !isResolved(f.status));
  const done = filtered.filter((f) => isResolved(f.status));
  const total = filtered.length;
  const resolvedCount = done.length;
  const pct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const sellingTotalRange = useMemo(() => {
    if (mode !== "selling") return null;
    return filtered.reduce<[number, number]>(
      ([lo, hi], f) => {
        const [a, b] = estCost(f.level);
        return [lo + a, hi + b];
      },
      [0, 0],
    );
  }, [filtered, mode]);

  async function toggle(f: Finding) {
    if (mode === "selling") return;
    const nextStatus = isResolved(f.status) ? "open" : "resolved";
    const resolved_at = nextStatus === "resolved" ? new Date().toISOString() : null;
    setFindings((prev) => prev.map((x) => x.id === f.id ? { ...x, status: nextStatus, resolved_at } : x));
    const { error } = await supabase
      .from("inspection_findings")
      .update({ status: nextStatus, resolved_at })
      .eq("id", f.id);
    if (error) {
      // revert on failure
      setFindings((prev) => prev.map((x) => x.id === f.id ? f : x));
      console.error("Failed to update finding status", error);
    } else {
      window.dispatchEvent(new CustomEvent("inspection-findings-changed"));
      window.dispatchEvent(new CustomEvent("inspection-findings-updated"));
    }
  }

  const meta = MODE_META[mode];
  const Icon = meta.icon;
  const dateLabel = recordMeta?.document_date
    ? new Date(recordMeta.document_date).toLocaleDateString()
    : recordMeta?.created_at
    ? new Date(recordMeta.created_at).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen pb-24 max-w-3xl mx-auto px-6 py-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Go Back
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">
            {meta.subtitle}
            {dateLabel ? ` · From inspection ${dateLabel}` : ""}
          </p>
        </div>
      </div>

      {mode !== "selling" && total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">
              {resolvedCount} of {total} resolved
            </p>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      )}

      {mode === "selling" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 mb-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            {filtered.length} open safety {filtered.length === 1 ? "item" : "items"} require disclosure
          </p>
          {sellingTotalRange && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Likely buyer credit / repair concession range:{" "}
              <span className="font-semibold text-foreground">
                {fmtMoney(sellingTotalRange[0])} – {fmtMoney(sellingTotalRange[1])}
              </span>
            </p>
          )}
          <Button asChild size="sm" className="mt-3">
            <Link to="/handover">See Selling Options</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : total === 0 ? (
        <p className="text-sm text-muted-foreground">No matching findings for this view.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {open.map((f) => (
              <FindingRow
                key={f.id}
                f={f}
                mode={mode}
                onToggle={() => toggle(f)}
                onFindContractor={() => setContractorFor(f)}
              />
            ))}
          </ul>

          {done.length > 0 && mode !== "selling" && (
            <details className="mt-6 rounded-xl border border-border bg-muted/20">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">
                  Completed ({done.length})
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </summary>
              <ul className="px-4 pb-3 space-y-2">
                {done.map((f) => (
                  <FindingRow
                    key={f.id}
                    f={f}
                    mode={mode}
                    onToggle={() => toggle(f)}
                    onFindContractor={() => setContractorFor(f)}
                  />
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <FindContractorModal
        open={!!contractorFor}
        onOpenChange={(o) => !o && setContractorFor(null)}
        findingTitle={contractorFor?.title || ""}
        category={contractorFor?.system_category || contractorFor?.category}
        city={activeProperty?.city || null}
        state={activeProperty?.state || null}
      />
    </div>
  );
}

function FindingRow({
  f,
  mode,
  onToggle,
  onFindContractor,
}: {
  f: Finding;
  mode: ChecklistMode;
  onToggle: () => void;
  onFindContractor: () => void;
}) {
  const sev = severityLabel(f.level);
  const [lo, hi] = estCost(f.level);
  const resolved = isResolved(f.status);
  const readOnly = mode === "selling";

  return (
    <li className={`rounded-xl border p-3 ${resolved ? "border-health-green/30 bg-health-green/5" : "border-border bg-card"}`}>
      <div className="flex items-start gap-3">
        {!readOnly ? (
          <button
            onClick={onToggle}
            aria-label={resolved ? "Mark as open" : "Mark as resolved"}
            className="mt-0.5 shrink-0"
          >
            {resolved ? (
              <CheckCircle2 className="h-5 w-5 text-health-green" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        ) : (
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className={`text-sm font-semibold ${resolved ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {f.title}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.cls}`}>{sev.label}</span>
          </div>
          {f.description && (
            <p className="text-xs text-muted-foreground mb-2">{f.description}</p>
          )}
          {f.recommendation && (
            <p className="text-xs text-foreground/80 mb-2 italic">Recommendation: {f.recommendation}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span>Est. {fmtMoney(lo)} – {fmtMoney(hi)}</span>
            {f.system_category && <span>· {f.system_category}</span>}
          </div>

          {!readOnly && !resolved && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mode === "diy" ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/guides?q=${encodeURIComponent(diyKeywordFor(f))}`}>
                    <BookOpen className="h-3.5 w-3.5" /> See DIY Guide
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onFindContractor}>
                  <HardHat className="h-3.5 w-3.5" /> Find a Contractor
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}