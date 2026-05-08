import AIConfidenceLabel, { type AIConfidenceLevel } from "@/components/AIConfidenceLabel";
import { parseAIResponse } from "@/lib/aiResponseFormat";

/**
 * Renders the confidence labels found inside an AI message as a small badge
 * row underneath the rendered markdown. Hidden when no tokens are present.
 */
const AIConfidenceStrip = ({ text }: { text: string }) => {
  const levels = parseAIResponse(text)
    .filter((s): s is { kind: "label"; level: AIConfidenceLevel } => s.kind === "label")
    .map((s) => s.level);
  if (levels.length === 0) return null;
  // Dedupe consecutive duplicates for compactness
  const unique: AIConfidenceLevel[] = [];
  for (const l of levels) if (unique[unique.length - 1] !== l) unique.push(l);
  return (
    <div className="not-prose flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-border/50">
      {unique.map((l, i) => (
        <AIConfidenceLabel key={i} level={l} />
      ))}
    </div>
  );
};

export default AIConfidenceStrip;