import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";

// Reward economics — single source of truth for the contractor program.
// Real Stripe payout/credit application happens in Phase 2 via a webhook;
// for now we display *earned* totals only when the referred user actually paid.
const REWARD_PER_PAID_SIGNUP_CENTS = 500;        // $5
const REWARD_PER_3MONTH_RETAINED_CENTS = 1500;   // $15 (additional)
const LIFETIME_FREE_PRO_THRESHOLD = 20;

interface ReferralRow {
  id: string;
  signup_date: string;
  converted_to_paid: boolean;
  conversion_date: string | null;
  retained_3_months: boolean;
}

const ProPartnerWidget = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: codeRow } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && codeRow) setCode(codeRow.code);

      const { data: rows } = await supabase
        .from("referrals")
        .select("id, signup_date, converted_to_paid, conversion_date, retained_3_months")
        .eq("referrer_user_id", user.id)
        .order("signup_date", { ascending: false });
      if (!cancelled && rows) setReferrals(rows);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!code) return null;

  const paid = referrals.filter((r) => r.converted_to_paid);
  const retained = referrals.filter((r) => r.retained_3_months);
  const earnedCents =
    paid.length * REWARD_PER_PAID_SIGNUP_CENTS +
    retained.length * REWARD_PER_3MONTH_RETAINED_CENTS;
  const earnedDollars = (earnedCents / 100).toFixed(2);
  const towardLifetime = paid.length;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Award className="h-4 w-4 text-primary" />
        <h3 className="text-foreground font-heading font-bold text-sm uppercase tracking-wider">Pro Partner Program</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Share your code with homeowners. They get their first report free. You earn account credit on every paid signup.
      </p>

      <div className="flex items-stretch gap-2 mb-4">
        <div className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-base text-foreground font-mono font-bold tracking-wider text-center">
          {code}
        </div>
        <button
          onClick={copyCode}
          className="rounded-xl bg-primary text-primary-foreground px-4 text-xs font-heading font-bold flex items-center gap-1.5 hover:opacity-90"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Signed up" value={referrals.length} />
        <Stat label="Paid" value={paid.length} accent />
        <Stat label="Earned" value={`$${earnedDollars}`} accent />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3 mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-foreground">
          <span className="font-heading font-bold">{towardLifetime} of {LIFETIME_FREE_PRO_THRESHOLD}</span> paid referrals toward lifetime free Pro.
        </p>
      </div>

      {referrals.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          No referrals yet. Share your code on quotes, invoices, or business cards.
        </p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider font-heading font-bold text-muted-foreground mb-2">Recent referrals</p>
          {referrals.slice(0, 6).map((r, i) => {
            const status = r.retained_3_months
              ? { label: "Retained 3mo", reward: `+$${(REWARD_PER_3MONTH_RETAINED_CENTS / 100).toFixed(2)}`, color: "text-health-green" }
              : r.converted_to_paid
              ? { label: "Paid", reward: `+$${(REWARD_PER_PAID_SIGNUP_CENTS / 100).toFixed(2)}`, color: "text-primary" }
              : { label: "Awaiting first payment", reward: "—", color: "text-muted-foreground" };
            return (
              <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                <span className="text-foreground">Homeowner #{referrals.length - i}</span>
                <div className="flex items-center gap-3">
                  <span className={status.color}>{status.label}</span>
                  <span className="font-heading font-bold text-foreground w-14 text-right">{status.reward}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-4 italic">
        Earnings shown only after the referred homeowner's first paid invoice clears. Account credit is applied to your next billing cycle.
      </p>
    </div>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) => (
  <div className={`rounded-xl border border-border p-2.5 text-center ${accent ? "bg-primary/5" : "bg-muted/40"}`}>
    <p className={`text-lg font-heading font-black ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

export default ProPartnerWidget;