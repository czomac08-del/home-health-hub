
-- Realtor listings table
CREATE TABLE public.realtor_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_address text NOT NULL,
  list_price text,
  days_on_market integer DEFAULT 0,
  passport_status text NOT NULL DEFAULT 'not_started',
  homeowner_email text,
  request_status text,
  health_score integer,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.realtor_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own listings" ON public.realtor_listings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own listings" ON public.realtor_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON public.realtor_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON public.realtor_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Inspections table
CREATE TABLE public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_address text NOT NULL,
  client_name text,
  inspection_date timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  overall_score integer,
  findings jsonb DEFAULT '[]'::jsonb,
  checklist_data jsonb DEFAULT '{}'::jsonb,
  notes_data jsonb DEFAULT '{}'::jsonb,
  has_passport boolean DEFAULT false,
  report_generated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inspections" ON public.inspections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inspections" ON public.inspections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inspections" ON public.inspections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inspections" ON public.inspections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contractor jobs table
CREATE TABLE public.contractor_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homeowner_name text NOT NULL,
  property_address text NOT NULL,
  system_type text NOT NULL,
  issue_description text,
  scheduled_date timestamptz,
  scheduled_time text,
  status text NOT NULL DEFAULT 'scheduled',
  work_performed text,
  parts_replaced text,
  part_models text,
  labor_hours text,
  next_service_rec text,
  invoice_amount text,
  quote_description text,
  quote_amount text,
  quote_notes text,
  quote_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.contractor_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON public.contractor_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.contractor_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON public.contractor_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages table for inter-user communication
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add update triggers
CREATE TRIGGER update_realtor_listings_updated_at BEFORE UPDATE ON public.realtor_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_jobs_updated_at BEFORE UPDATE ON public.contractor_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
