import { supabase } from "@/integrations/supabase/client";
import { getSpecFields, type SpecField } from "@/data/systemSpecFields";
import { writeSystemFields } from "@/lib/systemFieldWrite";

export type ReviewRowState = "confirmed" | "empty" | "conflict";

export interface ReviewRow {
  field: SpecField;
  state: ReviewRowState;
  /** Value the AI proposed (or null if AI didn't find one) */
  aiValue: string | null;
  /** Existing value already on the system, if any */
  currentValue: string | null;
}

const TOP_LEVEL_FIELDS = new Set([
  "brand",
  "model",
  "serial_number",
  "install_date",
  "purchase_date",
  "warranty_exp",
  "warranty_provider",
  "last_service",
  "next_service",
  "service_company",
  "service_phone",
  "location_in_home",
  "notes",
]);

function readField(row: any, key: string): string | null {
  if (!row) return null;
  const v = TOP_LEVEL_FIELDS.has(key) ? row[key] : row?.specs?.[key];
  if (v == null || v === "") return null;
  return String(v);
}

function valuesConflict(a: string | null, b: string | null) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() !== b.trim().toLowerCase();
}

/** Translates common AI extraction key aliases to their canonical spec keys. */
const KEY_ALIASES: Record<string, string> = {
  lastPumpDate: "lastPumped",
  lastPumpedDate: "lastPumped",
  pumpDate: "lastPumped",
  companyName: "pumpingCompany",
  company: "pumpingCompany",
  installDate: "install_date",
  technicianName: "inspectedBy",
  technician: "inspectedBy",
  beds: "bedrooms",
  numBedrooms: "bedrooms",
};

function normalizeExtracted(extracted: Record<string, any> | undefined | null): Record<string, any> {
  const out: Record<string, any> = { ...(extracted || {}) };
  for (const [alias, canonical] of Object.entries(KEY_ALIASES)) {
    const v = (extracted as any)?.[alias];
    if (v != null && v !== "" && (out[canonical] == null || out[canonical] === "")) {
      out[canonical] = v;
    }
  }
  return out;
}

/** Build the row buckets for the review screen. */
export async function prepareReviewRows(args: {
  propertyId: string;
  systemName: string;
  extracted: Record<string, any>;
}): Promise<ReviewRow[]> {
  const fields = getSpecFields(args.systemName);
  const normalized = normalizeExtracted(args.extracted);
  const { data: existing } = await supabase
    .from("system_details")
    .select("*")
    .eq("property_id", args.propertyId)
    .eq("system_name", args.systemName)
    .maybeSingle();

  return fields.map((field) => {
    const aiRaw = normalized?.[field.key];
    const aiValue =
      aiRaw == null || aiRaw === "" ? null : String(aiRaw);
    const currentValue = readField(existing, field.key);
    let state: ReviewRowState = "empty";
    if (aiValue && currentValue && valuesConflict(aiValue, currentValue)) {
      state = "conflict";
    } else if (aiValue) {
      state = "confirmed";
    }
    return { field, state, aiValue, currentValue };
  });
}

/** Persist user's choices from the unified review screen. */
export async function saveReviewedFields(args: {
  propertyId: string;
  userId: string;
  systemName: string;
  /** Field key → value to save (already resolved by user). Skipped fields omitted. */
  values: Record<string, string>;
  /** Field keys the user manually edited (will be tagged OWNER_PROVIDED). */
  ownerEdited: Set<string>;
  documentDate?: string | null;
}) {
  const ownerFields: Record<string, string> = {};
  const docFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(args.values)) {
    if (v == null || v === "") continue;
    if (args.ownerEdited.has(k)) ownerFields[k] = v;
    else docFields[k] = v;
  }
  let written = 0;
  let conflicts = 0;
  if (Object.keys(ownerFields).length) {
    const r = await writeSystemFields({
      propertyId: args.propertyId,
      userId: args.userId,
      systemName: args.systemName,
      fields: ownerFields,
      source: "OWNER_PROVIDED",
      documentDate: args.documentDate ?? null,
    });
    written += r.written;
    conflicts += r.conflicts;
  }
  if (Object.keys(docFields).length) {
    const r = await writeSystemFields({
      propertyId: args.propertyId,
      userId: args.userId,
      systemName: args.systemName,
      fields: docFields,
      source: "DOCUMENT_EXTRACTED",
      documentDate: args.documentDate ?? null,
    });
    written += r.written;
    conflicts += r.conflicts;
  }
  return { written, conflicts };
}

/** Mark a stored vault row as needing review (used when user picks "Complete Later"). */
export async function markRecordNeedsReview(recordId: string) {
  await supabase
    .from("property_records")
    .update({ ai_verified: false } as any)
    .eq("id", recordId);
}

export function pickDocumentDate(extracted: Record<string, any>): string | null {
  return (
    extracted?.lastPumpDate ||
    extracted?.inspection_date ||
    extracted?.report_date ||
    extracted?.service_date ||
    extracted?.install_date ||
    extracted?.installDate ||
    extracted?.purchase_date ||
    null
  );
}