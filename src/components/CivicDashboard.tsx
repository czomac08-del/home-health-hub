import { useState, useEffect } from "react";
import { Building2, Send, Users, CheckCircle2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CivicDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    recordsContributed: 0,
    requestsSent: 0,
    communityJoined: 0,
    recordsVerified: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [contributions, requests, verified] = await Promise.all([
        supabase.from("civic_contributions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("records_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("property_records").select("id", { count: "exact", head: true }).eq("uploaded_by_user_id", user.id).eq("ai_verified", true),
      ]);
      setStats({
        recordsContributed: contributions.count || 0,
        requestsSent: requests.count || 0,
        communityJoined: requests.count || 0,
        recordsVerified: verified.count || 0,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  const isCivicContributor = stats.recordsContributed > 0;

  const items = [
    { icon: <Building2 className="h-4 w-4 text-[hsl(var(--brain-blue))]" />, label: "Records you've contributed", value: stats.recordsContributed },
    { icon: <Send className="h-4 w-4 text-primary" />, label: "Records requests sent", value: stats.requestsSent },
    { icon: <Users className="h-4 w-4 text-[hsl(var(--navy))]" />, label: "Community requests you've joined", value: stats.communityJoined },
    { icon: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--health-green))]" />, label: "Records verified by others", value: stats.recordsVerified },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[hsl(var(--brain-blue))]" />
          <h3 className="text-sm font-semibold text-foreground">Community Impact</h3>
        </div>
        {isCivicContributor && (
          <div className="flex items-center gap-1.5 bg-[hsl(var(--brain-blue))]/15 text-[hsl(var(--brain-blue))] px-2.5 py-1 rounded-full">
            <Award className="h-3 w-3" />
            <span className="text-[10px] font-semibold">Civic Contributor</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Every record you verify helps modernize public property databases
      </p>
    </div>
  );
};

export default CivicDashboard;
