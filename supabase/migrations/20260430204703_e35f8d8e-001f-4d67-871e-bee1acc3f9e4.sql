-- =========================================
-- PROPERTY RECORD VAULT (LEGAL HOLD)
-- =========================================

-- Record type enum
DO $$ BEGIN
  CREATE TYPE public.vault_record_type AS ENUM (
    'permit',
    'inspection',
    'photo',
    'document',
    'finding',
    'system_data',
    'owner_submission',
    'dispute'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Record source enum
DO $$ BEGIN
  CREATE TYPE public.vault_record_source AS ENUM (
    'homeowner',
    'inspector',
    'county',
    'ai_extracted',
    'platform'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Legal extraction request type
DO $$ BEGIN
  CREATE TYPE public.legal_extraction_type AS ENUM (
    'court_order',
    'subpoena',
    'law_enforcement',
    'emergency',
    'disclosure_law'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- property_record_vault
-- =========================================
CREATE TABLE IF NOT EXISTS public.property_record_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  record_type public.vault_record_type NOT NULL,
  record_source public.vault_record_source NOT NULL,
  original_data JSONB NOT NULL,
  source_table TEXT,
  source_record_id UUID,
  supersedes_vault_id UUID REFERENCES public.property_record_vault(id) ON DELETE NO ACTION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID,
  legal_hold BOOLEAN NOT NULL DEFAULT true,
  visible_to_owner BOOLEAN NOT NULL DEFAULT true,
  hidden_at TIMESTAMPTZ,
  hidden_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_vault_property ON public.property_record_vault(property_id);
CREATE INDEX IF NOT EXISTS idx_vault_property_type ON public.property_record_vault(property_id, record_type);
CREATE INDEX IF NOT EXISTS idx_vault_source_record ON public.property_record_vault(source_table, source_record_id);

ALTER TABLE public.property_record_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_record_vault FORCE ROW LEVEL SECURITY;

-- SELECT: property owner sees only records still visible to them
DROP POLICY IF EXISTS "Owners view own visible vault records" ON public.property_record_vault;
CREATE POLICY "Owners view own visible vault records"
ON public.property_record_vault
FOR SELECT
TO authenticated
USING (
  visible_to_owner = true
  AND EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_record_vault.property_id
      AND p.user_id = auth.uid()
  )
);

-- SELECT: admins can see everything (for legal extraction handling)
DROP POLICY IF EXISTS "Admins view all vault records" ON public.property_record_vault;
CREATE POLICY "Admins view all vault records"
ON public.property_record_vault
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- INSERT: only via authenticated context; clients cannot directly insert.
-- Authenticated server-side functions (using user JWT) can insert into the vault
-- on behalf of the property owner.
DROP POLICY IF EXISTS "Authenticated insert vault records for own property" ON public.property_record_vault;
CREATE POLICY "Authenticated insert vault records for own property"
ON public.property_record_vault
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_record_vault.property_id
      AND (
        p.user_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
  )
);

-- NO update policy.
-- NO delete policy.

-- =========================================
-- Hard immutability backstop at Postgres level
-- =========================================
CREATE OR REPLACE FUNCTION public.prevent_vault_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'property_record_vault records are immutable and cannot be modified or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS vault_immutability_guard ON public.property_record_vault;
CREATE TRIGGER vault_immutability_guard
BEFORE UPDATE OR DELETE ON public.property_record_vault
FOR EACH ROW EXECUTE FUNCTION public.prevent_vault_modification();

-- =========================================
-- Owner-controlled visibility (separate table to avoid violating immutability)
-- =========================================
CREATE TABLE IF NOT EXISTS public.property_record_vault_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.property_record_vault(id) ON DELETE NO ACTION,
  property_id UUID NOT NULL,
  hidden_by_user_id UUID NOT NULL,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  UNIQUE (vault_id, hidden_by_user_id)
);

CREATE INDEX IF NOT EXISTS idx_vault_visibility_property ON public.property_record_vault_visibility(property_id);

ALTER TABLE public.property_record_vault_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own visibility flags" ON public.property_record_vault_visibility;
CREATE POLICY "Owners manage own visibility flags"
ON public.property_record_vault_visibility
FOR ALL
TO authenticated
USING (
  hidden_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_record_vault_visibility.property_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  hidden_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_record_vault_visibility.property_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins view all visibility flags" ON public.property_record_vault_visibility;
CREATE POLICY "Admins view all visibility flags"
ON public.property_record_vault_visibility
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =========================================
-- legal_extraction_requests
-- =========================================
CREATE TABLE IF NOT EXISTS public.legal_extraction_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID,
  requesting_party TEXT NOT NULL,
  request_type public.legal_extraction_type NOT NULL,
  request_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legal_documentation_reference TEXT,
  approved BOOLEAN,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  data_provided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extraction_property ON public.legal_extraction_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_extraction_received ON public.legal_extraction_requests(request_received_at DESC);

ALTER TABLE public.legal_extraction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_extraction_requests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view extraction requests" ON public.legal_extraction_requests;
CREATE POLICY "Admins view extraction requests"
ON public.legal_extraction_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins create extraction requests" ON public.legal_extraction_requests;
CREATE POLICY "Admins create extraction requests"
ON public.legal_extraction_requests
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update extraction requests" ON public.legal_extraction_requests;
CREATE POLICY "Admins update extraction requests"
ON public.legal_extraction_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- No delete on extraction requests
-- =========================================
-- Helper: archive_to_vault (security definer)
-- Server-side helper used by edge functions / triggers to write a vault entry.
-- =========================================
CREATE OR REPLACE FUNCTION public.archive_to_vault(
  _property_id UUID,
  _record_type public.vault_record_type,
  _record_source public.vault_record_source,
  _original_data JSONB,
  _source_table TEXT DEFAULT NULL,
  _source_record_id UUID DEFAULT NULL,
  _created_by_user_id UUID DEFAULT NULL,
  _supersedes_vault_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id UUID;
BEGIN
  INSERT INTO public.property_record_vault (
    property_id, record_type, record_source, original_data,
    source_table, source_record_id, created_by_user_id, supersedes_vault_id,
    legal_hold, visible_to_owner
  )
  VALUES (
    _property_id, _record_type, _record_source, _original_data,
    _source_table, _source_record_id, _created_by_user_id, _supersedes_vault_id,
    true, true
  )
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- =========================================
-- Helper: hide_vault_record (owner action)
-- Records the user's intent to hide; the vault record itself is untouched.
-- A computed view can join this for the owner-facing UI.
-- =========================================
CREATE OR REPLACE FUNCTION public.hide_vault_record(_vault_id UUID, _reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _prop UUID;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;

  SELECT v.property_id INTO _prop
    FROM public.property_record_vault v
    JOIN public.properties p ON p.id = v.property_id
   WHERE v.id = _vault_id AND p.user_id = _uid;

  IF _prop IS NULL THEN RETURN false; END IF;

  INSERT INTO public.property_record_vault_visibility (vault_id, property_id, hidden_by_user_id, reason)
  VALUES (_vault_id, _prop, _uid, _reason)
  ON CONFLICT (vault_id, hidden_by_user_id) DO UPDATE SET reason = EXCLUDED.reason, hidden_at = now();

  RETURN true;
END;
$$;