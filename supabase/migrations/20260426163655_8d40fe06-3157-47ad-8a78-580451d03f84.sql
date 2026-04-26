-- Add saved-card column for Deal-Funded plan
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text;

-- Partner applications captured from public /partners page
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  platform text,
  audience_size text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a partner application" ON public.partner_applications;
CREATE POLICY "Anyone can submit a partner application"
  ON public.partner_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(coalesce(name, '')) BETWEEN 1 AND 200
    AND length(coalesce(email, '')) BETWEEN 3 AND 320
    AND length(coalesce(message, '')) <= 4000
  );

DROP POLICY IF EXISTS "Admins read partner applications" ON public.partner_applications;
CREATE POLICY "Admins read partner applications"
  ON public.partner_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update partner applications" ON public.partner_applications;
CREATE POLICY "Admins update partner applications"
  ON public.partner_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed special promo / partner codes (idempotent)
INSERT INTO public.affiliate_partners (name, code, rev_share_pct, status, contact_email)
VALUES
  ('Pace Morby — SubTo Community', 'SUBTO', 25.00, 'active', 'partnerships@cominghomeiq.com'),
  ('Codie Sanchez — Contrarian Thinking', 'CONTRARIAN', 25.00, 'active', 'partnerships@cominghomeiq.com')
ON CONFLICT (code) DO NOTHING;