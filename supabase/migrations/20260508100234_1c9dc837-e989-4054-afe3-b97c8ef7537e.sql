
-- 6. Reinforce permanent_archive immutability — block changes to provenance fields
CREATE OR REPLACE FUNCTION public.enforce_archive_provenance_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.provenance_locked = true THEN
    IF NEW.submitted_by_user_id IS DISTINCT FROM OLD.submitted_by_user_id
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
       OR NEW.submitted_ip IS DISTINCT FROM OLD.submitted_ip
       OR NEW.legal_acknowledgment_text IS DISTINCT FROM OLD.legal_acknowledgment_text
       OR NEW.acknowledgment_timestamp IS DISTINCT FROM OLD.acknowledgment_timestamp
       OR NEW.provenance_locked IS DISTINCT FROM OLD.provenance_locked THEN
      RAISE EXCEPTION 'permanent_archive provenance fields are immutable once set';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 12. Address-keyed refresh cooldown — index for the cooldown lookup
CREATE INDEX IF NOT EXISTS idx_refresh_logs_address_hash_recent
  ON public.refresh_logs(address_hash, created_at DESC);

-- 9. Storage object policies (path-based owner enforcement)
-- Convention: paths begin with `<user_id>/...`
DO $$
DECLARE b text;
BEGIN
  FOR b IN SELECT unnest(ARRAY[
    'system-photos','system-documents','insurance-documents',
    'warranty-documents','property-records','inspector-media','fix-verification'
  ])
  LOOP
    EXECUTE format($p$
      DROP POLICY IF EXISTS "owner read %1$s" ON storage.objects;
      CREATE POLICY "owner read %1$s" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = %2$L AND auth.uid()::text = (storage.foldername(name))[1]);
      DROP POLICY IF EXISTS "owner write %1$s" ON storage.objects;
      CREATE POLICY "owner write %1$s" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = %2$L AND auth.uid()::text = (storage.foldername(name))[1]);
      DROP POLICY IF EXISTS "owner delete %1$s" ON storage.objects;
      CREATE POLICY "owner delete %1$s" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = %2$L AND auth.uid()::text = (storage.foldername(name))[1]);
    $p$, b, b);
  END LOOP;
END $$;

-- 7. Default expiry to 30 days for new shared reports if not specified
ALTER TABLE public.shared_reports
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');
