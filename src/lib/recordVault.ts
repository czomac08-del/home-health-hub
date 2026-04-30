import { supabase } from "@/integrations/supabase/client";

export type VaultRecordType =
  | "permit"
  | "inspection"
  | "photo"
  | "document"
  | "finding"
  | "system_data"
  | "owner_submission"
  | "dispute";

export type VaultRecordSource =
  | "homeowner"
  | "inspector"
  | "county"
  | "ai_extracted"
  | "platform";

export interface ArchiveToVaultParams {
  propertyId: string;
  recordType: VaultRecordType;
  recordSource: VaultRecordSource;
  originalData: Record<string, unknown>;
  sourceTable?: string;
  sourceRecordId?: string;
  supersedesVaultId?: string;
}

/**
 * Write a record to the immutable property record vault (legal hold).
 * The vault entry can never be modified or deleted once written.
 * Use this whenever a property record (permit, inspection, document,
 * photo, finding, system data) is created or amended.
 */
export async function archiveToVault(
  params: ArchiveToVaultParams,
): Promise<{ vaultId: string | null; error: Error | null }> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id ?? null;

  const { data, error } = await supabase.rpc("archive_to_vault", {
    _property_id: params.propertyId,
    _record_type: params.recordType,
    _record_source: params.recordSource,
    _original_data: params.originalData as never,
    _source_table: params.sourceTable ?? null,
    _source_record_id: params.sourceRecordId ?? null,
    _created_by_user_id: userId,
    _supersedes_vault_id: params.supersedesVaultId ?? null,
  });

  if (error) return { vaultId: null, error: new Error(error.message) };
  return { vaultId: (data as string) ?? null, error: null };
}

/**
 * Hide a vault record from the owner's own view. The record itself
 * stays in the legal archive; only the owner's visibility flag changes.
 */
export async function hideVaultRecord(
  vaultId: string,
  reason?: string,
): Promise<{ ok: boolean; error: Error | null }> {
  const { data, error } = await supabase.rpc("hide_vault_record", {
    _vault_id: vaultId,
    _reason: reason ?? null,
  });
  if (error) return { ok: false, error: new Error(error.message) };
  return { ok: data === true, error: null };
}

export const LEGAL_HOLD_DELETE_MESSAGE =
  "Property records on ComingHomeIQ are retained permanently as part of our legal compliance obligations. You can hide this record from your view or flag it as disputed, but it cannot be permanently removed. This policy protects you, future buyers, and the integrity of property history. See our Terms of Service for details.";

export const LEGAL_HOLD_HIDDEN_NOTE =
  "This record has been hidden from your view at your request but is retained in our system as required by applicable law.";