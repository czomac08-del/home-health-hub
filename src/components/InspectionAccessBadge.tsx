import { Clock, CheckCircle2 } from "lucide-react";
import type { InspectionAccess } from "@/hooks/useInspectionAccess";

/**
 * Small non-intrusive countdown chip for the top of the Inspection Review tab.
 * Hidden for paid subscribers (they always have access).
 */
export default function InspectionAccessBadge({ access }: { access: InspectionAccess }) {
  if (access.loading) return null;
  if (access.status === "subscribed") return null;

  if (access.status === "one_time_active") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-primary/15 text-primary">
        <CheckCircle2 className="h-3 w-3" />
        One-Time Access · {access.daysRemaining} day{access.daysRemaining === 1 ? "" : "s"} left
      </span>
    );
  }

  if (
    access.status === "trial_active" ||
    access.status === "trial_expiring_soon" ||
    access.status === "trial_final_days"
  ) {
    const urgent = access.status !== "trial_active";
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
          urgent
            ? "bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))]"
            : "bg-health-green/15 text-health-green"
        }`}
      >
        <Clock className="h-3 w-3" />
        Free review · {access.daysRemaining} day{access.daysRemaining === 1 ? "" : "s"} left
      </span>
    );
  }

  return null;
}