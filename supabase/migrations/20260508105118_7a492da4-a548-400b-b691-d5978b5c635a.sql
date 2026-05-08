
-- email_preferences
CREATE TABLE public.email_preferences (
  user_id UUID PRIMARY KEY,
  onboarding_emails BOOLEAN NOT NULL DEFAULT true,
  pulse_emails BOOLEAN NOT NULL DEFAULT true,
  referral_emails BOOLEAN NOT NULL DEFAULT true,
  handover_emails BOOLEAN NOT NULL DEFAULT true,
  reengagement_emails BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_all BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reengagement_45_sent_at TIMESTAMPTZ,
  reengagement_60_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email prefs"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own email prefs"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER tr_email_prefs_updated
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- email_queue
CREATE TYPE public.email_queue_status AS ENUM ('pending','sent','failed','skipped','cancelled');
CREATE TYPE public.email_sequence_type AS ENUM ('onboarding','pulse','reengagement','referral','handover');

CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  sequence_type public.email_sequence_type NOT NULL,
  sequence_step INTEGER NOT NULL DEFAULT 0,
  template_name TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  property_id UUID,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status public.email_queue_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_queue_due ON public.email_queue (status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_user ON public.email_queue (user_id);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own queued emails"
  ON public.email_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER tr_email_queue_updated
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create preferences and schedule onboarding sequence on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_email_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _now TIMESTAMPTZ := now();
  _user_role TEXT;
BEGIN
  _email := COALESCE(NEW.email, '');
  IF _email = '' THEN RETURN NEW; END IF;

  INSERT INTO public.email_preferences (user_id, last_seen_at)
  VALUES (NEW.id, _now)
  ON CONFLICT (user_id) DO NOTHING;

  _user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'homeowner');

  -- Only schedule the homeowner onboarding sequence for homeowners
  IF _user_role = 'homeowner' THEN
    INSERT INTO public.email_queue (user_id, email, sequence_type, sequence_step, template_name, scheduled_for, idempotency_key) VALUES
      (NEW.id, _email, 'onboarding', 1,  'onboarding-day-1',  _now + interval '5 minutes', 'onb-1-'  || NEW.id::text),
      (NEW.id, _email, 'onboarding', 2,  'onboarding-day-2',  _now + interval '1 day',     'onb-2-'  || NEW.id::text),
      (NEW.id, _email, 'onboarding', 3,  'onboarding-day-3',  _now + interval '2 days',    'onb-3-'  || NEW.id::text),
      (NEW.id, _email, 'onboarding', 7,  'onboarding-day-7',  _now + interval '6 days',    'onb-7-'  || NEW.id::text),
      (NEW.id, _email, 'onboarding', 14, 'onboarding-day-14', _now + interval '13 days',   'onb-14-' || NEW.id::text),
      (NEW.id, _email, 'onboarding', 30, 'onboarding-day-30', _now + interval '29 days',   'onb-30-' || NEW.id::text),
      (NEW.id, _email, 'onboarding', 60, 'onboarding-day-60', _now + interval '59 days',   'onb-60-' || NEW.id::text)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_email_setup ON auth.users;
CREATE TRIGGER on_auth_user_created_email_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_email_setup();

-- Backfill preferences for existing users
INSERT INTO public.email_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
