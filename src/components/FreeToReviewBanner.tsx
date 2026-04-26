import { Sparkles } from "lucide-react";

/**
 * Platform Rule 1 — User-uploaded data is always free to review.
 * Drop this above any review surface (inspection report, vault doc, fix record).
 */
export default function FreeToReviewBanner({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div
        className={`rounded-lg border border-health-green/30 bg-health-green/5 px-3 py-2 flex items-center gap-2 ${className}`}
      >
        <Sparkles className="h-3.5 w-3.5 text-health-green shrink-0" />
        <p className="text-[11px] text-foreground">
          <span className="font-semibold">Free to review</span>
          <span className="text-muted-foreground"> — you provided this report.</span>
        </p>
      </div>
    );
  }
  return (
    <div
      className={`rounded-xl border border-health-green/30 bg-health-green/5 p-3 flex items-start gap-2 ${className}`}
    >
      <Sparkles className="h-4 w-4 text-health-green shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed">
        <p className="font-semibold text-foreground">
          Your uploaded data is always free to review
        </p>
        <p className="text-muted-foreground">
          No credits, no subscription required. You uploaded it, you own it.
        </p>
      </div>
    </div>
  );
}