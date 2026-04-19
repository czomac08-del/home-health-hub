
-- Add columns to state_disclosure_requirements for nationwide legal framework
ALTER TABLE public.state_disclosure_requirements
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS jurisdiction_type TEXT NOT NULL DEFAULT 'state',
  ADD COLUMN IF NOT EXISTS public_records_law_name TEXT,
  ADD COLUMN IF NOT EXISTS public_records_law_citation TEXT,
  ADD COLUMN IF NOT EXISTS response_timeframe_days INTEGER,
  ADD COLUMN IF NOT EXISTS response_timeframe_unit TEXT DEFAULT 'business_days',
  ADD COLUMN IF NOT EXISTS oversight_body_name TEXT,
  ADD COLUMN IF NOT EXISTS oversight_body_url TEXT,
  ADD COLUMN IF NOT EXISTS has_online_portal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_portal_url TEXT,
  ADD COLUMN IF NOT EXISTS legal_escalation_path JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS professional_retention_rules JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_sdr_state_country ON public.state_disclosure_requirements(state, country);
CREATE INDEX IF NOT EXISTS idx_sdr_trigger ON public.state_disclosure_requirements(trigger_category);

-- Professional license boards table
CREATE TABLE IF NOT EXISTS public.professional_license_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL DEFAULT 'US',
  state TEXT,
  profession_type TEXT NOT NULL,
  board_name TEXT NOT NULL,
  board_url TEXT,
  board_phone TEXT,
  retention_years_required INTEGER,
  dissolved_licensee_process TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_license_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view license boards" ON public.professional_license_boards;
CREATE POLICY "Authenticated users can view license boards"
  ON public.professional_license_boards FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_plb_state_profession ON public.professional_license_boards(state, profession_type);
