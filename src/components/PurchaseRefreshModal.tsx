import { useState } from "react";
import { X, Zap, Package, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PurchaseRefreshModalProps {
  open: boolean;
  onClose: () => void;
  nextFreeRefreshLabel: string;
}

const REFRESH_PRODUCTS = {
  single: {
    priceId: "price_1TMrG7ECIkzmsZKyoQa2INd3",
    label: "Single refresh",
    price: "$5.00",
    credits: 1,
  },
  bundle: {
    priceId: "price_1TMrGXECIkzmsZKycELTtFGb",
    label: "5-refresh bundle",
    price: "$19.00",
    credits: 5,
    savings: "Save $6",
  },
};

const PurchaseRefreshModal = ({ open, onClose, nextFreeRefreshLabel }: PurchaseRefreshModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const handlePurchase = async (product: keyof typeof REFRESH_PRODUCTS) => {
    setLoading(product);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: REFRESH_PRODUCTS[product].priceId,
          mode: "payment",
          successUrl: `${window.location.origin}/property?refresh_purchased=true`,
          cancelUrl: `${window.location.origin}/property`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Purchase error:", err);
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Refresh Now</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/50 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Single */}
          <button
            onClick={() => handlePurchase("single")}
            disabled={loading === "single"}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors text-left disabled:opacity-50"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{REFRESH_PRODUCTS.single.label}</p>
              <p className="text-xs text-muted-foreground">Instant refresh across all sources</p>
            </div>
            <span className="text-sm font-bold text-foreground">{REFRESH_PRODUCTS.single.price}</span>
          </button>

          {/* Bundle */}
          <button
            onClick={() => handlePurchase("bundle")}
            disabled={loading === "bundle"}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-primary/40 bg-primary/5 p-4 hover:bg-primary/10 transition-colors text-left disabled:opacity-50 relative"
          >
            <span className="absolute -top-2.5 right-3 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              BEST VALUE
            </span>
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{REFRESH_PRODUCTS.bundle.label}</p>
              <p className="text-xs text-muted-foreground">{REFRESH_PRODUCTS.bundle.savings} — credits never expire</p>
            </div>
            <span className="text-sm font-bold text-foreground">{REFRESH_PRODUCTS.bundle.price}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-4 justify-center">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            Your next free refresh is available {nextFreeRefreshLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRefreshModal;
