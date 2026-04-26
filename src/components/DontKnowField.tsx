import { useState, type ReactNode } from "react";
import { Camera, HelpCircle, Sparkles, X } from "lucide-react";
import { useNeedsInfo } from "@/hooks/useNeedsInfo";

type Variant = "date" | "text" | "number" | "yesno";

interface DontKnowFieldProps {
  /** Section identifier, e.g. "hvac", "water_heater", "warranty". Used for the needs_info queue. */
  section: string;
  /** Field identifier, e.g. "install_date", "model_number". */
  fieldName: string;
  /** Human-readable label shown in nudges and the encouragement note. */
  fieldLabel: string;
  /** True if the user has provided a value (so we hide the "I don't know" affordance). */
  hasValue: boolean;
  /** True if the user has explicitly marked this field as unknown. */
  isUnknown: boolean;
  /** Called when the user toggles "I don't know" on. The parent must clear its value. */
  onMarkUnknown: () => void;
  /** Called when the user clears the unknown flag (so they can type a value). */
  onClearUnknown: () => void;
  /** Optional override label for the affordance (defaults are variant-specific). */
  affordanceLabel?: string;
  /** Optional handler for "Scan Label Now". If omitted, the button is hidden. */
  onScanLabel?: () => void;
  /** The actual input element. */
  children: ReactNode;
}

const DEFAULT_LABELS: Record<Variant, string> = {
  date: "I don't know when this was installed",
  text: "I don't know the model number",
  number: "Unknown",
  yesno: "Not sure",
};

/**
 * Wraps a single input and adds the platform-wide "I don't know" affordance.
 * When toggled on, calls `onMarkUnknown` (parent clears the value) and persists
 * the field into `needs_info` so we can stop nagging after 2 prompts.
 *
 * Always offers an AI Vision Scanner CTA when a handler is provided — the
 * documented escape hatch for every "I don't know".
 */
export function DontKnowField({
  section,
  fieldName,
  fieldLabel,
  hasValue,
  isUnknown,
  onMarkUnknown,
  onClearUnknown,
  affordanceLabel,
  onScanLabel,
  children,
  variant = "text",
}: DontKnowFieldProps & { variant?: Variant }) {
  const { markUnknown, resolveField } = useNeedsInfo();
  const [showEncouragement, setShowEncouragement] = useState(false);

  const handleToggle = async () => {
    if (isUnknown) {
      onClearUnknown();
      setShowEncouragement(false);
      await resolveField(section, fieldName);
    } else {
      onMarkUnknown();
      setShowEncouragement(true);
      await markUnknown(section, fieldName, fieldLabel);
    }
  };

  const label = affordanceLabel ?? DEFAULT_LABELS[variant];

  return (
    <div className="space-y-1.5">
      {!isUnknown && children}

      {isUnknown && (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-brain-blue shrink-0" />
          <span className="flex-1">Marked as unknown — won't hurt your score.</span>
          <button
            type="button"
            onClick={handleToggle}
            className="text-[10px] font-bold uppercase tracking-wide text-primary hover:underline"
          >
            <X className="h-3 w-3 inline" /> clear
          </button>
        </div>
      )}

      {!hasValue && (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleToggle}
            className={`text-[11px] font-medium transition-colors ${
              isUnknown
                ? "text-muted-foreground hover:text-foreground"
                : "text-brain-blue hover:underline"
            }`}
          >
            {isUnknown ? "I know it after all" : label}
          </button>
        </div>
      )}

      {showEncouragement && isUnknown && (
        <div className="rounded-xl border border-brain-blue/40 bg-brain-blue/5 p-3 space-y-2">
          <p className="text-[11px] text-foreground leading-relaxed">
            <Sparkles className="h-3 w-3 inline text-brain-blue mr-1" />
            No problem — we'll flag this to fill in later. You can also scan the label with your camera and we'll find it automatically.
          </p>
          {onScanLabel && (
            <button
              type="button"
              onClick={onScanLabel}
              className="w-full rounded-lg bg-brain-blue/15 hover:bg-brain-blue/25 text-brain-blue px-3 py-2 text-xs font-heading font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" /> Scan Label Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Compact inline "I don't know" link — for forms with limited vertical space. */
export function DontKnowLink({
  section,
  fieldName,
  fieldLabel,
  isUnknown,
  onMarkUnknown,
  onClearUnknown,
  label,
}: Omit<DontKnowFieldProps, "hasValue" | "children" | "onScanLabel"> & { label?: string }) {
  const { markUnknown, resolveField } = useNeedsInfo();
  const handle = async () => {
    if (isUnknown) {
      onClearUnknown();
      await resolveField(section, fieldName);
    } else {
      onMarkUnknown();
      await markUnknown(section, fieldName, fieldLabel);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      className="text-[10px] font-medium text-brain-blue hover:underline"
    >
      {isUnknown ? "Clear unknown" : label ?? "I don't know"}
    </button>
  );
}