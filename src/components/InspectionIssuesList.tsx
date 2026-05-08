import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AlertOctagon, AlertTriangle, Wrench, Info, CheckCircle2, Clock, Loader2 } from "lucide-react";
import ResolveFindingDialog from "@/components/ResolveFindingDialog";
import { isResolvedStatus } from "@/lib/inspectionScoring";

interface Row {
  id: string;
  title: string;
  description: string | null;
  level: number;
  severity_label: string | null;
  system_category: string | null;
  category: string | null;
  location_in_home: string | null;
  inspector_recommendation: string | null;
  recommendation: string | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  source_document_id: string | null;
}

interface Props {
  propertyId: string;
  /** Optional document filter — limit to one inspection report. */
  sourceDocumentId?: string;
  /** Hide the section if there are no findings at all. */
  hideWhenEmpty?: boolean;
}

const SEVERITY_META: Record<number, { label: string; icon: any; tone: string; emoji: string }> = {
  1: { label: "Safety Issues", icon: AlertOctagon, tone: "text-destructive", emoji: "🔴" },
  2: { label: "Major Issues", icon: AlertTriangle, tone: "text-[hsl(var(--health-amber))]", emoji: "🟠" },
  3: { label: "Minor Issues", icon: Wrench, tone: "text-health-green", emoji: "🟡" },
  4: { label: "Informational", icon: Info, tone: "text-muted-foreground", emoji: "ℹ️" },
};

export default function InspectionIssuesList({ propertyId, sourceDocumentId, hideWhenEmpty }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<{ row: Row; mode: "resolve" | "in_progress" } | null>(null);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    let q = supabase
      .from("inspection_findings")
      .select("id,title,description,level,severity_label,system_category,category,location_in_home,inspector_recommendation,recommendation,status,resolved_at,resolved_by,source_document_id")
      .eq("property_id", propertyId)
      .order("level", { ascending: true });
    if (sourceDocumentId) {
      q = q.eq("inspection_record_id", sourceDocumentId);
    }
    const { data } = await q;
    setRows(((data as any) || []) as Row[]);
    setLoading(false);
  }, [propertyId, sourceDocumentId]);

  useEffect(() => {
    void reload();
    const onUpdated = () => { void reload(); };
    window.addEventListener("inspection-findings-updated", onUpdated);
    return () => window.removeEventListener("inspection-findings-updated", onUpdated);
  }, [reload]);

  const grouped = useMemo(() => {
    const out: Record<number, Row[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const r of rows) {
      const lv = (r.level >= 1 && r.level <= 4) ? r.level : 4;
      out[lv].push(r);
    }
    return out;
  }, [rows]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading inspection issues…
      </div>
    );
  }

  if (rows.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No inspection findings yet. Upload an inspection report to populate this list.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {[1, 2, 3, 4].map((lv) => {
        const list = grouped[lv];
        if (!list || list.length === 0) return null;
        const meta = SEVERITY_META[lv];
        const Icon = meta.icon;
        const openCount = list.filter((r) => !isResolvedStatus(r.status as any) && r.status !== "dismissed").length;
        return (
          <section key={lv} className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="px-4 py-2.5 flex items-center gap-2 border-b border-border">
              <Icon className={`h-4 w-4 ${meta.tone}`} />
              <h3 className="text-sm font-semibold text-foreground">{meta.emoji} {meta.label}</h3>
              <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                {openCount} open · {list.length} total
              </span>
            </header>
            <ul className="divide-y divide-border">
              {list.map((r) => {
                const resolved = isResolvedStatus(r.status as any);
                const inProgress = r.status === "in_progress";
                const dismissed = r.status === "dismissed";
                const monitoring = r.status === "monitoring";
                return (
                  <li key={r.id} className="px-4 py-3 flex gap-3">
                    <div className="pt-0.5">
                      <Checkbox
                        checked={resolved}
                        disabled={resolved}
                        onCheckedChange={(v) => {
                          if (v && !resolved) setTarget({ row: r, mode: "resolve" });
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${resolved ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {r.title}
                        </p>
                        {(r.system_category || r.category) && (
                          <span className="text-[10px] uppercase tracking-wide bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                            {r.system_category || r.category}
                          </span>
                        )}
                        {r.location_in_home && (
                          <span className="text-[10px] text-muted-foreground italic">{r.location_in_home}</span>
                        )}
                        <StatusPill status={r.status} />
                      </div>
                      {r.description && !resolved && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                      )}
                      {(r.inspector_recommendation || r.recommendation) && !resolved && (
                        <p className="text-[11px] text-foreground/80 mt-1">
                          <span className="font-semibold">Recommendation:</span> {r.inspector_recommendation || r.recommendation}
                        </p>
                      )}
                      {resolved && r.resolved_at && (
                        <p className="text-[11px] text-health-green mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved {new Date(r.resolved_at).toLocaleDateString()}
                          {r.resolved_by ? ` · ${r.resolved_by.replace("_", " ")}` : ""}
                        </p>
                      )}

                      {!resolved && !dismissed && !monitoring && (
                        <div className="flex items-center gap-2 mt-2">
                          {!inProgress && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => setTarget({ row: r, mode: "in_progress" })}
                            >
                              <Clock className="h-3 w-3" /> Mark as In Progress
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => setTarget({ row: r, mode: "resolve" })}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <ResolveFindingDialog
        open={!!target}
        onOpenChange={(v) => { if (!v) setTarget(null); }}
        finding={target ? { id: target.row.id, title: target.row.title } : null}
        mode={target?.mode || "resolve"}
        onSaved={() => void reload()}
      />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: "Open", cls: "bg-muted text-muted-foreground" },
    in_progress: { label: "In Progress", cls: "bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))]" },
    resolved: { label: "Resolved", cls: "bg-health-green/15 text-health-green" },
    fixed: { label: "Resolved", cls: "bg-health-green/15 text-health-green" },
    dismissed: { label: "Not Applicable", cls: "bg-muted text-muted-foreground" },
    skipped: { label: "Skipped", cls: "bg-muted text-muted-foreground" },
    monitoring: { label: "Monitoring", cls: "bg-primary/10 text-primary" },
  };
  const m = map[status] || map.open;
  return <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${m.cls}`}>{m.label}</span>;
}