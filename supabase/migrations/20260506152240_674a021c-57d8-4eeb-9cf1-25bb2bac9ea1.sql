-- Email signups table for marketing email capture
CREATE TABLE public.email_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'homepage',
  subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prevent duplicate signups for same email+source
CREATE UNIQUE INDEX email_signups_email_source_idx
  ON public.email_signups (lower(email), source);

ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an email signup (public marketing form)
CREATE POLICY "Anyone can sign up for emails"
  ON public.email_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- Only admins can read signups
CREATE POLICY "Admins can view email signups"
  ON public.email_signups
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Only admins can update (e.g. mark unsubscribed)
CREATE POLICY "Admins can update email signups"
  ON public.email_signups
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Only admins can delete
CREATE POLICY "Admins can delete email signups"
  ON public.email_signups
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));