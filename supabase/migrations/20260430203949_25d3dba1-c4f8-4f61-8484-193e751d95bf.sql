
-- =====================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================

-- ---------- property_claims ----------
CREATE TABLE IF NOT EXISTS public.property_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  claimant_user_id UUID NOT NULL,
  typed_address TEXT NOT NULL,
  verification_path TEXT NOT NULL CHECK (verification_path IN ('zip_county','document_ocr')),
  zip_last4 TEXT,
  county_typed TEXT,
  document_match_confidence NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ip_address TEXT,
  user_agent TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimants view own claims" ON public.property_claims
  FOR SELECT USING (auth.uid() = claimant_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Claimants create own claims" ON public.property_claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_user_id);

CREATE POLICY "Admins update claims" ON public.property_claims
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_property_claims_updated_at
  BEFORE UPDATE ON public.property_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- claim_attempt_log ----------
CREATE TABLE IF NOT EXISTS public.claim_attempt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.property_claims(id) ON DELETE SET NULL,
  property_id UUID,
  attempted_by_user_id UUID,
  outcome TEXT NOT NULL CHECK (outcome IN ('success','fail')),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_attempt_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Self read attempts" ON public.claim_attempt_log
  FOR SELECT USING (auth.uid() = attempted_by_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated insert attempts" ON public.claim_attempt_log
  FOR INSERT WITH CHECK (auth.uid() = attempted_by_user_id);

-- ---------- shared_reports ----------
CREATE TABLE IF NOT EXISTS public.shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  report_kind TEXT NOT NULL DEFAULT 'home_passport',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages share links" ON public.shared_reports
  FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE TRIGGER trg_shared_reports_updated_at
  BEFORE UPDATE ON public.shared_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public read function (security definer) — only returns active links
CREATE OR REPLACE FUNCTION public.get_shared_report(_token UUID)
RETURNS TABLE (
  id UUID,
  property_id UUID,
  created_by UUID,
  expires_at TIMESTAMPTZ,
  report_kind TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, property_id, created_by, expires_at, report_kind, created_at
  FROM public.shared_reports
  WHERE id = _token
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > now())
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_report(UUID) TO anon, authenticated;

-- ---------- address_refresh_cache ----------
CREATE TABLE IF NOT EXISTS public.address_refresh_cache (
  cache_key TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  county_fips TEXT,
  address_hash TEXT,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_address_refresh_cache_expiry
  ON public.address_refresh_cache (expires_at);

ALTER TABLE public.address_refresh_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read cache" ON public.address_refresh_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT/UPDATE only via service role (no policy = blocked for client roles)

-- ---------- permanent_archive provenance + dispute ----------
ALTER TABLE public.permanent_archive
  ADD COLUMN IF NOT EXISTS submitted_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_ip TEXT,
  ADD COLUMN IF NOT EXISTS legal_acknowledgment_text TEXT,
  ADD COLUMN IF NOT EXISTS provenance_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dispute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_suppressed BOOLEAN NOT NULL DEFAULT false;

-- Trigger: lock provenance fields once set
CREATE OR REPLACE FUNCTION public.enforce_archive_provenance_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.provenance_locked = true THEN
    IF NEW.submitted_by_user_id IS DISTINCT FROM OLD.submitted_by_user_id
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
       OR NEW.submitted_ip IS DISTINCT FROM OLD.submitted_ip
       OR NEW.legal_acknowledgment_text IS DISTINCT FROM OLD.legal_acknowledgment_text
       OR NEW.provenance_locked IS DISTINCT FROM OLD.provenance_locked THEN
      RAISE EXCEPTION 'permanent_archive provenance fields are immutable once set';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_permanent_archive_provenance ON public.permanent_archive;
CREATE TRIGGER trg_permanent_archive_provenance
  BEFORE UPDATE ON public.permanent_archive
  FOR EACH ROW EXECUTE FUNCTION public.enforce_archive_provenance_immutable();

-- ---------- permanent_archive_disputes ----------
CREATE TABLE IF NOT EXISTS public.permanent_archive_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id UUID NOT NULL REFERENCES public.permanent_archive(id) ON DELETE CASCADE,
  disputed_by_user_id UUID NOT NULL,
  reason TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (archive_id, disputed_by_user_id)
);

ALTER TABLE public.permanent_archive_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated create disputes" ON public.permanent_archive_disputes
  FOR INSERT WITH CHECK (auth.uid() = disputed_by_user_id);

CREATE POLICY "Read own + admin all" ON public.permanent_archive_disputes
  FOR SELECT USING (auth.uid() = disputed_by_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admin resolve" ON public.permanent_archive_disputes
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Trigger: recompute dispute_count + auto_suppressed
CREATE OR REPLACE FUNCTION public.recompute_archive_dispute_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_unique_disputers INTEGER;
  total_unresolved INTEGER;
BEGIN
  SELECT COUNT(DISTINCT disputed_by_user_id)
    INTO recent_unique_disputers
    FROM public.permanent_archive_disputes
   WHERE archive_id = COALESCE(NEW.archive_id, OLD.archive_id)
     AND resolved = false
     AND created_at > now() - interval '30 days';

  SELECT COUNT(*) INTO total_unresolved
    FROM public.permanent_archive_disputes
   WHERE archive_id = COALESCE(NEW.archive_id, OLD.archive_id)
     AND resolved = false;

  UPDATE public.permanent_archive
     SET dispute_count = total_unresolved,
         auto_suppressed = (recent_unique_disputers > 1)
   WHERE id = COALESCE(NEW.archive_id, OLD.archive_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_dispute_recompute ON public.permanent_archive_disputes;
CREATE TRIGGER trg_archive_dispute_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.permanent_archive_disputes
  FOR EACH ROW EXECUTE FUNCTION public.recompute_archive_dispute_state();

-- ---------- verification_events: IP + UA ----------
ALTER TABLE public.verification_events
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ---------- refresh_logs: cache key columns ----------
ALTER TABLE public.refresh_logs
  ADD COLUMN IF NOT EXISTS cache_key TEXT,
  ADD COLUMN IF NOT EXISTS address_hash TEXT,
  ADD COLUMN IF NOT EXISTS county_fips TEXT;

CREATE INDEX IF NOT EXISTS idx_refresh_logs_cache_key
  ON public.refresh_logs (cache_key, created_at DESC);

-- ---------- auth_failure_log ----------
CREATE TABLE IF NOT EXISTS public.auth_failure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_lower TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_failure_email_time
  ON public.auth_failure_log (email_lower, created_at DESC);

ALTER TABLE public.auth_failure_log ENABLE ROW LEVEL SECURITY;
-- No client policies; only service role writes/reads.
