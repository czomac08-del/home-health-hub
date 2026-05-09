
-- ============ property_shares extensions ============
ALTER TABLE public.property_shares
  ADD COLUMN IF NOT EXISTS share_scope TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS share_type TEXT NOT NULL DEFAULT 'realtor',
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.system_details(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_description TEXT,
  ADD COLUMN IF NOT EXISTS access_notes TEXT,
  ADD COLUMN IF NOT EXISTS allow_submission BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS submission_status TEXT NOT NULL DEFAULT 'pending';

DO $$ BEGIN
  ALTER TABLE public.property_shares
    ADD CONSTRAINT property_shares_share_scope_check
    CHECK (share_scope IN ('full', 'job'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.property_shares
    ADD CONSTRAINT property_shares_share_type_check
    CHECK (share_type IN ('realtor', 'contractor', 'inspector'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.property_shares
    ADD CONSTRAINT property_shares_submission_status_check
    CHECK (submission_status IN ('pending', 'submitted', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_property_shares_system ON public.property_shares(system_id);
CREATE INDEX IF NOT EXISTS idx_property_shares_share_type ON public.property_shares(share_type);

-- ============ maintenance_history extensions ============
ALTER TABLE public.maintenance_history
  ADD COLUMN IF NOT EXISTS parts_replaced TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS part_models TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS labor_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_tag TEXT NOT NULL DEFAULT 'OWNER',
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.system_details(id) ON DELETE SET NULL;

-- ============ contractor_submissions ============
CREATE TABLE IF NOT EXISTS public.contractor_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.property_shares(id) ON DELETE CASCADE,
  share_token UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system_id UUID REFERENCES public.system_details(id) ON DELETE SET NULL,
  contractor_name TEXT,
  contractor_email TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  work_performed TEXT NOT NULL,
  parts_replaced TEXT[] DEFAULT '{}',
  part_models TEXT[] DEFAULT '{}',
  labor_hours NUMERIC,
  invoice_amount NUMERIC,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  source_tag TEXT NOT NULL DEFAULT 'CONTRACTOR_SUBMITTED',
  homeowner_approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  maintenance_record_id UUID REFERENCES public.maintenance_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contractor_submissions_property ON public.contractor_submissions(property_id);
CREATE INDEX IF NOT EXISTS idx_contractor_submissions_system ON public.contractor_submissions(system_id);
CREATE INDEX IF NOT EXISTS idx_contractor_submissions_token ON public.contractor_submissions(share_token);

ALTER TABLE public.contractor_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert if share is active, contractor type, allow_submission true
CREATE POLICY "Public can submit via active job share"
  ON public.contractor_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_shares s
      WHERE s.id = share_id
        AND s.token = share_token
        AND s.property_id = contractor_submissions.property_id
        AND s.share_scope = 'job'
        AND s.share_type = 'contractor'
        AND s.allow_submission = true
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
    )
  );

-- Public can view their own submission by token (anon read after submit)
CREATE POLICY "Public can view submission by token"
  ON public.contractor_submissions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_shares s
      WHERE s.id = share_id AND s.token = share_token
        AND s.revoked_at IS NULL AND s.expires_at > now()
    )
  );

-- Homeowner can view + update submissions for their property
CREATE POLICY "Owner can view contractor submissions"
  ON public.contractor_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Owner can update contractor submissions"
  ON public.contractor_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid())
  );

-- ============ inspector_submissions ============
CREATE TABLE IF NOT EXISTS public.inspector_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.property_shares(id) ON DELETE CASCADE,
  share_token UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system_id UUID REFERENCES public.system_details(id) ON DELETE SET NULL,
  inspector_name TEXT,
  inspector_email TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  findings_summary TEXT NOT NULL,
  deficiency_level TEXT,
  parts_replaced TEXT[] DEFAULT '{}',
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  source_tag TEXT NOT NULL DEFAULT 'INSPECTOR_SUBMITTED',
  homeowner_approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.inspector_submissions
    ADD CONSTRAINT inspector_submissions_deficiency_check
    CHECK (deficiency_level IS NULL OR deficiency_level IN ('minor', 'major', 'safety'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_inspector_submissions_property ON public.inspector_submissions(property_id);
CREATE INDEX IF NOT EXISTS idx_inspector_submissions_token ON public.inspector_submissions(share_token);

ALTER TABLE public.inspector_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit via active inspector share"
  ON public.inspector_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_shares s
      WHERE s.id = share_id
        AND s.token = share_token
        AND s.property_id = inspector_submissions.property_id
        AND s.share_type = 'inspector'
        AND s.allow_submission = true
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
    )
  );

CREATE POLICY "Public can view inspector submission by token"
  ON public.inspector_submissions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_shares s
      WHERE s.id = share_id AND s.token = share_token
        AND s.revoked_at IS NULL AND s.expires_at > now()
    )
  );

CREATE POLICY "Owner can view inspector submissions"
  ON public.inspector_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Owner can update inspector submissions"
  ON public.inspector_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid())
  );

-- ============ Public RPC: get_job_share_package ============
CREATE OR REPLACE FUNCTION public.get_job_share_package(_token UUID)
RETURNS TABLE(
  status TEXT,
  share_id UUID,
  property_id UUID,
  system_id UUID,
  share_type TEXT,
  job_description TEXT,
  access_notes TEXT,
  allow_submission BOOLEAN,
  submission_status TEXT,
  property_address_short TEXT,
  system_name TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  install_date TEXT,
  last_service TEXT,
  specs JSONB,
  expires_at TIMESTAMPTZ,
  recent_history JSONB,
  has_submission BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row record;
  _hist JSONB;
  _has_sub BOOLEAN;
  _addr_short TEXT;
BEGIN
  SELECT s.id, s.property_id, s.system_id, s.share_type, s.job_description, s.access_notes,
         s.allow_submission, s.submission_status, s.expires_at, s.revoked_at,
         prop.address, prop.city,
         sd.system_name, sd.brand, sd.model, sd.serial_number, sd.install_date, sd.last_service, sd.specs
    INTO _row
    FROM public.property_shares s
    JOIN public.properties prop ON prop.id = s.property_id
    LEFT JOIN public.system_details sd ON sd.id = s.system_id
   WHERE s.token = _token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::boolean, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, NULL::timestamptz, NULL::jsonb, NULL::boolean;
    RETURN;
  END IF;

  IF _row.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT 'revoked'::text, _row.id, _row.property_id, _row.system_id, _row.share_type, _row.job_description, _row.access_notes, _row.allow_submission, _row.submission_status, NULL::text, _row.system_name, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, _row.expires_at, NULL::jsonb, false;
    RETURN;
  END IF;

  IF _row.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::text, _row.id, _row.property_id, _row.system_id, _row.share_type, _row.job_description, _row.access_notes, _row.allow_submission, _row.submission_status, NULL::text, _row.system_name, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::jsonb, _row.expires_at, NULL::jsonb, false;
    RETURN;
  END IF;

  -- short address: street + city only
  _addr_short := COALESCE(split_part(COALESCE(_row.address, ''), ',', 1), '');
  IF _row.city IS NOT NULL AND _row.city <> '' THEN
    _addr_short := _addr_short || ', ' || _row.city;
  END IF;

  -- last 3 maintenance entries for the system
  IF _row.system_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(row_to_json(h)), '[]'::jsonb) INTO _hist
    FROM (
      SELECT id, system_name, action, performed_date, performed_by, parts_replaced, source_tag
        FROM public.maintenance_history
       WHERE property_id = _row.property_id
         AND (system_id = _row.system_id OR system_name = _row.system_name)
       ORDER BY performed_date DESC NULLS LAST, created_at DESC
       LIMIT 3
    ) h;
  ELSE
    _hist := '[]'::jsonb;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.contractor_submissions cs
     WHERE cs.share_id = _row.id
  ) OR EXISTS (
    SELECT 1 FROM public.inspector_submissions ins
     WHERE ins.share_id = _row.id
  ) INTO _has_sub;

  RETURN QUERY SELECT 'active'::text, _row.id, _row.property_id, _row.system_id, _row.share_type, _row.job_description, _row.access_notes, _row.allow_submission, _row.submission_status,
    _addr_short, _row.system_name, _row.brand, _row.model, _row.serial_number, _row.install_date, _row.last_service, _row.specs, _row.expires_at, _hist, _has_sub;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_share_package(UUID) TO anon, authenticated;

-- ============ Storage bucket for contractor/inspector uploads ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-submissions', 'contractor-submissions', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read contractor submissions"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'contractor-submissions');

CREATE POLICY "Public can upload to contractor submissions"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'contractor-submissions');
