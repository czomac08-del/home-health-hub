DROP POLICY IF EXISTS "Anyone can log consent" ON public.consent_log;

CREATE POLICY "Users can log own consent" ON public.consent_log
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
