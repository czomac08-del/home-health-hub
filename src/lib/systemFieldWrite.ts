import { supabase } from "@/integrations/supabase/client";

export type SystemSourceTag =
  | "OWNER_PROVIDED"
  | "AI_INFERRED"
  | "DOCUMENT_EXTRACTED"
  | "GOVERNMENT_API"
  | "PHOTO_AI";

const TRUST_RANK: Record<SystemSourceTag, number> = {
  OWNER_PROVIDED: 5,
  DOCUMENT_EXTRACTED: 4,
  GOVERNMENT_API: 3,
  PHOTO_AI: 2,
  AI_INFERRED: 1,
};

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

function readField(row: any, field: string): unknown {
  if (TOP_LEVEL_FIELDS.has(field)) return row?.[field] ?? null;
  return row?.specs?.[field] ?? null;
}

function valuesConflict(a: unknown, b: unknown) {
  if (a == null || a === "") return false;
  if (b == null || b === "") return false;
  return String(a).trim().toLowerCase() !== String(b).trim().toLowerCase();
}

/**
 * Write a single field on a `system_details` row with conflict detection.
 * - If no row exists, inserts one.
 * - If existing field is empty, fills it.
 * - If existing field has a different value:
 *    - higher-trust source wins, prior value logged as pending verification.
 *    - lower-trust source NEVER overwrites; it goes straight to pending verification.
 */
export async function writeSystemField(args: {
  propertyId: string;
  userId: string;
  systemName: string;
  field: string;
  value: string | number | boolean | null;
  source: SystemSourceTag;
  notes?: string;
}): Promise<{ ok: boolean; conflict?: boolean }> {
  const { propertyId, userId, systemName, field, value, source, notes } = args;
  if (value == null || value === "") return { ok: false };

  const { data: existing } = await supabase
    .from("system_details")
    .select("*")
    .eq("property_id", propertyId)
    .eq("system_name", systemName)
    .maybeSingle();

  const currentValue = existing ? readField(existing, field) : null;
  const existingTags = (existing?.source_tags as Record<string, string> | null) || {};
  const existingSource = (existingTags?.[field] as SystemSourceTag | undefined) || "OWNER_PROVIDED";

  // Conflict path
  if (valuesConflict(currentValue, value)) {
    const incomingRank = TRUST_RANK[source];
    const existingRank = TRUST_RANK[existingSource];
    // Always log a pending verification so the user can review.
    await supabase.from("system_pending_verifications" as any).insert({
      property_id: propertyId,
      user_id: userId,
      system_name: systemName,
      field_path: field,
      value_a: String(currentValue),
      source_a: existingSource,
      value_b: String(value),
      source_b: source,
    });
    // Lower- or equal-trust source: do NOT overwrite.
    if (incomingRank <= existingRank) {
      return { ok: false, conflict: true };
    }
    // higher-trust falls through to update
  }

  // Build update payload
  const update: Record<string, any> = {};
  if (TOP_LEVEL_FIELDS.has(field)) {
    update[field] = value;
  } else {
    update.specs = { ...(existing?.specs as object | null ?? {}), [field]: value };
  }
  update.source_tags = { ...existingTags, [field]: source };
  if (notes && !existing?.notes) update.notes = notes;

  if (existing) {
    await supabase
      .from("system_details")
      .update(update as any)
      .eq("id", existing.id);
  } else {
    await supabase.from("system_details").insert({
      property_id: propertyId,
      user_id: userId,
      system_name: systemName,
      data_status: source === "OWNER_PROVIDED" ? "confirmed" : "ai_extracted",
      ...update,
    } as any);
  }

  return { ok: true, conflict: false };
}

export async function writeSystemFields(args: {
  propertyId: string;
  userId: string;
  systemName: string;
  fields: Record<string, string | number | boolean | null | undefined>;
  source: SystemSourceTag;
  notes?: string;
}) {
  let written = 0;
  let conflicts = 0;
  for (const [field, value] of Object.entries(args.fields)) {
    if (value == null || value === "") continue;
    const r = await writeSystemField({
      propertyId: args.propertyId,
      userId: args.userId,
      systemName: args.systemName,
      field,
      value: value as any,
      source: args.source,
      notes: args.notes,
    });
    if (r.ok) written++;
    if (r.conflict) conflicts++;
  }
  return { written, conflicts };
}