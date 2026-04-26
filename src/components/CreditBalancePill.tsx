import { Coins } from "lucide-react";
import { useState } from "react";
import { useUserCredits } from "@/hooks/useUserCredits";
import PurchaseRefreshModal from "@/components/PurchaseRefreshModal";

const CreditBalancePill = ({ className = "" }: { className?: string }) => {
  const { balance } = useUserCredits();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted ${className}`}
        title="Data refresh credits"
      >
        <Coins className="h-3.5 w-3.5 text-amber-500" />
        <span>{balance} credit{balance === 1 ? "" : "s"}</span>
      </button>
      <PurchaseRefreshModal open={open} onClose={() => setOpen(false)} nextFreeRefreshLabel="" />
    </>
  );
};

export default CreditBalancePill;