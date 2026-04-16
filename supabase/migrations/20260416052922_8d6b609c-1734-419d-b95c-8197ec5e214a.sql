
-- Record Types taxonomy table
CREATE TABLE public.record_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  category_order integer NOT NULL DEFAULT 0,
  subcategory text NOT NULL,
  description text,
  icon_name text,
  safety_critical boolean NOT NULL DEFAULT false,
  typical_digitization_year integer,
  digitization_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.record_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view record types"
  ON public.record_types FOR SELECT
  TO authenticated
  USING (true);

-- Record Sources mapping table
CREATE TABLE public.record_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type_id uuid REFERENCES public.record_types(id) ON DELETE CASCADE NOT NULL,
  source_name text NOT NULL,
  source_type text NOT NULL DEFAULT 'government_agency',
  api_endpoint text,
  request_template text,
  contact_lookup_method text,
  typical_digitization_year integer,
  cost_to_obtain text NOT NULL DEFAULT 'free',
  typical_response_days integer DEFAULT 10,
  priority_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.record_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view record sources"
  ON public.record_sources FOR SELECT
  TO authenticated
  USING (true);

-- Property Timeline Events
CREATE TABLE public.property_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  event_date text NOT NULL,
  category text NOT NULL,
  icon_key text,
  title text NOT NULL,
  description text,
  source text,
  source_type text DEFAULT 'estimated',
  confidence text DEFAULT 'medium',
  record_type_id uuid REFERENCES public.record_types(id),
  property_record_id uuid REFERENCES public.property_records(id),
  is_estimated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline events"
  ON public.property_timeline_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timeline events"
  ON public.property_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline events"
  ON public.property_timeline_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline events"
  ON public.property_timeline_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON public.property_timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_record_types_category ON public.record_types(category);
CREATE INDEX idx_record_sources_type_id ON public.record_sources(record_type_id);
CREATE INDEX idx_timeline_events_property ON public.property_timeline_events(property_id);
CREATE INDEX idx_timeline_events_date ON public.property_timeline_events(event_date);
