import { useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InspectionAccess } from "@/hooks/useInspectionAccess";

interface Props {
  access: InspectionAccess;
  propertyRecordId: string;
}

/**
 * In-page nudge banners that escalate as the 60-day trial runs out.
 * - Day 45 (≤15 days): gentle reminder
 * - Day 55 (≤5 days): prominent reminder
 * - Day 60 (≤1 day): final-day banner
 * Dismissible per session via local state.
 */
export default function InspectionTrialNudge({ access, propertyRecordId }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed || access.loading) return null;
  if (access.status !== "trial_expiring_soon" && access.status !== "trial_final_days") return null;

  const days = access.daysRemaining ?? 0;
  const isFinal = access.status === "trial_final_days";

  let title: string;
  let body: string;

  if (days <= 1) {
    title = "Your free review period ends tomorrow.";
    body = "Subscribe to keep full access to your inspection review.";
  } else if (isFinal) {
    title = `${days} days left on your free inspection review.`;
    body = "Subscribe now to make sure you don't lose access.";
  } else {
    title = `Your free review period ends in ${days} days.`;
    body = "Subscribe to keep full access to DIY repairs, contractor estimates, and selling options.";
  }

  const handleOneTime = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: "inspection_one_time", propertyRecordId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout");
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 mb-4 ${
        isFinal
          ? "border-destructive/40 bg-destructive/5"
          : "border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <Clock
          className={`h-5 w-5 mt-0.5 shrink-0 ${
            isFinal ? "text-destructive" : "text-[hsl(var(--health-amber))]"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" onClick={() => navigate("/pricing")}>
              Subscribe — $9.99/mo
            </Button>
            <Button size="sm" variant="outline" onClick={handleOneTime}>
              One-Time Access · $4.99
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}