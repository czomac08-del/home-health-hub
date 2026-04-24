import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Clock, CheckCircle2, XCircle } from "lucide-react";

interface RewardRow {
  id: string;
  reward_description: string;
  reward_amount_cents: number | null;
  trigger_event: string;
  status: string;
  created_at: string;
  issued_at: string | null;
}

const statusMeta: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pending review", icon: Clock, color: "text-muted-foreground" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-primary" },
  issued: { label: "Issued", icon: CheckCircle2, color: "text-health-green" },
  rejected: { label: "Not eligible", icon: XCircle, color: "text-destructive" },
};

const PendingRewardsCard = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("referral_rewards")
        .select("id, reward_description, reward_amount_cents, trigger_event, status, created_at, issued_at")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setRewards(data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || rewards.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="h-4 w-4 text-primary" />
        <h3 className="text-foreground font-heading font-bold text-sm uppercase tracking-wider">Your Rewards</h3>
      </div>
      <div className="space-y-2">
        {rewards.map((r) => {
          const meta = statusMeta[r.status] ?? statusMeta.pending;
          const Icon = meta.icon;
          return (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
              <div className="min-w-0">
                <p className="text-sm font-heading font-bold text-foreground truncate">{r.reward_description}</p>
                <p className="text-xs text-muted-foreground">
                  {r.trigger_event === "first_paid" ? "From a paid signup" : "From a 3-month retained referral"}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-heading font-bold ${meta.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">
        Rewards are reviewed manually before being applied. We'll email you once issued.
      </p>
    </div>
  );
};

export default PendingRewardsCard;