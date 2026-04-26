import { useState } from "react";
import { Radio, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserCredits } from "@/hooks/useUserCredits";
import PurchaseRefreshModal from "@/components/PurchaseRefreshModal";

interface DataRequestCardProps {
  source: string;            // e.g. "RentCast"
  sourceKey: string;         // e.g. "rentcast"
  dataType: string;          // e.g. "Current market value, comps"
  credits: number;           // cost
  approxUsd: string;         // "$1.00"
  address: string;
  propertyId?: string | null;
  onPulled?: (data: unknown, cached: boolean) => void;
  onDecline?: () => void;
  cachedAgeHours?: number | null;  // if set, show cache notice
}

const DataRequestCard = ({
  source, sourceKey, dataType, credits, approxUsd, address, propertyId,
  onPulled, onDecline, cachedAgeHours,
}: DataRequestCardProps) => {
  const { balance } = useUserCredits();
  const [loading, setLoading] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const insufficient = balance < credits;

  const pull = async (force = false) => {
    if (insufficient) { setPurchaseOpen(true); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gated-data-pull", {
        body: { source: sourceKey, address, property_id: propertyId, force },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(data.cached ? `Showing cached ${source} data` : `Pulled fresh ${source} data`);
        onPulled?.(data.data, !!data.cached);
      } else if (data?.error === "insufficient_credits") {
        setPurchaseOpen(true);
      } else {
        toast.error(`Could not pull ${source}: ${data?.error || "unknown"}`);
      }
    } catch (e) {
      toast.error(`Failed to pull ${source}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15">
            <Radio className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-sm font-semibold">📡 New Data Available</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Source: <span className="font-medium text-foreground">{source}</span>
              </div>
              <div className="text-xs text-muted-foreground">Data type: {dataType}</div>
              <div className="mt-1 text-xs">
                Cost: <span className="font-semibold">{credits} credit{credits === 1 ? "" : "s"}</span>
                <span className="text-muted-foreground"> — approximately {approxUsd}</span>
              </div>
              {cachedAgeHours != null && (
                <div className="mt-1 text-[11px] text-amber-600">
                  Showing data from {cachedAgeHours}h ago — refresh for {credits} credit.
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => pull(cachedAgeHours != null)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {loading ? "Pulling…" : insufficient ? "Buy credits" : `Pull This Data — ${credits} credit`}
              </button>
              <button
                onClick={onDecline}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
      <PurchaseRefreshModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} nextFreeRefreshLabel="" />
    </>
  );
};

export default DataRequestCard;