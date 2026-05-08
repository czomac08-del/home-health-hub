import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Row {
  id: string;
  document_date: string | null;
  created_at: string;
  ai_extracted_data: any;
  total: number;
  resolved: number;
}

export default function InspectionHistorySection({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    (async () => {
      const { data: recs } = await supabase
        .from("property_records")
        .select("id, document_date, created_at, ai_extracted_data, record_type")
        .eq("property_id", propertyId)
        .ilike("record_type", "%inspection%")
        .order("document_date", { ascending: false });
      const list = (recs || []) as any[];
      if (list.length === 0) { setRows([]); setLoading(false); return; }
      const ids = list.map((r) => r.id);
      const { data: findings } = await supabase
        .from("inspection_findings")
        .select("inspection_record_id, status")
        .in("inspection_record_id", ids);
      const byRec: Record<string, { total: number; resolved: number }> = {};
      for (const f of (findings || []) as any[]) {
        const k = f.inspection_record_id;
        byRec[k] = byRec[k] || { total: 0, resolved: 0 };
        if (f.status === "dismissed" || f.status === "skipped") continue;
        byRec[k].total += 1;
        if (f.status === "resolved" || f.status === "fixed") byRec[k].resolved += 1;
      }
      if (cancelled) return;
      setRows(list.map((r) => ({
        id: r.id,
        document_date: r.document_date,
        created_at: r.created_at,
        ai_extracted_data: r.ai_extracted_data,
        total: byRec[r.id]?.total || 0,
        resolved: byRec[r.id]?.resolved || 0,
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  if (loading || rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4 text-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Inspection History</h2>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r) => {
          const insp = r.ai_extracted_data?.inspection_report?.inspector || r.ai_extracted_data || {};
          const date = r.document_date || r.created_at;
          const open = Math.max(0, r.total - r.resolved);
          return (
            <li key={r.id} className="py-3">
              <Link
                to={`/inspection-review/${r.id}`}
                className="flex items-center gap-3 hover:bg-muted/30 rounded-lg -mx-2 px-2 py-1.5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {date ? new Date(date).toLocaleDateString() : "Inspection"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {insp?.inspector_name || insp?.inspector_company || "Inspector on file"}
                  </p>
                  {r.total > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.resolved} resolved · {open} open ({r.total} total)
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}