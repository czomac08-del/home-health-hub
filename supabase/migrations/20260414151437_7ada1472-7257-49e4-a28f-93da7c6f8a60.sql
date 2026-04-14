
-- Insurance policies table
CREATE TABLE public.insurance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL DEFAULT 'primary',
  insurance_company TEXT,
  policy_number TEXT,
  coverage_start DATE,
  coverage_end DATE,
  premium_amount NUMERIC,
  premium_frequency TEXT DEFAULT 'annual',
  agent_name TEXT,
  agent_phone TEXT,
  claims_phone TEXT,
  online_portal_url TEXT,
  dwelling_coverage NUMERIC,
  personal_property_coverage NUMERIC,
  liability_coverage NUMERIC,
  deductible_amount NUMERIC,
  wind_hail_deductible TEXT,
  flood_coverage BOOLEAN DEFAULT false,
  earthquake_coverage BOOLEAN DEFAULT false,
  equipment_breakdown BOOLEAN DEFAULT false,
  exclusions TEXT[],
  coverage_gaps TEXT[],
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insurance documents table
CREATE TABLE public.insurance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'policy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insurance claims table
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  claim_type TEXT NOT NULL,
  amount_claimed NUMERIC,
  amount_paid NUMERIC,
  claim_number TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance policies" ON public.insurance_policies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance policies" ON public.insurance_policies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insurance policies" ON public.insurance_policies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insurance policies" ON public.insurance_policies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insurance documents" ON public.insurance_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance documents" ON public.insurance_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own insurance documents" ON public.insurance_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insurance claims" ON public.insurance_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance claims" ON public.insurance_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insurance claims" ON public.insurance_claims FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insurance claims" ON public.insurance_claims FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for insurance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('insurance-documents', 'insurance-documents', false);

CREATE POLICY "Users can upload insurance docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'insurance-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own insurance docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'insurance-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own insurance docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'insurance-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
