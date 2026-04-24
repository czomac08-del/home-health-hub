-- User security preferences (2FA toggle)
CREATE TABLE public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own security settings"
  ON public.user_security_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own security settings"
  ON public.user_security_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own security settings"
  ON public.user_security_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trusted devices (skip 2FA for 30 days)
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_token TEXT NOT NULL,
  device_label TEXT,
  user_agent TEXT,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_token)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trusted devices"
  ON public.trusted_devices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trusted devices"
  ON public.trusted_devices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own trusted devices"
  ON public.trusted_devices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own trusted devices"
  ON public.trusted_devices FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_trusted_devices_user_token ON public.trusted_devices(user_id, device_token);
CREATE INDEX idx_trusted_devices_expires ON public.trusted_devices(expires_at);