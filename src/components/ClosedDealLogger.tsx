import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, DollarSign, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type Deal = {
  id: string;
  deal_address: string;
  close_date: string;
  purchase_price: number | null;
  platform_fee_cents: number;
  platform_fee_charged: boolean;
};

const fmtMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Visible only to deal-funded users — shows their closed deals and lets them
 * log a new one. Logging triggers the $25 platform fee Stripe Checkout.
 */
export default function ClosedDealLogger() {
  const { user } = useAuth();
  const [isDealFunded, setIsDealFunded] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ deal_address: "", close_date: "", purchase_price: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsDealFunded(sub?.plan_type === "deal_funded");

      const { data: d } = await supabase
        .from("closed_deals")
        .select("id, deal_address, close_date, purchase_price, platform_fee_cents, platform_fee_charged")
        .eq("user_id", user.id)
        .order("close_date", { ascending: false });
      setDeals((d as Deal[]) || []);
    })();
  }, [user]);

  if (!user || !isDealFunded) return null;

  const handleSubmit = async () => {
    if (!form.deal_address || !form.close_date) {
      toast.error("Address and close date required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("closed_deals")
        .insert({
          user_id: user.id,
          deal_address: form.deal_address,
          close_date: form.close_date,
          purchase_price: form.purchase_price ? Math.round(parseFloat(form.purchase_price)) : null,
        })
        .select()
        .single();
      if (error) throw error;

      // Trigger the Stripe Checkout for the $25 fee
      const { data: charge, error: chErr } = await supabase.functions.invoke("charge-deal-fee", {
        body: { dealId: inserted.id },
      });
      if (chErr) throw chErr;
      if (charge?.url) {
        window.open(charge.url, "_blank");
        toast.success("Deal logged — opening checkout for $25 platform fee");
      }
      setDeals((prev) => [inserted as Deal, ...prev]);
      setAdding(false);
      setForm({ deal_address: "", close_date: "", purchase_price: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to log deal");
    } finally {
      setSubmitting(false);
    }
  };

  const unpaid = deals.filter((d) => !d.platform_fee_charged);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Closed Deals</h3>
            <Badge variant="secondary">Deal-Funded plan</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            We make money when you make money. Log a closed deal to pay the $25 platform fee.
          </p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-1" /> Log a deal
          </Button>
        )}
      </div>

      {adding && (
        <div className="space-y-3 p-4 bg-secondary/40 rounded-lg">
          <div>
            <Label htmlFor="deal_address">Property address</Label>
            <Input
              id="deal_address"
              value={form.deal_address}
              onChange={(e) => setForm({ ...form, deal_address: e.target.value })}
              placeholder="123 Main St, City, ST"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="close_date">Close date</Label>
              <Input
                id="close_date"
                type="date"
                value={form.close_date}
                onChange={(e) => setForm({ ...form, close_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="purchase_price">Purchase price (optional)</Label>
              <Input
                id="purchase_price"
                type="number"
                value={form.purchase_price}
                onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                placeholder="250000"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAdding(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <DollarSign className="w-4 h-4 mr-1" />}
              Log deal & pay $25
            </Button>
          </div>
        </div>
      )}

      {deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No deals logged yet. Your account stays free until your first deal closes.
        </p>
      ) : (
        <div className="space-y-2">
          {deals.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <div className="font-medium">{d.deal_address}</div>
                <div className="text-xs text-muted-foreground">
                  Closed {new Date(d.close_date).toLocaleDateString()}
                  {d.purchase_price ? ` · ${fmtMoney(d.purchase_price * 100)}` : ""}
                </div>
              </div>
              {d.platform_fee_charged ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Fee paid
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("charge-deal-fee", {
                      body: { dealId: d.id },
                    });
                    if (error) return toast.error(error.message);
                    if (data?.url) window.open(data.url, "_blank");
                  }}
                >
                  Pay $25 fee
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {unpaid.length > 0 && deals.some((d) => d.platform_fee_charged) && (
        <div className="text-xs text-muted-foreground border-t pt-3">
          Closing more deals? <a href="/pricing" className="text-primary underline">Upgrade to monthly billing</a> to skip the per-deal fee.
        </div>
      )}
    </Card>
  );
}
