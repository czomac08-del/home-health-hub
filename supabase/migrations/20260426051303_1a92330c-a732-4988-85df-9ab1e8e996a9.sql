-- =========================================================
-- Data Trust Hierarchy + Dispute Resolution System
-- =========================================================

-- Trust source enum
DO $$ BEGIN
  CREATE TYPE public.data_source_type AS ENUM (
    'inspector_verified',
    'county_record',
    'ai_extracted',
    'owner_submitted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM (
    'open',
    'under_review',
    'resolved_upheld',
    'resolved_updated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------
-- data_history: append-only history of every field value
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  field_path TEXT NOT NULL,
  field_value TEXT,
  source public.data_source_type NOT NULL DEFAULT 'owner_submitted',
  source_label TEXT,
  source_record_id UUID,
  entered_by_user_id UUID,
  replaced_value TEXT,
  replaced_source public.data_source_type,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_history_property ON public.data_history(property_id, field_path);
CREATE INDEX IF NOT EXISTS idx_data_history_current ON public.data_history(property_id, is_current);

ALTER TABLE public.data_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own data history" ON public.data_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own data history" ON public.data_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own data history" ON public.data_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- No DELETE policy — history is permanent.

-- ---------------------------------------------------------
-- field_sources: current trust source per (property, field)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.field_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  field_path TEXT NOT NULL,
  current_source public.data_source_type NOT NULL,
  current_value TEXT,
  inspector_name TEXT,
  inspector_company TEXT,
  inspector_license TEXT,
  inspection_date DATE,
  source_record_id UUID,
  has_open_dispute BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, field_path)
);

CREATE INDEX IF NOT EXISTS idx_field_sources_property ON public.field_sources(property_id);

ALTER TABLE public.field_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own field sources" ON public.field_sources
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own field sources" ON public.field_sources
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own field sources" ON public.field_sources
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_field_sources_updated
  BEFORE UPDATE ON public.field_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------
-- inspector_media: inspector-uploaded photos
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspector_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  property_record_id UUID REFERENCES public.property_records(id) ON DELETE SET NULL,
  finding_id TEXT,
  system_type TEXT,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  inspector_name TEXT,
  inspector_company TEXT,
  inspection_date DATE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspector_media_property ON public.inspector_media(property_id);
CREATE INDEX IF NOT EXISTS idx_inspector_media_system ON public.inspector_media(property_id, system_type);

ALTER TABLE public.inspector_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own inspector media" ON public.inspector_media
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inspector media" ON public.inspector_media
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- No update/delete — inspector media is permanent record.

-- ---------------------------------------------------------
-- disputes: homeowner disputes against inspector findings
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  property_record_id UUID REFERENCES public.property_records(id) ON DELETE SET NULL,
  finding_id TEXT,
  field_path TEXT,
  inspector_finding_text TEXT,
  homeowner_statement TEXT NOT NULL,
  supporting_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  date_filed TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_property ON public.disputes(property_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own disputes" ON public.disputes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own disputes" ON public.disputes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own open disputes" ON public.disputes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status IN ('open','under_review'));
CREATE POLICY "Admins view all disputes" ON public.disputes
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update all disputes" ON public.disputes
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_disputes_updated
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------
-- data_audit_log: full audit trail + admin review flags
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  actor_user_id UUID,
  action TEXT NOT NULL, -- create | update | delete | dispute | upload | document_deleted
  entity_type TEXT NOT NULL, -- field | document | photo | finding
  entity_id TEXT,
  field_path TEXT,
  old_value TEXT,
  new_value TEXT,
  old_source public.data_source_type,
  new_source public.data_source_type,
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_property ON public.data_audit_log(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_flagged ON public.data_audit_log(flagged_for_review) WHERE flagged_for_review = true;

ALTER TABLE public.data_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audit log" ON public.data_audit_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audit log" ON public.data_audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all audit logs" ON public.data_audit_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
-- No update/delete — audit log is permanent.

-- ---------------------------------------------------------
-- Storage bucket for inspector media (private, owner-readable)
-- ---------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspector-media', 'inspector-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view own inspector media files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inspector-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own inspector media files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspector-media' AND auth.uid()::text = (storage.foldername(name))[1]);
