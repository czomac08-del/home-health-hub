import { supabase } from "@/integrations/supabase/client";

export type DataSource =
  | "inspector_verified"
  | "county_record"
  | "ai_extracted"
  | "owner_submitted";

export const TRUST_RANK: Record<DataSource, number> = {
  inspector_verified: 4,
  county_record: 3,
  ai_extracted: 2,
  owner_submitted: 1,
};

export const SOURCE_LABEL: Record<DataSource, string> = {
  inspector_verified: "Inspector Verified",
  county_record: "County Record",
  ai_extracted: "AI Extracted",
  owner_submitted: "Owner Submitted",
};

export interface FieldSource {
  id: string;
  property_id: string;
  field_path: string;
  current_source: DataSource;
  current_value: string | null;
  inspector_name: string | null;
  inspector_company: string | null;
  inspector_license: string | null;
  inspection_date: string | null;
  source_record_id: string | null;
  has_open_dispute: boolean;
  updated_at: string;
}

export interface WriteFieldArgs {
  propertyId: string;
  userId: string;
  fieldPath: string;
  value: string | null;
  source: DataSource;
  sourceLabel?: string;
  sourceRecordId?: string | null;
  inspector?: {
    name?: string | null;
    company?: string | null;
    license?: string | null;
    inspection_date?: string | null;
  } | null;
  /** force overwrite (e.g. dispute resolution with official docs) */
  force?: boolean;
}

/**
 * Trust-aware field write.
 * - Records prior value into data_history (append-only)
 * - Upserts current source in field_sources
 * - Writes a row to data_audit_log, flagging suspicious overwrites
 * - Refuses to overwrite higher-trust data unless `force` is true
 *   (caller should open a dispute instead)
 */
export async function writeTrustedField(
  args: WriteFieldArgs
): Promise<{ ok: boolean; reason?: string; flagged?: boolean }> {
  const {
    propertyId,
    userId,
    fieldPath,
    value,
    source,
    sourceLabel,
    sourceRecordId = null,
    inspector = null,
    force = false,
  } = args;

  // Look up current source for this field
  const { data: existingRaw } = await supabase
    .from("field_sources" as any)
    .select("*")
    .eq("property_id", propertyId)
    .eq("field_path", fieldPath)
    .maybeSingle();
  const existing = existingRaw as FieldSource | null;

  let flagged = false;
  let flagReason: string | null = null;

  if (existing) {
    const incomingRank = TRUST_RANK[source];
    const existingRank = TRUST_RANK[existing.current_source];
    if (incomingRank < existingRank && !force) {
      // Flag attempt to overwrite higher-trust data without dispute
      flagged = true;
      flagReason = `Owner attempted to overwrite ${existing.current_source} value without filing a dispute.`;
      await supabase.from("data_audit_log" as any).insert({
        property_id: propertyId,
        user_id: userId,
        actor_user_id: userId,
        action: "update_blocked",
        entity_type: "field",
        field_path: fieldPath,
        old_value: existing.current_value,
        new_value: value,
        old_source: existing.current_source,
        new_source: source,
        flagged_for_review: true,
        flag_reason: flagReason,
      });
      return {
        ok: false,
        reason: `This field is ${SOURCE_LABEL[existing.current_source]}. File a dispute to challenge it.`,
        flagged: true,
      };
    }
  }

  // Mark prior history rows as not-current
  if (existing) {
    await supabase
      .from("data_history" as any)
      .update({ is_current: false })
      .eq("property_id", propertyId)
      .eq("field_path", fieldPath)
      .eq("is_current", true);
  }

  // Append new history row
  await supabase.from("data_history" as any).insert({
    property_id: propertyId,
    user_id: userId,
    field_path: fieldPath,
    field_value: value,
    source,
    source_label: sourceLabel ?? SOURCE_LABEL[source],
    source_record_id: sourceRecordId,
    entered_by_user_id: userId,
    replaced_value: existing?.current_value ?? null,
    replaced_source: existing?.current_source ?? null,
    is_current: true,
  });

  // Upsert current source pointer
  await supabase.from("field_sources" as any).upsert(
    {
      property_id: propertyId,
      user_id: userId,
      field_path: fieldPath,
      current_source: source,
      current_value: value,
      inspector_name: inspector?.name ?? null,
      inspector_company: inspector?.company ?? null,
      inspector_license: inspector?.license ?? null,
      inspection_date: inspector?.inspection_date ?? null,
      source_record_id: sourceRecordId,
      has_open_dispute: false,
    },
    { onConflict: "property_id,field_path" }
  );

  // Audit log
  await supabase.from("data_audit_log" as any).insert({
    property_id: propertyId,
    user_id: userId,
    actor_user_id: userId,
    action: existing ? "update" : "create",
    entity_type: "field",
    field_path: fieldPath,
    old_value: existing?.current_value ?? null,
    new_value: value,
    old_source: existing?.current_source ?? null,
    new_source: source,
    flagged_for_review: false,
  });

  // Frequency check: > 3 changes in 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("data_audit_log" as any)
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("field_path", fieldPath)
    .gte("created_at", since);
  if ((count ?? 0) > 3) {
    await supabase.from("data_audit_log" as any).insert({
      property_id: propertyId,
      user_id: userId,
      actor_user_id: userId,
      action: "frequency_flag",
      entity_type: "field",
      field_path: fieldPath,
      flagged_for_review: true,
      flag_reason: `Field changed ${count} times in 30 days.`,
    });
    flagged = true;
  }

  return { ok: true, flagged };
}

export async function getFieldSources(
  propertyId: string
): Promise<Record<string, FieldSource>> {
  const { data } = await supabase
    .from("field_sources" as any)
    .select("*")
    .eq("property_id", propertyId);
  const map: Record<string, FieldSource> = {};
  ((data as unknown) as FieldSource[] | null)?.forEach((row) => {
    map[row.field_path] = row;
  });
  return map;
}

export async function fileDispute(args: {
  propertyId: string;
  userId: string;
  fieldPath?: string | null;
  findingId?: string | null;
  propertyRecordId?: string | null;
  inspectorFindingText?: string | null;
  homeownerStatement: string;
  supportingDocuments?: Array<{ name: string; url: string }>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from("disputes" as any)
    .insert({
      property_id: args.propertyId,
      user_id: args.userId,
      field_path: args.fieldPath ?? null,
      finding_id: args.findingId ?? null,
      property_record_id: args.propertyRecordId ?? null,
      inspector_finding_text: args.inspectorFindingText ?? null,
      homeowner_statement: args.homeownerStatement,
      supporting_documents: args.supportingDocuments ?? [],
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Flag the related field as having an open dispute
  if (args.fieldPath) {
    await supabase
      .from("field_sources" as any)
      .update({ has_open_dispute: true })
      .eq("property_id", args.propertyId)
      .eq("field_path", args.fieldPath);
  }

  await supabase.from("data_audit_log" as any).insert({
    property_id: args.propertyId,
    user_id: args.userId,
    actor_user_id: args.userId,
    action: "dispute",
    entity_type: "finding",
    entity_id: args.findingId ?? null,
    field_path: args.fieldPath ?? null,
    metadata: { homeowner_statement: args.homeownerStatement },
  });

  return { ok: true, id: (data as { id: string } | null)?.id };
}