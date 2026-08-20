DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f.sig);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.get_job_share_package(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_share_status(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_share_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_property_package(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_report(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_inspection_access_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_property_share(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_vault_record(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_inspection_one_time_access(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_to_vault(uuid, public.vault_record_type, public.vault_record_source, jsonb, text, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_property_connections(uuid, uuid, public.inspection_notification_type, jsonb) TO authenticated;