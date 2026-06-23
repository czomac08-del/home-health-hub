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
  "status",
  "health_score",
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

/**
 * Translates common AI extraction key aliases to their canonical spec keys.
 * Covers snake_case → camelCase mismatches and common synonym variants
 * returned by extract-document-data and ai-scan across system types.
 */
export const EXTRACTION_KEY_ALIASES: Record<string, string> = {
  // Septic
  lastPumpDate: "lastPumped",
  lastPumpedDate: "lastPumped",
  pumpDate: "lastPumped",
  companyName: "pumpingCompany",
  company: "pumpingCompany",
  technicianName: "inspectedBy",
  technician: "inspectedBy",
  beds: "bedrooms",
  numBedrooms: "bedrooms",
  permit_number: "permitNumber",
  tank_capacity: "tankCapacityGallons",
  drain_field_sq_ft: "drainFieldSqFt",
  soil_type: "soilType",
  // Install date stays canonical
  installDate: "install_date",
  install_date: "install_date",
  inspectedBy: "inspectedBy",
  // Well water
  depth_ft: "wellDepth",
  casing_diameter_in: "casingDiameter",
  driller_name: "wellDriller",
  static_water_level_ft: "waterTableDepth",
  drill_date: "wellDrillDate",
  pump_gpm: "wellFlowRate",
  // HVAC service records
  company_name: "service_company",
  model_number: "model",
  next_service_date: "next_service",
  service_date: "last_service",
  refrigerant_type: "refrigerantType",
  work_performed: "notes",
};

const KEY_ALIASES = EXTRACTION_KEY_ALIASES; // back-compat

/**
 * Map of alias keys → canonical top-level system_details column names.
 * Used by saveReviewedFields to guarantee that confirmed brand/model/serial/
 * date/warranty/service values land on the top-level columns (not just specs)
 * regardless of which case style the spec field used.
 */
const TOP_LEVEL_ALIAS_TO_CANONICAL: Record<string, string> = {
  brand: "brand",
  manufacturer: "brand",
  make: "brand",
  model: "model",
  modelNumber: "model",
  model_number: "model",
  serial_number: "serial_number",
  serialNumber: "serial_number",
  serial: "serial_number",
  install_date: "install_date",
  installDate: "install_date",
  installationDate: "install_date",
  installation_date: "install_date",
  warranty_exp: "warranty_exp",
  warrantyExp: "warranty_exp",
  warrantyExpiration: "warranty_exp",
  warranty_expiration: "warranty_exp",
  warrantyExpDate: "warranty_exp",
  warranty_provider: "warranty_provider",
  warrantyProvider: "warranty_provider",
  service_company: "service_company",
  serviceCompany: "service_company",
  service_phone: "service_phone",
  servicePhone: "service_phone",
  last_service: "last_service",
  lastService: "last_service",
  next_service: "next_service",
  nextService: "next_service",
};

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/gi, (_, c) => String(c).toUpperCase());
}

function normalizeExtracted(extracted: Record<string, any> | undefined | null): Record<string, any> {
  const out: Record<string, any> = { ...(extracted || {}) };
  if (!extracted) return out;
  for (const [k, v] of Object.entries(extracted)) {
    if (v == null || v === "") continue;
    const aliased = EXTRACTION_KEY_ALIASES[k];
    if (aliased) {
      if (out[aliased] == null || out[aliased] === "") out[aliased] = v;
      continue;
    }
    // Auto-convert snake_case → camelCase when there is no explicit alias.
    if (k.includes("_")) {
      const camel = snakeToCamel(k);
      if (camel !== k && (out[camel] == null || out[camel] === "")) {
        out[camel] = v;
      }
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

  // Ensure top-level system_details columns get populated even when the spec
  // field key didn't match the canonical column name. UnifiedDocumentReview
  // routes everything through here, so this is the only chance we get to
  // mirror brand/model/serial/date/warranty/service values to the row's
  // top-level columns. writeSystemFields is idempotent for unchanged values.
  const topLevelOwner: Record<string, string> = {};
  const topLevelDoc: Record<string, string> = {};
  for (const [k, v] of Object.entries(args.values)) {
    if (v == null || v === "") continue;
    const canon = TOP_LEVEL_ALIAS_TO_CANONICAL[k];
    if (!canon) continue;
    if (args.ownerEdited.has(k)) topLevelOwner[canon] = v;
    else topLevelDoc[canon] = v;
  }
  if (Object.keys(topLevelOwner).length) {
    const r = await writeSystemFields({
      propertyId: args.propertyId,
      userId: args.userId,
      systemName: args.systemName,
      fields: topLevelOwner,
      source: "OWNER_PROVIDED",
      documentDate: args.documentDate ?? null,
    });
    written += r.written;
    conflicts += r.conflicts;
  }
  if (Object.keys(topLevelDoc).length) {
    const r = await writeSystemFields({
      propertyId: args.propertyId,
      userId: args.userId,
      systemName: args.systemName,
      fields: topLevelDoc,
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
    extracted?.permitDate ||
    extracted?.permit_date ||
    extracted?.drill_date ||
    extracted?.wellDrillDate ||
    extracted?.issue_date ||
    extracted?.issueDate ||
    extracted?.recorded_date ||
    extracted?.recordedDate ||
    null
  );
}