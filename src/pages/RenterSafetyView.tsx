import { useEffect, useState } from "react";
import { ArrowLeft, ShieldAlert, Home, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SafetyFinding {
  level: number;
  title: string;
  description?: string | null;
  category?: string | null;
}

interface RenterRecord {
  property_id: string;
  property_address: string;
  inspection_record_id: string;
  uploaded_at: string;
  level1: SafetyFinding[];
}

/**
 * Renters see ONLY Level-1 (safety/habitability) items extracted from the most
 * recent inspection report on a property they're connected to. They cannot
 * see the full report unless the property owner shares it explicitly.
 */
const RenterSafetyView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<RenterRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      // 1. Find properties where user has an active 'renter' connection
      const { data: conns } = await supabase
        .from("property_connections")
        .select("property_id")
        .eq("user_id", user.id)
        .eq("role", "renter")
        .eq("status", "active");

      const propIds = (conns ?? []).map((c) => c.property_id);
      if (propIds.length === 0) { setRecords([]); setLoading(false); return; }

      // 2. Pull addresses
      const { data: props } = await supabase
        .from("properties")
        .select("id, address")
        .in("id", propIds);
      const addrMap = new Map((props ?? []).map((p) => [p.id, p.address]));

      // 3. Most recent inspection report per property
      const { data: reports } = await supabase
        .from("property_records")
        .select("id, property_id, ai_extracted_data, created_at")
        .in("property_id", propIds)
        .eq("record_type", "inspection_report")
        .order("created_at", { ascending: false });

      const seen = new Set<string>();
      const out: RenterRecord[] = [];
      for (const r of reports ?? []) {
        if (seen.has(r.property_id)) continue;
        seen.add(r.property_id);
        const ai = (r.ai_extracted_data ?? {}) as { inspection_report?: { findings?: SafetyFinding[] } };
        const findings = ai.inspection_report?.findings ?? [];
        const level1 = findings.filter((f) => Number(f.level) === 1);
        out.push({
          property_id: r.property_id,
          property_address: addrMap.get(r.property_id) ?? "Your rental",
          inspection_record_id: r.id,
          uploaded_at: r.created_at,
          level1,
        });
      }
      setRecords(out);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Rental Safety Items</h1>
          <p className="text-xs text-muted-foreground">Habitability findings shared with renters</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 mb-5 flex gap-2 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          You're seeing only safety / habitability items (Level 1) from your landlord's most
          recent inspection. The full inspection report is private unless your landlord
          explicitly shares it with you.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}

      {!loading && records.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-1">No rental properties yet</p>
          <p className="text-sm text-muted-foreground">
            When your landlord adds you as a renter on ComingHomeIQ, safety items from new
            inspections will appear here.
          </p>
        </div>
      )}

      {records.map((r) => (
        <div key={r.property_id} className="rounded-xl border border-border bg-card p-5 mb-4">
          <p className="text-sm font-semibold text-foreground">{r.property_address}</p>
          <p className="text-[11px] text-muted-foreground mb-4">
            Inspection uploaded {new Date(r.uploaded_at).toLocaleDateString()}
          </p>

          {r.level1.length === 0 ? (
            <div className="rounded-lg bg-health-green/10 border border-health-green/30 p-3 text-xs text-foreground">
              No Level-1 safety items were noted in the most recent inspection.
            </div>
          ) : (
            <ul className="space-y-2">
              {r.level1.map((f, i) => (
                <li key={i} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{f.title}</p>
                      {f.category && (
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                          {f.category}
                        </p>
                      )}
                      {f.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] text-muted-foreground mt-4">
            Contact your landlord to discuss any items above.
          </p>
        </div>
      ))}
    </div>
  );
};

export default RenterSafetyView;