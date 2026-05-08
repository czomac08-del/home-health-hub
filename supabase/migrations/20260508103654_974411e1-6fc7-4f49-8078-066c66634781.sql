
-- Expand allowed referrer types to all 5 roles
ALTER TABLE public.referral_codes DROP CONSTRAINT IF EXISTS referral_codes_referrer_type_check;
ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_referrer_type_check
  CHECK (referrer_type = ANY (ARRAY['homeowner','contractor','inspector','realtor','investor']));

ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_referrer_type_check;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referrer_type_check
  CHECK (referrer_type = ANY (ARRAY['homeowner','contractor','inspector','realtor','investor']));

-- Update trigger function so professional roles all get a `-PRO-` style code.
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  user_name TEXT;
  ref_type TEXT;
BEGIN
  user_role := COALESCE(NEW.role::TEXT, 'homeowner');
  user_name := COALESCE(NEW.full_name, '');

  IF user_role IN ('contractor','inspector','realtor','investor') THEN
    ref_type := user_role;
  ELSE
    ref_type := 'homeowner';
  END IF;

  INSERT INTO public.referral_codes (user_id, code, referrer_type)
  VALUES (
    NEW.user_id,
    public.generate_referral_code(NEW.user_id, ref_type, user_name),
    ref_type
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Update generate_referral_code so any pro role uses the -PRO- format
CREATE OR REPLACE FUNCTION public.generate_referral_code(_user_id uuid, _referrer_type text, _full_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_code TEXT;
  candidate TEXT;
  attempts INT := 0;
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  rand_part TEXT;
  i INT;
  is_pro BOOLEAN;
BEGIN
  is_pro := _referrer_type IN ('contractor','inspector','realtor','investor');

  IF is_pro THEN
    base_code := UPPER(REGEXP_REPLACE(SPLIT_PART(COALESCE(_full_name, ''), ' ', 1), '[^A-Za-z]', '', 'g'));
    IF base_code = '' OR LENGTH(base_code) < 2 THEN
      base_code := UPPER(SUBSTRING(_referrer_type FROM 1 FOR 3));
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
$function$;
