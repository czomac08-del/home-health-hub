REVOKE EXECUTE ON FUNCTION public.archive_to_vault(uuid, public.vault_record_type, public.vault_record_source, jsonb, text, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_to_vault(uuid, public.vault_record_type, public.vault_record_source, jsonb, text, uuid, uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.hide_vault_record(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hide_vault_record(uuid, text) TO authenticated;