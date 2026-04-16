import { useState, useEffect, useMemo } from "react";
import { RefreshCw, X, Check, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FREE_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

interface PropertyRefreshInfo {
  id: string;
  address: string;
  label: string;
  lastRefresh: string | null;
  freeAvailable: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const RefreshAllButton = ({ className = "" }: { className?: string }) => {
  const { user, properties } = useAuth();
  const [propInfo, setPropInfo] = useState<PropertyRefreshInfo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch last refresh per property
  useEffect(() => {
    if (!user || properties.length < 2) return;

    const load = async () => {
      const results: PropertyRefreshInfo[] = [];
      for (const p of properties) {
        const { data } = await supabase
          .from("refresh_logs")
          .select("created_at")
          .eq("property_id", p.id)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastRefresh = data?.[0]?.created_at || null;
        const freeAvailable = !lastRefresh || Date.now() - new Date(lastRefresh).getTime() >= FREE_COOLDOWN_MS;

        results.push({
          id: p.id,
          address: p.address,
          label: p.label,
          lastRefresh,
          freeAvailable,
        });
      }
      setPropInfo(results);
    };
    load();
  }, [user, properties]);

  const pricing = useMemo(() => {
    const paid = propInfo.filter((p) => !p.freeAvailable);
    const free = propInfo.filter((p) => p.freeAvailable);
    const paidCount = paid.length;
    const paidTotal = paidCount === 0 ? 0 : 5 + Math.max(0, paidCount - 1) * 3;
    const separateTotal = paidCount * 5;
    const savings = separateTotal - paidTotal;
    return { paid, free, paidCount, paidTotal, separateTotal, savings, allFree: paidCount === 0 };
  }, [propInfo]);

  if (properties.length < 2) return null;

  const handleRefreshAll = async () => {
    if (pricing.allFree) {
      // Run all refreshes for free
      setIsRefreshing(true);
      setShowModal(false);
      toast.info(`Refreshing ${properties.length} properties...`);

      for (const p of properties) {
        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rentcast-lookup?address=${encodeURIComponent(p.address)}`,
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );
        } catch {
          // individual failures handled silently
        }
      }
      toast.success(`All ${properties.length} properties refreshed`);
      setIsRefreshing(false);
      window.dispatchEvent(new CustomEvent("property-data-updated"));
    } else {
      // Trigger Stripe checkout for paid portion
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            priceId: "price_1TMrG7ECIkzmsZKyoQa2INd3", // single refresh price
            mode: "payment",
            quantity: pricing.paidCount,
            successUrl: `${window.location.origin}/dashboard?refresh_all=true`,
            cancelUrl: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        if (data?.url) window.open(data.url, "_blank");
      } catch {
        toast.error("Could not start checkout");
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isRefreshing}
        className={`inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 ${className}`}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing
          ? "Refreshing..."
          : pricing.allFree
            ? `Refresh All ${properties.length} Properties — Free`
            : `Refresh All ${properties.length} Properties — $${pricing.paidTotal}`}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Refresh All Properties</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-secondary/50">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {propInfo.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.address}</p>
                    {p.lastRefresh && (
                      <p className="text-[10px] text-muted-foreground">Last checked: {formatDate(p.lastRefresh)}</p>
                    )}
                  </div>
                  <div className="shrink-0 ml-3">
                    {p.freeAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-500">
                        <Check className="h-3 w-3" /> Free
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <DollarSign className="h-3 w-3" /> Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            <div className="rounded-lg bg-secondary/30 border border-border p-3 mb-4 space-y-1.5">
              {pricing.free.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{pricing.free.length} free refresh{pricing.free.length > 1 ? "es" : ""}</span>
                  <span className="text-green-500 font-medium">$0.00</span>
                </div>
              )}
              {pricing.paidCount > 0 && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">First paid property</span>
                    <span className="text-foreground font-medium">$5.00</span>
                  </div>
                  {pricing.paidCount > 1 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{pricing.paidCount - 1} additional × $3.00</span>
                      <span className="text-foreground font-medium">${((pricing.paidCount - 1) * 3).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="border-t border-border pt-1.5 flex justify-between text-sm">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">${pricing.paidTotal.toFixed(2)}</span>
              </div>
              {pricing.savings > 0 && (
                <p className="text-[11px] text-primary font-semibold text-right">
                  Save ${pricing.savings} vs. refreshing separately
                </p>
              )}
            </div>

            <button
              onClick={handleRefreshAll}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {pricing.allFree ? "Refresh All — Free" : `Confirm & Refresh All — $${pricing.paidTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RefreshAllButton;
