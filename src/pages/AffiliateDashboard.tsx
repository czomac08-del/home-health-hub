import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";

type Partner = {
  id: string;
  name: string;
  code: string;
  rev_share_pct: number;
  total_referred: number;
  total_earned_cents: number;
  status: string;
};

type Earning = {
  id: string;
  month: string;
  subscribers_count: number;
  gross_revenue_cents: number;
  rev_share_amount_cents: number;
  paid_out: boolean;
  paid_at: string | null;
};

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMonth = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [activeSubs, setActiveSubs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("affiliate_partners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setPartner((p as Partner) || null);

      if (p) {
        const { data: e } = await supabase
          .from("affiliate_earnings")
          .select("*")
          .eq("affiliate_id", p.id)
          .order("month", { ascending: false });
        setEarnings((e as Earning[]) || []);

        const { count } = await supabase
          .from("affiliate_referrals")
          .select("id", { count: "exact", head: true })
          .eq("affiliate_id", p.id)
          .eq("active", true);
        setActiveSubs(count || 0);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6 animate-pulse space-y-4">
      <div className="h-8 w-48 bg-secondary rounded-lg" />
      <div className="h-32 w-full bg-secondary rounded-xl" />
    </div>;
  }

  if (!partner) {
    return (
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        <SEO title="Affiliate Dashboard" description="ComingHomeIQ affiliate partner dashboard" path="/affiliate-dashboard" />
        <Card className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Affiliate access not enabled</h1>
          <p className="text-muted-foreground">
            Your account isn't linked to an affiliate partner profile yet. Apply to the
            partner program below — once approved, this dashboard will show your referral
            link, live subscriber count, and monthly payouts.
          </p>
          <Button asChild>
            <a href="/partners">Apply to the Partner Program</a>
          </Button>
        </Card>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/?ref=${partner.code}`;
  const lifetimeEarned = partner.total_earned_cents;
  const thisMonth = earnings[0];

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
      <SEO title={`Affiliate Dashboard — ${partner.name}`} description="Track referrals and earnings" path="/affiliate-dashboard" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{partner.name}</h1>
          <p className="text-muted-foreground">
            Partner code <span className="font-mono">{partner.code}</span> · {partner.rev_share_pct}% revenue share
          </p>
        </div>
        <Badge variant={partner.status === "active" ? "default" : "secondary"}>
          {partner.status}
        </Badge>
      </div>

      {/* Referral link */}
      <Card className="p-5">
        <div className="text-sm font-medium mb-2">Your referral link</div>
        <div className="flex gap-2 items-center">
          <code className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm truncate">
            {referralLink}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              toast.success("Link copied");
            }}
          >
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" /> Live subscribers
          </div>
          <div className="text-3xl font-bold mt-2">{activeSubs}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" /> This month
          </div>
          <div className="text-3xl font-bold mt-2">
            {thisMonth ? fmtMoney(thisMonth.rev_share_amount_cents) : "$0.00"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="w-4 h-4" /> Total referred
          </div>
          <div className="text-3xl font-bold mt-2">{partner.total_referred}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <DollarSign className="w-4 h-4" /> Lifetime earned
          </div>
          <div className="text-3xl font-bold mt-2">{fmtMoney(lifetimeEarned)}</div>
        </Card>
      </div>

      {/* Payout history */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-4">Payout history</h2>
        {earnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No earnings yet. Earnings post on the 1st of each month based on the prior month's referred subscribers.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">Month</th>
                  <th className="py-2">Subscribers</th>
                  <th className="py-2">Gross revenue</th>
                  <th className="py-2">Your share</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2">{fmtMonth(e.month)}</td>
                    <td className="py-2">{e.subscribers_count}</td>
                    <td className="py-2">{fmtMoney(e.gross_revenue_cents)}</td>
                    <td className="py-2 font-medium">{fmtMoney(e.rev_share_amount_cents)}</td>
                    <td className="py-2">
                      <Badge variant={e.paid_out ? "default" : "secondary"}>
                        {e.paid_out ? `Paid ${e.paid_at ? new Date(e.paid_at).toLocaleDateString() : ""}` : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
