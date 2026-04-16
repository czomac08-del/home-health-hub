
-- Add consent and AI extraction fields to property_records
ALTER TABLE public.property_records
  ADD COLUMN IF NOT EXISTS consent_civic_sharing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_extracted_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_verified boolean NOT NULL DEFAULT false;

-- County agencies contact database
CREATE TABLE public.county_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_fips text NOT NULL,
  county_name text NOT NULL,
  state text NOT NULL DEFAULT 'NC',
  agency_type text NOT NULL DEFAULT 'environmental_health',
  agency_name text NOT NULL,
  email text,
  phone text,
  mailing_address text,
  records_portal_url text,
  accepts_email_requests boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_county_agencies_fips ON public.county_agencies(county_fips);
CREATE INDEX idx_county_agencies_state ON public.county_agencies(state);
ALTER TABLE public.county_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view county agencies" ON public.county_agencies FOR SELECT TO authenticated USING (true);

-- Records requests
CREATE TABLE public.records_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  county_fips text NOT NULL,
  agency_type text NOT NULL,
  system_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz DEFAULT now(),
  response_due_date timestamptz,
  response_received_at timestamptz,
  request_letter_text text,
  notes text,
  is_part_of_community_request boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.records_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own records requests" ON public.records_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own records requests" ON public.records_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records requests" ON public.records_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Community requests aggregation
CREATE TABLE public.community_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_fips text NOT NULL,
  county_name text NOT NULL,
  state text NOT NULL,
  system_type text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  last_consolidated_at timestamptz,
  consolidated_letter_sent boolean DEFAULT false,
  escalated_to_state boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(county_fips, system_type)
);
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view community requests" ON public.community_requests FOR SELECT TO authenticated USING (true);

-- Civic contributions tracking
CREATE TABLE public.civic_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_record_id uuid NOT NULL REFERENCES public.property_records(id) ON DELETE CASCADE,
  county_fips text NOT NULL,
  user_id uuid NOT NULL,
  shared_at timestamptz NOT NULL DEFAULT now(),
  report_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.civic_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contributions" ON public.civic_contributions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contributions" ON public.civic_contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_county_agencies_updated_at BEFORE UPDATE ON public.county_agencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_records_requests_updated_at BEFORE UPDATE ON public.records_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_community_requests_updated_at BEFORE UPDATE ON public.community_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
