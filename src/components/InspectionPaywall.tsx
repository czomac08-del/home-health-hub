import { useState } from "react";
import { Lock, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  propertyRecordId: string;
  /** Optional surface name shown in the headline (e.g. "Fix It Yourself"). */
  surface?: string;
  /** Optional inline (compact) variant for use inside narrow tabs. */
  compact?: boolean;
}

const KEEP_ITEMS = [
  "Full DIY repair list with YouTube guides",
  "Contractor hire groupings with cost estimates",
  "Selling options (fix / disclose / sell as-is)",
  "Side-by-side report viewer",
  "Unlimited fix verifications and receipt uploads",
  "AI questions about specific findings",
];

export default function InspectionPaywall({ propertyRecordId, surface, compact = false }: Props) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOneTime = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: "inspection_one_time", propertyRecordId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-background ${
        compact ? "p-5" : "p-6 md:p-8"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Lock className="h-5 w-5 text-primary" />
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          {surface ? `${surface} · ` : ""}Free review period ended
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
        Your 60-day free review has ended.
      </h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-prose">
        You got this inspection to help make smart decisions about this home.
        Keep that momentum going.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <Button size="lg" className="flex-1" onClick={() => navigate("/pricing")}>
          <Sparkles className="h-4 w-4" />
          Subscribe — $9.99/month
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={handleOneTime}
          disabled={loading}
        >
          {loading ? "Starting checkout…" : "One-Time Access · $4.99"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        One-time access unlocks the full review for another 30 days. No subscription required.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-bold text-foreground mb-2">What you keep with a subscription:</p>
        <ul className="space-y-1.5">
          {KEEP_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-health-green mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 italic">
        Your finding list and urgency levels are always free — your data never goes away.
      </p>
    </div>
  );
}

/**
 * Soft contextual nudge shown at the bottom of inspection sub-tabs during the
 * free trial period. Not a popup, not a blocker — just a reminder.
 */
export function InspectionTrialContextNudge({
  variant,
  expiresAt,
}: {
  variant: "diy" | "pro" | "selling";
  expiresAt: string | null;
}) {
  const dateLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "your trial end date";

  const messages: Record<typeof variant, string> = {
    diy: "Saving money on DIY repairs? Keep tracking it — subscribe to save your progress permanently after your free period.",
    pro: `Getting contractor quotes? Your free review period gives you 60 days to use this. Subscribe to keep access after ${dateLabel}.`,
    selling: "Planning to list? Most sellers take 30–90 days to prepare. Make sure your review access lasts through your listing date — subscribe to keep it.",
  };

  return (
    <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
      <p className="text-[11px] text-foreground/80 leading-relaxed">{messages[variant]}</p>
    </div>
  );
}