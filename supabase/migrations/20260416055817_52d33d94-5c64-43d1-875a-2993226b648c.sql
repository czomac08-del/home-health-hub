CREATE TABLE public.legal_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  issue_type text NOT NULL,
  attorney_type text NOT NULL,
  referral_service_name text NOT NULL,
  referral_url text,
  referral_phone text,
  legal_aid_name text,
  legal_aid_url text,
  legal_aid_phone text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view legal resources"
  ON public.legal_resources FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_legal_resources_state ON public.legal_resources(state);
CREATE INDEX idx_legal_resources_issue ON public.legal_resources(issue_type);