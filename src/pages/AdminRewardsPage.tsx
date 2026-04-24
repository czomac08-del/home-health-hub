import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Send, Shield } from "lucide-react";

interface RewardRow {
  id: string;
  referral_id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referrer_type: string;
  reward_type: string;
  reward_amount_cents: number | null;
  reward_description: string;
  trigger_event: string;
  status: string;
  admin_notes: string | null;
  stripe_reference: string | null;
  created_at: string;
  issued_at: string | null;
}

const StatusFilter = ["pending", "approved", "issued", "rejected"] as const;
type Status = (typeof StatusFilter)[number];

const AdminRewardsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [filter, setFilter] = useState<Status>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  const load = async () => {
    const { data } = await supabase
      .from("referral_rewards")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    setRewards(data ?? []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, filter]);

  if (authLoading || isAdmin === null) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h1 className="text-xl font-heading font-bold text-foreground mb-1">Admin only</h1>
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  const updateReward = async (id: string, patch: Partial<RewardRow>) => {
    setBusy(id);
    const { error } = await supabase
      .from("referral_rewards")
      .update({
        ...patch,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Updated");
    load();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-heading font-black text-foreground">Referral Rewards Admin</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Approve, issue, or reject referral rewards earned by homeowners and Pro Contractors.
      </p>

      <div className="flex gap-2 mb-5">
        {StatusFilter.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider border transition ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {rewards.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No {filter} rewards.
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-base font-heading font-bold text-foreground">{r.reward_description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.referrer_type === "contractor" ? "Pro Contractor" : "Homeowner"} program ·{" "}
                    {r.trigger_event === "first_paid" ? "First paid invoice" : "3-month retention"}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] uppercase tracking-wider font-heading font-bold text-muted-foreground">
                  {r.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                <div><span className="font-heading font-bold text-foreground">Referrer:</span> {r.referrer_user_id.slice(0, 8)}…</div>
                <div><span className="font-heading font-bold text-foreground">Referred:</span> {r.referred_user_id.slice(0, 8)}…</div>
                <div><span className="font-heading font-bold text-foreground">Created:</span> {new Date(r.created_at).toLocaleDateString()}</div>
                {r.reward_amount_cents != null && (
                  <div><span className="font-heading font-bold text-foreground">Amount:</span> ${(r.reward_amount_cents / 100).toFixed(2)}</div>
                )}
              </div>

              {r.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busy === r.id}
                    onClick={() => updateReward(r.id, { status: "approved" })}
                    className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-heading font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    disabled={busy === r.id}
                    onClick={() => updateReward(r.id, { status: "rejected" })}
                    className="rounded-xl border border-border bg-card text-foreground px-4 py-2 text-xs font-heading font-bold flex items-center gap-1.5 hover:bg-muted disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}

              {r.status === "approved" && (
                <button
                  disabled={busy === r.id}
                  onClick={() => {
                    const stripeRef = window.prompt("Stripe coupon/credit reference (optional)") || null;
                    updateReward(r.id, {
                      status: "issued",
                      issued_at: new Date().toISOString(),
                      stripe_reference: stripeRef,
                    } as Partial<RewardRow>);
                  }}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-heading font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Mark issued in Stripe
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRewardsPage;