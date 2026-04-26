-- ============================================================
-- Inspection findings (per-finding state, replacing localStorage)
-- ============================================================
CREATE TABLE public.inspection_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  inspection_record_id UUID NOT NULL REFERENCES public.property_records(id) ON DELETE CASCADE,
  finding_key TEXT NOT NULL, -- stable hash/index from extracted report
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  recommendation TEXT,
  is_diy BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','fixed','skipped')),
  fix_verification_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_record_id, finding_key)
);

CREATE INDEX idx_findings_property ON public.inspection_findings(property_id);
CREATE INDEX idx_findings_inspection ON public.inspection_findings(inspection_record_id);
CREATE INDEX idx_findings_status ON public.inspection_findings(status);

ALTER TABLE public.inspection_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own findings"
  ON public.inspection_findings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own findings"
  ON public.inspection_findings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own findings"
  ON public.inspection_findings FOR UPDATE
  USING (auth.uid() = user_id);

-- No DELETE policy — findings are permanent

-- ============================================================
-- Fix verifications (permanent record of every fix claim)
-- ============================================================
CREATE TABLE public.fix_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  finding_id UUID NOT NULL REFERENCES public.inspection_findings(id) ON DELETE CASCADE,
  fix_type TEXT NOT NULL CHECK (fix_type IN ('diy','professional')),
  date_completed DATE NOT NULL,
  description TEXT,
  -- Contractor info (professional fixes)
  contractor_name TEXT,
  contractor_license TEXT,
  trade_type TEXT,
  -- File arrays: each entry is { storage_path, url, file_name, caption?, kind }
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Trust flags
  data_quality_flag TEXT NOT NULL DEFAULT 'unverified'
    CHECK (data_quality_flag IN ('unverified','pro_verified','permit_verified')),
  has_permit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fixver_property ON public.fix_verifications(property_id);
CREATE INDEX idx_fixver_finding ON public.fix_verifications(finding_id);

ALTER TABLE public.fix_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own fix verifications"
  ON public.fix_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own fix verifications"
  ON public.fix_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE — fix verifications are permanent and immutable

-- FK back to fix_verifications now that table exists
ALTER TABLE public.inspection_findings
  ADD CONSTRAINT findings_fix_verification_fk
  FOREIGN KEY (fix_verification_id) REFERENCES public.fix_verifications(id) ON DELETE SET NULL;

-- updated_at triggers
CREATE TRIGGER update_findings_updated_at
  BEFORE UPDATE ON public.inspection_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fixver_updated_at
  BEFORE UPDATE ON public.fix_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Storage bucket for fix verification files (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('fix-verification', 'fix-verification', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view own fix files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fix-verification'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload own fix files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fix-verification'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );