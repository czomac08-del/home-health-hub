/**
 * Confidence / extraction-tier helpers for documents in the vault.
 *
 * A document that exists in the vault — even if fully unreadable — should
 * still contribute to the Home IQ Score. We grade extraction quality into
 * four tiers and expose a credit multiplier other scoring code can apply:
 *
 *   clear   → full credit  (1.00) — AI read most fields cleanly
 *   partial → 75% credit   (0.75) — AI got some fields, others blank
 *   trouble → 50% credit   (0.50) — handwritten/low quality, almost nothing extracted
 *   none    → 0% credit    (0.00) — no document on file
 */

export type ExtractionTier = "clear" | "partial" | "trouble" | "none";

export interface ExtractionAssessment {
  tier: ExtractionTier;
  /** Multiplier 0–1 for partial-credit scoring. */
  creditMultiplier: number;
  /** Approximate proportion of fields successfully extracted (0–1). */
  extractedRatio: number;
  /** Friendly badge label. */
  label: string;
  /** Honest user-facing detail string. */
  detail: string;
  /** Friendly credit string for display (e.g. "Full credit"). */
  creditLabel: string;
}

const FIELD_KEYS_TO_IGNORE = new Set([
  "_tier",
  "overall_confidence",
  "confidence",
  "inspection_report",
  "notes",
  "address",
  "propertyAddress",
]);

function countNonEmpty(obj: Record<string, unknown>): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (FIELD_KEYS_TO_IGNORE.has(k)) continue;
    total += 1;
    // Handle the `{ value, confidence }` shape returned by the extractor.
    const value =
      v && typeof v === "object" && "value" in (v as any) ? (v as any).value : v;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    filled += 1;
  }
  return { filled, total };
}

/**
 * Assess an extraction tier from the raw `ai_extracted_data` JSON.
 * Pass `hasDocument=false` to force `none`.
 */
export function assessExtraction(
  ai: unknown,
  opts: { hasDocument?: boolean } = {},
): ExtractionAssessment {
  const hasDocument = opts.hasDocument !== false;
  if (!hasDocument) {
    return {
      tier: "none",
      creditMultiplier: 0,
      extractedRatio: 0,
      label: "No document on file",
      detail: "Upload a document to start earning credit toward your Home IQ Score.",
      creditLabel: "0% credit",
    };
  }

  // If the extractor stamped an explicit tier, honor it.
  const stamped =
    ai && typeof ai === "object" && (ai as any)._tier
      ? (((ai as any)._tier as ExtractionTier) ?? null)
      : null;

  let tier: ExtractionTier;
  let ratio = 0;

  if (stamped && ["clear", "partial", "trouble"].includes(stamped)) {
    tier = stamped;
  } else {
    const obj = ai && typeof ai === "object" ? (ai as Record<string, unknown>) : {};
    const hasReport =
      obj.inspection_report &&
      typeof obj.inspection_report === "object" &&
      Array.isArray((obj.inspection_report as any).findings) &&
      (obj.inspection_report as any).findings.length > 0;

    const { filled, total } = countNonEmpty(obj);
    ratio = total > 0 ? filled / total : hasReport ? 1 : 0;

    if (hasReport && filled >= Math.max(2, Math.floor(total * 0.6))) tier = "clear";
    else if (ratio >= 0.6) tier = "clear";
    else if (ratio >= 0.25 || (hasReport && filled > 0)) tier = "partial";
    else tier = "trouble";
  }

  const creditMultiplier = tier === "clear" ? 1 : tier === "partial" ? 0.75 : 0.5;

  const label =
    tier === "clear"
      ? "AI read this clearly"
      : tier === "partial"
        ? "AI partially read this"
        : "AI had trouble reading this";

  const detail =
    tier === "clear"
      ? "AI captured the key fields from this document."
      : tier === "partial"
        ? "AI captured some fields. You can review and fill in any blanks."
        : "This document appears to be handwritten or low quality. We captured what we could — you can review and fill in any missing fields manually.";

  const creditLabel =
    tier === "clear" ? "Full credit" : tier === "partial" ? "75% credit" : "50% credit";

  return { tier, creditMultiplier, extractedRatio: ratio, label, detail, creditLabel };
}

/** Tailwind classes for the colored confidence chip. */
export function tierBadgeClasses(tier: ExtractionTier): string {
  switch (tier) {
    case "clear":
      return "bg-health-green/15 text-health-green border border-health-green/30";
    case "partial":
      return "bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))] border border-[hsl(var(--health-amber))]/30";
    case "trouble":
      return "bg-primary/15 text-primary border border-primary/30";
    case "none":
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}