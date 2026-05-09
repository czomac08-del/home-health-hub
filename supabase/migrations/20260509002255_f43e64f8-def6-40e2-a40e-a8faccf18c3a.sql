
-- Property shares for selling mode realtor handover
CREATE TABLE public.property_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  documents_included JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  revoked_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_property_shares_user ON public.property_shares(user_id);
CREATE INDEX idx_property_shares_property ON public.property_shares(property_id);
CREATE INDEX idx_property_shares_token ON public.property_shares(token);
CREATE INDEX idx_property_shares_recipient ON public.property_shares(recipient_email);

ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own shares" ON public.property_shares
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owner can create own shares" ON public.property_shares
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own shares" ON public.property_shares
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Recipient can view shares to their email" ON public.property_shares
  FOR SELECT TO authenticated USING (
    recipient_email IS NOT NULL
    AND lower(recipient_email) = lower((SELECT email FROM public.profiles WHERE user_id = auth.uid()))
    AND revoked_at IS NULL
    AND expires_at > now()
  );

-- Public token access via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_shared_property_package(_token UUID)
RETURNS TABLE(
  share_id UUID,
  property_id UUID,
  owner_name TEXT,
  property_address TEXT,
  property_year_built TEXT,
  property_health_score INTEGER,
  expires_at TIMESTAMPTZ,
  documents_included JSONB,
  message TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.property_id,
    p.full_name, prop.address, prop.year_built, prop.health_score,
    s.expires_at, s.documents_included, s.message
  FROM public.property_shares s
  JOIN public.properties prop ON prop.id = s.property_id
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE s.token = _token
    AND s.revoked_at IS NULL
    AND s.expires_at > now()
$$;

-- Document requests from realtor to homeowner
CREATE TABLE public.share_document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES public.property_shares(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homeowner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_sdr_homeowner ON public.share_document_requests(homeowner_user_id);
CREATE INDEX idx_sdr_requester ON public.share_document_requests(requested_by_user_id);

ALTER TABLE public.share_document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowner can view requests for own property" ON public.share_document_requests
  FOR SELECT TO authenticated USING (auth.uid() = homeowner_user_id);

CREATE POLICY "Requester can view their own requests" ON public.share_document_requests
  FOR SELECT TO authenticated USING (auth.uid() = requested_by_user_id);

CREATE POLICY "Requester can create requests" ON public.share_document_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by_user_id);

CREATE POLICY "Homeowner can update own requests" ON public.share_document_requests
  FOR UPDATE TO authenticated USING (auth.uid() = homeowner_user_id);

CREATE TRIGGER update_property_shares_updated_at
  BEFORE UPDATE ON public.property_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
