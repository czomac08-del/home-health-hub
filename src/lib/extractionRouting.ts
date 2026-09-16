/**
 * Central routing from a human-readable system name / id (plus an optional
 * user-chosen document type) to the prompt key understood by the
 * extract-document-data edge function.
 *
 * Why this exists: callers used to pass display names ("Sewer and Waste",
 * "Water Heater") or lowercase ids ("hvac"), none of which match a prompt key,
 * so every specialised schema silently fell through to the generic default.
 */

/** Prompt keys implemented by the extract-document-data edge function. */
export type ExtractionPromptKey =
  | "well"
  | "septic"
  | "permit"
  | "warranty"
  | "inspection_report"
  | "listing"
  | "hvac_service"
  | "water_heater_service"
  | "roof_inspection"
  | "appliance_receipt"
  | "insurance_policy"
  | "other"
  | "default";

/** Lowercase, collapse punctuation/underscores/dashes to single spaces. */
function canonical(input: string | null | undefined): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Document types the user explicitly picks that must win over the
 * system-based mapping (a roof inspection report uploaded from the Roof card
 * still needs the inspection-findings schema).
 */
const DOC_TYPE_OVERRIDES: Record<string, ExtractionPromptKey> = {
  "inspection report": "inspection_report",
  inspection: "inspection_report",
  warranty: "warranty",
};

/** Document types that map directly to a prompt when the system is unclear. */
const DOC_TYPE_MAP: Record<string, ExtractionPromptKey> = {
  ...DOC_TYPE_OVERRIDES,
  permit: "permit",
  "insurance policy": "insurance_policy",
  insurance: "insurance_policy",
  "appliance manual": "appliance_receipt",
  appliance: "appliance_receipt",
  "appliance receipt": "appliance_receipt",
  "repair receipt": "appliance_receipt",
  receipt: "appliance_receipt",
  invoice: "appliance_receipt",
  maintenance: "appliance_receipt",
  listing: "listing",
  other: "other",
};

/**
 * Resolve the prompt key for an upload.
 *
 * @param systemNameOrId Display name ("Sewer and Waste") or id ("hvac").
 * @param documentType   Optional user-chosen document type.
 */
export function resolveExtractionPromptKey(
  systemNameOrId: string | null | undefined,
  documentType?: string | null,
): ExtractionPromptKey {
  const doc = canonical(documentType);

  // 1. Explicit inspection-report / warranty choice always wins.
  if (doc && DOC_TYPE_OVERRIDES[doc]) return DOC_TYPE_OVERRIDES[doc];

  // 2. System-based mapping.
  const s = canonical(systemNameOrId);
  if (s) {
    if (s.includes("water heater")) return "water_heater_service";
    if (s.includes("sewer") || s.includes("septic") || s.includes("waste")) return "septic";
    if (s.includes("well") || s.includes("water source")) return "well";
    if (s.includes("hvac") || s.includes("mini split") || s.includes("minisplit")) return "hvac_service";
    if (s.includes("roof")) return "roof_inspection";
    if (s.includes("insurance")) return "insurance_policy";
    if (s.includes("permit")) return "permit";
    if (s.includes("warranty")) return "warranty";
    if (s.includes("inspection")) return "inspection_report";
  }

  // 3. Fall back to the document type, then the generic prompt.
  if (doc && DOC_TYPE_MAP[doc]) return DOC_TYPE_MAP[doc];
  return "default";
}
