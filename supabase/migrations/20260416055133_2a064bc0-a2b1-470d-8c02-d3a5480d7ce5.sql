-- Verification events table
CREATE TABLE public.verification_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_path text NOT NULL,
  field_value text,
  source_type text NOT NULL DEFAULT 'homeowner',
  source_priority integer NOT NULL DEFAULT 7,
  source_weight text NOT NULL DEFAULT 'medium',
  source_name text,
  result text NOT NULL DEFAULT 'pending',
  confidence_before integer DEFAULT 0,
  confidence_after integer DEFAULT 0,
  evidence_url text,
  evidence_notes text,
  ai_analysis text,
  verified_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification events"
  ON public.verification_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification events"
  ON public.verification_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own verification events"
  ON public.verification_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_verification_events_property ON public.verification_events(property_id);
CREATE INDEX idx_verification_events_field ON public.verification_events(field_path);

-- Permanent archive table
CREATE TABLE public.permanent_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  record_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  existed_from text,
  existed_until text,
  removal_reason text,
  evidence_sources jsonb DEFAULT '[]'::jsonb,
  satellite_images jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  ai_analysis text,
  homeowner_notes text,
  confidence_score integer NOT NULL DEFAULT 40,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.permanent_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archive"
  ON public.permanent_archive FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own archive"
  ON public.permanent_archive FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own archive"
  ON public.permanent_archive FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own archive"
  ON public.permanent_archive FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_permanent_archive_property ON public.permanent_archive(property_id);
CREATE INDEX idx_permanent_archive_status ON public.permanent_archive(status);

-- Trigger for updated_at
CREATE TRIGGER update_permanent_archive_updated_at
  BEFORE UPDATE ON public.permanent_archive
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();