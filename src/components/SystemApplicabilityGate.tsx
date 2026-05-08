import { useState } from "react";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";

export interface SystemApplicabilityGateProps {
  /** Question shown in the first-time prompt, e.g. "Does this property currently have a well?" */
  question: string;
  /** Short label describing what is "not applicable", e.g. "no well on this property" */
  notApplicableLabel: string;
  /** Banner message shown when applicable === false, e.g. "You've indicated this property doesn't have a well. This section is inactive." */
  inactiveBanner: string;
  /** Label for the affirmative button, e.g. "Yes, we have a well" */
  yesLabel: string;
  /** Label for the negative button, e.g. "No well on this property" */
  noLabel: string;
  /** Current saved value: true = applicable, false = not applicable, null = not yet answered */
  applicable: boolean | null;
  /** Save handler */
  onChange: (next: boolean) => Promise<void> | void;
}

/**
 * Reusable property-level gate for conditional systems (Well, Gas, Chimney, etc).
 * - When `applicable` is null → renders the first-time prompt card.
 * - When `applicable` is true → renders nothing (caller renders normal content).
 * - When `applicable` is false → renders an inactive banner with a "Change this" link.
 * The dimming of downstream content is the caller's responsibility — wrap it in
 * `<div className={!applicable ? "opacity-40 pointer-events-none select-none" : ""}>`.
 */
export const SystemApplicabilityGate = ({
  question,
  notApplicableLabel,
  inactiveBanner,
  yesLabel,
  noLabel,
  applicable,
  onChange,
}: SystemApplicabilityGateProps) => {
  const [saving, setSaving] = useState(false);

  const handleSet = async (next: boolean) => {
    setSaving(true);
    try { await onChange(next); } finally { setSaving(false); }
  };

  // First-time prompt
  if (applicable === null) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-6 animate-fade-in">
        <h2 className="text-foreground font-semibold text-lg mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" /> {question}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Answering this once tailors the rest of this section. You can change it any time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSet(true)}
            className="rounded-xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-colors p-4 flex items-center justify-center gap-2 font-semibold text-sm text-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-primary" />}
            {yesLabel}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSet(false)}
            className="rounded-xl border-2 border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/50 transition-colors p-4 flex items-center justify-center gap-2 font-semibold text-sm text-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-muted-foreground" />}
            {noLabel}
          </button>
        </div>
      </div>
    );
  }

  // Inactive banner
  if (applicable === false) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {inactiveBanner}
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Marked: {notApplicableLabel}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSet(true)}
            className="mt-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {saving ? "Updating…" : "Change this"}
          </button>
        </div>
      </div>
    );
  }

  // Applicable — caller handles content; offer subtle "mark not applicable" link.
  return null;
};

export default SystemApplicabilityGate;