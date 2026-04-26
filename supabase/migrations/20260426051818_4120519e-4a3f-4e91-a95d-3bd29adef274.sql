-- =========================================================
-- Privacy Compliance: Requests, Consent Log, Profile fields
-- =========================================================

-- ---------------------------------------------------------
-- privacy_requests: data subject access/correction/deletion
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access','correct','delete','opt_out_sale','opt_out_targeted_ads')),
  request_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  handled_by TEXT,
  response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON public.privacy_requests(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON public.privacy_requests(status);

ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own privacy requests" ON public.privacy_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own privacy requests" ON public.privacy_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all privacy requests" ON public.privacy_requests
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update all privacy requests" ON public.privacy_requests
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
-- No DELETE policy — privacy requests are permanent record.

CREATE TRIGGER trg_privacy_requests_updated
  BEFORE UPDATE ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------
-- consent_log: append-only audit of every consent action
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  consent_type TEXT NOT NULL,
  consent_value BOOLEAN NOT NULL,
  policy_version TEXT,
  context TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user ON public.consent_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_log_type ON public.consent_log(consent_type);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

-- Anyone (logged-in or anon) can write a consent record about themselves.
CREATE POLICY "Anyone can log consent" ON public.consent_log
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users view own consent log" ON public.consent_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all consent log" ON public.consent_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
-- No update/delete — consent log is permanent.

-- ---------------------------------------------------------
-- profiles: consent / privacy fields
-- ---------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version_accepted TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS age_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opted_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opted_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anonymized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

-- Allow admins to update profiles (e.g. mark anonymized when fulfilling deletion).
DO $$ BEGIN
  CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------
-- property_records: upload-consent timestamp
-- ---------------------------------------------------------
ALTER TABLE public.property_records
  ADD COLUMN IF NOT EXISTS upload_consent_at TIMESTAMPTZ;
