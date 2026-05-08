import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, ChevronRight } from "lucide-react";

interface Props { propertyId: string; }

export default function InspectionProgressCard({ propertyId }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<{ total: number; resolved: number; openSafety: number; openMajor: number; date: string | null } | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    (async () => {
      const [{ data: rec }, { data: findings }] = await Promise.all([
        supabase
          .from("property_records")
          .select("id, document_date, created_at, record_type")
          .eq("property_id", propertyId)
          .ilike("record_type", "%inspection%")
          .order("document_date", { ascending: false })
          .limit(1),
        supabase
          .from("inspection_findings")
          .select("level, status")
          .eq("property_id", propertyId),
      ]);
      if (cancelled) return;
      const list = (findings || []) as Array<{ level: number; status: string }>;
      if (list.length === 0) { setData(null); return; }
      const isResolved = (s: string) => s === "resolved" || s === "fixed";
      const isInactive = (s: string) => s === "dismissed" || s === "skipped";
      const counted = list.filter((r) => !isInactive(r.status));
      const total = counted.length;
      const resolved = counted.filter((r) => isResolved(r.status)).length;
      const openSafety = counted.filter((r) => r.level === 1 && !isResolved(r.status)).length;
      const openMajor = counted.filter((r) => r.level === 2 && !isResolved(r.status)).length;
      const latest = (rec || [])[0] as any;
      setData({ total, resolved, openSafety, openMajor, date: latest?.document_date || latest?.created_at || null });
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  if (!data || data.total === 0) return null;

  const pct = Math.round((data.resolved / data.total) * 100);
  const tone =
    data.openSafety > 0 ? "border-destructive/40 bg-destructive/5"
    : data.openMajor > 0 ? "border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/5"
    : "border-health-green/40 bg-health-green/5";

  return (
    <button
      onClick={() => navigate(`/property/${propertyId}#issues`)}
      className={`w-full text-left rounded-2xl border p-4 ${tone} transition-colors hover:bg-muted/30`}
    >
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="h-4 w-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">Inspection Progress</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {data.date ? `Inspection from ${new Date(data.date).toLocaleDateString()}` : "Latest inspection"}
      </p>
      <p className="text-sm text-foreground mb-1">
        <span className="font-bold">{data.resolved}</span> of <span className="font-bold">{data.total}</span> issues resolved
      </p>
      {data.openSafety > 0 && (
        <p className="text-xs text-destructive mb-2">{data.openSafety} safety issue{data.openSafety !== 1 ? "s" : ""} still open</p>
      )}
      <Progress value={pct} className="h-2" />
    </button>
  );
}