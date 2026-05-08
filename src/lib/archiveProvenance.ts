import { supabase } from "@/integrations/supabase/client";

export type ArchiveSourceTag =
  | "GOVERNMENT_API"
  | "DOCUMENT_EXTRACTED"
  | "OWNER_PROVIDED"
  | "PROFESSIONAL_SUBMITTED"
  | "AI_INFERRED";

const TAG_CONFIDENCE_DEFAULT: Record<ArchiveSourceTag, number> = {
  GOVERNMENT_API: 95,
  DOCUMENT_EXTRACTED: 80,
  PROFESSIONAL_SUBMITTED: 70,
  OWNER_PROVIDED: 50,
  AI_INFERRED: 20,
};

const TAG_TO_VAULT_SOURCE: Record<ArchiveSourceTag, "homeowner" | "inspector" | "county" | "ai_extracted" | "platform"> = {
  GOVERNMENT_API: "county",
  DOCUMENT_EXTRACTED: "ai_extracted",
  PROFESSIONAL_SUBMITTED: "inspector",
  OWNER_PROVIDED: "homeowner",
  AI_INFERRED: "ai_extracted",
};

export interface ArchiveRecordParams {
  propertyId: string;
  recordType: string;
  title: string;
  sourceTag: ArchiveSourceTag;
  description?: string;
  propertyAddress?: string;
  countyFips?: string;
  evidence?: unknown[];
  documents?: unknown[];
  homeownerNotes?: string;
  acknowledgmentAccepted?: boolean;
  confidence?: number;
}

export async function archiveRecord(p: ArchiveRecordParams) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in" };

  const confidence = p.confidence ?? TAG_CONFIDENCE_DEFAULT[p.sourceTag];
  const now = new Date().toISOString();

  const insert: Record<string, unknown> = {
    property_id: p.propertyId,
    user_id: userId,
    record_type: p.recordType,
    title: p.title,
    description: p.description ?? null,
    confidence_score: confidence,
    source_tag: p.sourceTag,
    property_address: p.propertyAddress ?? null,
    county_fips: p.countyFips ?? null,
    legal_acknowledgment_accepted: !!p.acknowledgmentAccepted,
    acknowledgment_timestamp: p.acknowledgmentAccepted ? now : null,
    evidence_sources: p.evidence ?? [],
    documents: p.documents ?? [],
    homeowner_notes: p.homeownerNotes ?? null,
    submitted_by_user_id: userId,
    submitted_at: now,
  };

  const { data, error } = await supabase
    .from("permanent_archive" as never)
    .insert(insert as never)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  try {
    await supabase.rpc("archive_to_vault", {
      _property_id: p.propertyId,
      _record_type: "system_data",
      _record_source: TAG_TO_VAULT_SOURCE[p.sourceTag],
      _original_data: insert as never,
      _source_table: "permanent_archive",
      _source_record_id: (data as { id: string }).id,
      _created_by_user_id: userId,
      _supersedes_vault_id: null,
    });
  } catch {
    /* best-effort */
  }

  return { ok: true, id: (data as { id: string }).id };
}

export const archiveGovernmentRecord = (p: Omit<ArchiveRecordParams, "sourceTag">) =>
  archiveRecord({ ...p, sourceTag: "GOVERNMENT_API" });
export const archiveDocumentExtraction = (p: Omit<ArchiveRecordParams, "sourceTag">) =>
  archiveRecord({ ...p, sourceTag: "DOCUMENT_EXTRACTED" });
export const archiveOwnerSubmission = (p: Omit<ArchiveRecordParams, "sourceTag">) =>
  archiveRecord({ ...p, sourceTag: "OWNER_PROVIDED" });
export const archiveProfessionalSubmission = (p: Omit<ArchiveRecordParams, "sourceTag">) =>
  archiveRecord({ ...p, sourceTag: "PROFESSIONAL_SUBMITTED" });
export const archiveAIInference = (p: Omit<ArchiveRecordParams, "sourceTag">) =>
  archiveRecord({ ...p, sourceTag: "AI_INFERRED" });

export async function confirmAIInferredRecord(archiveId: string) {
  const { error } = await supabase
    .from("permanent_archive" as never)
    .update({ confirmed_by_owner_at: new Date().toISOString() } as never)
    .eq("id", archiveId);
  return { ok: !error, error: error?.message };
}