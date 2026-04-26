import { useEffect, useState, type ReactNode } from "react";
import { Plus, Camera, Sparkles } from "lucide-react";
import { useNeedsInfo } from "@/hooks/useNeedsInfo";

interface EmptySectionPromptProps {
  /** Section identifier matching `needs_info.section`. */
  section: string;
  /** Field identifier — use a stable section-level key like "section". */
  fieldName?: string;
  /** What the user would be filling in, e.g. "HVAC", "warranty", "well water details". */
  label: string;
  /** Verb-led CTA, e.g. "Add your HVAC details to complete this section." */
  prompt?: string;
  icon?: ReactNode;
  onAdd?: () => void;
  onScan?: () => void;
  /** Override visibility — usually wired to `decidePromptIntensity()`. */
  intensity?: "full" | "small" | "none";
}

/**
 * Soft fill-in prompt that replaces empty cards/sections.
 * Respects the "smart prompts, not nagging" rule — increments the prompt
 * counter on mount so the third visit hides it entirely.
 */
export function EmptySectionPrompt({
  section,
  fieldName = "section",
  label,
  prompt,
  icon,
  onAdd,
  onScan,
  intensity: intensityProp,
}: EmptySectionPromptProps) {
  const { recordPromptShown, decidePromptIntensity } = useNeedsInfo();
  const [intensity, setIntensity] = useState<"full" | "small" | "none" | null>(intensityProp ?? null);

  useEffect(() => {
    if (intensityProp) return;
    let alive = true;
    decidePromptIntensity(section, fieldName).then((i) => {
      if (!alive) return;
      setIntensity(i);
      // Fire-and-forget counter bump for the next visit.
      void recordPromptShown(section, fieldName);
    });
    return () => {
      alive = false;
    };
  }, [section, fieldName, intensityProp, decidePromptIntensity, recordPromptShown]);

  if (intensity === null) return null; // loading
  if (intensity === "none") return null;

  if (intensity === "small") {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="text-xs text-brain-blue hover:underline font-medium inline-flex items-center gap-1"
      >
        <Plus className="h-3 w-3" /> Complete this section
      </button>
    );
  }

  // Full prompt
  const message =
    prompt ?? `Add your ${label} details to complete this section.`;
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5 text-center space-y-3">
      {icon && <div className="flex justify-center text-muted-foreground">{icon}</div>}
      <p className="text-sm text-foreground font-heading font-bold">{label}</p>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-heading font-black inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Add details
          </button>
        )}
        {onScan && (
          <button
            type="button"
            onClick={onScan}
            className="rounded-xl border border-brain-blue/40 bg-brain-blue/10 text-brain-blue px-4 py-2 text-xs font-heading font-bold inline-flex items-center gap-1.5 hover:bg-brain-blue/20 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" /> Scan a label instead
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1 justify-center">
        <Sparkles className="h-2.5 w-2.5 text-brain-blue" />
        Improves your Home IQ score
      </p>
    </div>
  );
}