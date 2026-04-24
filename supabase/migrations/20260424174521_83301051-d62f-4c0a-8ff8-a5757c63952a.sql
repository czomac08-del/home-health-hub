-- =====================================================================
-- REFERRAL PROGRAM — Phase 1 schema
-- =====================================================================

-- Referral codes: one per user
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  referrer_type TEXT NOT NULL DEFAULT 'homeowner' CHECK (referrer_type IN ('homeowner','contractor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone (anon + authenticated) can look up a code on the landing page to validate it
CREATE POLICY "Anyone can validate a code by value"
  ON public.referral_codes FOR SELECT
  TO anon
  USING (true);

CREATE TRIGGER trg_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);

-- =====================================================================
-- Referrals: one per referred signup
-- =====================================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  referrer_type TEXT NOT NULL DEFAULT 'homeowner' CHECK (referrer_type IN ('homeowner','contractor')),
  referral_code TEXT NOT NULL,
  signup_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_to_paid BOOLEAN NOT NULL DEFAULT false,
  conversion_date TIMESTAMPTZ,
  reward_issued BOOLEAN NOT NULL DEFAULT false,
  reward_type TEXT,
  reward_amount_cents INTEGER,
  retained_3_months BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see all referrals they made (powers the dashboard)
CREATE POLICY "Referrers can view their referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id);

-- Referred user can see their own row (to know who referred them)
CREATE POLICY "Referred users can view own referral"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);

-- Insert: only the referred user can create their own attribution row at signup
CREATE POLICY "Referred user can insert own attribution"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_user_id);

-- NOTE: No UPDATE / DELETE policies for authenticated users.
-- Conversion + reward updates happen server-side via the Stripe webhook (service role).

CREATE TRIGGER trg_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_converted ON public.referrals(converted_to_paid) WHERE converted_to_paid = true;

-- =====================================================================
-- Auto-generate a referral code for every new user
-- =====================================================================
-- Format:
--   homeowner  -> 8-char alphanumeric uppercase (e.g. "K7X2P9QW")
--   contractor -> {NAME}-PRO-{3 chars} (e.g. "MIKE-PRO-7X2")
-- =====================================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code(_user_id UUID, _referrer_type TEXT, _full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_code TEXT;
  candidate TEXT;
  attempts INT := 0;
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I confusion
  rand_part TEXT;
  i INT;
BEGIN
  IF _referrer_type = 'contractor' THEN
    -- Use first word of name (uppercased, alpha-only), fallback to PRO
    base_code := UPPER(REGEXP_REPLACE(SPLIT_PART(COALESCE(_full_name, ''), ' ', 1), '[^A-Za-z]', '', 'g'));
    IF base_code = '' OR LENGTH(base_code) < 2 THEN
      base_code := 'PRO';
    END IF;
    base_code := SUBSTRING(base_code, 1, 8);

    LOOP
      rand_part := '';
      FOR i IN 1..3 LOOP
        rand_part := rand_part || SUBSTRING(alphabet FROM (1 + FLOOR(RANDOM() * LENGTH(alphabet)))::INT FOR 1);
      END LOOP;
      candidate := base_code || '-PRO-' || rand_part;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = candidate);
      attempts := attempts + 1;
      IF attempts > 20 THEN
        candidate := base_code || '-PRO-' || rand_part || SUBSTRING(_user_id::TEXT, 1, 4);
        EXIT;
      END IF;
    END LOOP;
  ELSE
    LOOP
      candidate := '';
      FOR i IN 1..8 LOOP
        candidate := candidate || SUBSTRING(alphabet FROM (1 + FLOOR(RANDOM() * LENGTH(alphabet)))::INT FOR 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = candidate);
      attempts := attempts + 1;
      IF attempts > 20 THEN
        candidate := candidate || SUBSTRING(_user_id::TEXT, 1, 4);
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN candidate;
END;
$$;

-- Trigger on profile creation: generate the user's referral code
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  ref_type TEXT;
BEGIN
  user_role := COALESCE(NEW.role::TEXT, 'homeowner');
  user_name := COALESCE(NEW.full_name, '');
  ref_type := CASE WHEN user_role = 'contractor' THEN 'contractor' ELSE 'homeowner' END;

  INSERT INTO public.referral_codes (user_id, code, referrer_type)
  VALUES (
    NEW.user_id,
    public.generate_referral_code(NEW.user_id, ref_type, user_name),
    ref_type
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_create_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Backfill existing users
INSERT INTO public.referral_codes (user_id, code, referrer_type)
SELECT
  p.user_id,
  public.generate_referral_code(p.user_id, CASE WHEN p.role::TEXT = 'contractor' THEN 'contractor' ELSE 'homeowner' END, p.full_name),
  CASE WHEN p.role::TEXT = 'contractor' THEN 'contractor' ELSE 'homeowner' END
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.referral_codes rc WHERE rc.user_id = p.user_id);