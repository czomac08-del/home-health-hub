
-- Source classification enum
DO $$ BEGIN
  CREATE TYPE public.archive_source_tag AS ENUM (
    'GOVERNMENT_API',
    'DOCUMENT_EXTRACTED',
    'OWNER_PROVIDED',
    'PROFESSIONAL_SUBMITTED',
    'AI_INFERRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add provenance columns to permanent_archive
ALTER TABLE public.permanent_archive
  ADD COLUMN IF NOT EXISTS source_tag public.archive_source_tag,
  ADD COLUMN IF NOT EXISTS property_address text,
  ADD COLUMN IF NOT EXISTS county_fips text,
  ADD COLUMN IF NOT EXISTS legal_acknowledgment_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledgment_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by_owner_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_inferred_flagged_at timestamptz;

-- Best-effort backfill: use record_type heuristics
UPDATE public.permanent_archive
   SET source_tag = 'OWNER_PROVIDED'
 WHERE source_tag IS NULL;

CREATE INDEX IF NOT EXISTS idx_permanent_archive_source_tag
  ON public.permanent_archive(source_tag);
CREATE INDEX IF NOT EXISTS idx_permanent_archive_visible
  ON public.permanent_archive(property_id, auto_suppressed, status);

-- Acknowledgment log: one row per (user, property, record_type)
CREATE TABLE IF NOT EXISTS public.acknowledgment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  acknowledgment_text text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  accepted_ip text,
  UNIQUE (user_id, property_id, record_type)
);

ALTER TABLE public.acknowledgment_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own acknowledgments" ON public.acknowledgment_log;
CREATE POLICY "Users view own acknowledgments" ON public.acknowledgment_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own acknowledgments" ON public.acknowledgment_log;
CREATE POLICY "Users insert own acknowledgments" ON public.acknowledgment_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_acknowledgment_log_lookup
  ON public.acknowledgment_log(user_id, property_id, record_type);

-- View for AI_INFERRED records older than 90 days and unconfirmed
CREATE OR REPLACE VIEW public.ai_inferred_unconfirmed AS
  SELECT id, property_id, user_id, record_type, title, created_at
    FROM public.permanent_archive
   WHERE source_tag = 'AI_INFERRED'
     AND confirmed_by_owner_at IS NULL
     AND created_at < now() - interval '90 days'
     AND auto_suppressed = false
     AND status = 'active';
