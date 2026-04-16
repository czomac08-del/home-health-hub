
-- State disclosure requirements (reference data, read-only for users)
CREATE TABLE public.state_disclosure_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  trigger_category text NOT NULL,
  requirement_text text NOT NULL,
  legal_citation text,
  applies_to_sales boolean NOT NULL DEFAULT true,
  penalty_for_nondisclosure text,
  is_federal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.state_disclosure_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view disclosure requirements"
  ON public.state_disclosure_requirements FOR SELECT
  TO authenticated USING (true);

-- Disclosure awareness log per property
CREATE TABLE public.disclosure_awareness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  trigger_category text NOT NULL,
  state text NOT NULL,
  flagged_data_summary text,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disclosure_awareness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disclosure awareness"
  ON public.disclosure_awareness FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own disclosure awareness"
  ON public.disclosure_awareness FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disclosure awareness"
  ON public.disclosure_awareness FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own disclosure awareness"
  ON public.disclosure_awareness FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_disclosure_awareness_updated_at
  BEFORE UPDATE ON public.disclosure_awareness
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Legal acknowledgments tracking
CREATE TABLE public.legal_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  terms_accepted boolean NOT NULL DEFAULT false,
  privacy_accepted boolean NOT NULL DEFAULT false,
  professional_disclaimer_accepted boolean NOT NULL DEFAULT false,
  age_confirmed boolean NOT NULL DEFAULT false,
  civic_consent boolean DEFAULT false,
  state_selected text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own legal acknowledgments"
  ON public.legal_acknowledgments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own legal acknowledgments"
  ON public.legal_acknowledgments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own legal acknowledgments"
  ON public.legal_acknowledgments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
