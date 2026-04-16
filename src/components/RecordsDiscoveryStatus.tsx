import { useState, useEffect } from "react";
import { Search, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  propertyId: string;
  onNeedsInputClick?: () => void;
}

const RecordsDiscoveryStatus = ({ propertyId, onNeedsInputClick }: Props) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTypes: 0,
    recordsFound: 0,
    optionalReviews: 0,
    needsInput: 0,
    completeness: 0,
  });

  useEffect(() => {
    if (!propertyId || !user) return;
    Promise.all([
      supabase.from("record_types").select("id", { count: "exact", head: true }),
      supabase.from("property_records").select("id, ai_verified, verified", { count: "exact" }).eq("property_id", propertyId),
    ]).then(([typesRes, recordsRes]) => {
      const total = typesRes.count || 0;
      const records = recordsRes.data || [];
      const verified = records.filter((r: any) => r.ai_verified || r.verified).length;
      const unverified = records.filter((r: any) => !r.ai_verified && !r.verified).length;
      const pct = total > 0 ? Math.round((records.length / total) * 100) : 0;
      setStats({
        totalTypes: total,
        recordsFound: verified,
        optionalReviews: unverified,
        needsInput: 0,
        completeness: Math.min(pct, 100),
      });
    });
  }, [propertyId, user]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="font-bold text-foreground text-sm">Discovery Running</h3>
      </div>

      <Progress value={stats.completeness} className="h-2 mb-3" />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Profile completeness:</span>
          <span className="font-mono font-bold text-foreground">{stats.completeness}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-muted-foreground">Records auto-added:</span>
          </div>
          <span className="font-mono text-foreground">{stats.recordsFound}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-muted-foreground">Optional reviews:</span>
          </div>
          <span className="font-mono text-muted-foreground">{stats.optionalReviews} <span className="text-[10px]">(no rush)</span></span>
        </div>
        {stats.needsInput > 0 && (
          <button
            onClick={onNeedsInputClick}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive text-sm font-medium">Needs your input:</span>
            </div>
            <span className="font-mono font-bold text-destructive">{stats.needsInput} ← tap to resolve</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default RecordsDiscoveryStatus;
