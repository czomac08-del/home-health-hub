
-- Lightweight admin gate (avoids needing new enum value in same migration)
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view admin list"
ON public.admin_users FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id)
$$;

CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  referrer_type TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_amount_cents INTEGER,
  reward_description TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  stripe_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referral_id, trigger_event)
);

CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);
CREATE INDEX idx_referral_rewards_referrer ON public.referral_rewards(referrer_user_id);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers view own rewards"
ON public.referral_rewards FOR SELECT
TO authenticated
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Admins view all rewards"
ON public.referral_rewards FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update rewards"
ON public.referral_rewards FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_referral_rewards_updated_at
BEFORE UPDATE ON public.referral_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
