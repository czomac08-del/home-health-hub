
-- 1. Add SET search_path to email queue functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END; $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END; $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END; $$;

-- 2. Revoke EXECUTE from anon/authenticated/PUBLIC on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.create_default_structure_for_property() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_archive_provenance_immutable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_email_setup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_vault_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_archive_dispute_state() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_inspection_review_trial() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_user_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_property_connections(uuid, uuid, inspection_notification_type, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.archive_to_vault(uuid, vault_record_type, vault_record_source, jsonb, text, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.extend_inspection_one_time_access(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 3. Tighten referral_codes
DROP POLICY IF EXISTS "Anyone can validate a code by value" ON public.referral_codes;

CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS TABLE(user_id uuid, code text, referrer_type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT rc.user_id, rc.code, rc.referrer_type
  FROM public.referral_codes rc
  WHERE rc.code = _code
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- 4. Tighten certification_shares
DROP POLICY IF EXISTS "Anyone can view by token" ON public.certification_shares;

-- 5. Contractor submissions storage policies (bucket itself flipped private via storage API)
DROP POLICY IF EXISTS "Public can upload to contractor submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public read contractor submissions" ON storage.objects;

CREATE POLICY "Submit to contractor bucket via active share token"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'contractor-submissions'
  AND EXISTS (
    SELECT 1 FROM public.property_shares ps
    WHERE ps.token::text = (storage.foldername(name))[1]
      AND ps.revoked_at IS NULL
      AND (ps.expires_at IS NULL OR ps.expires_at > now())
  )
);

CREATE POLICY "Owners can read their contractor submission files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contractor-submissions'
  AND EXISTS (
    SELECT 1 FROM public.property_shares ps
    JOIN public.properties p ON p.id = ps.property_id
    WHERE ps.token::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
  )
);
