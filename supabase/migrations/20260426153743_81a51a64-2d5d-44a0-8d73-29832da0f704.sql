-- 1. data_status enum
DO $$ BEGIN
  CREATE TYPE public.data_status AS ENUM (
    'confirmed',
    'unknown',
    'ai_extracted',
    'inspector_verified',
    'county_record'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add data_status column to existing user-entered property tables
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS data_status public.data_status NOT NULL DEFAULT 'confirmed';
ALTER TABLE public.insurance_policies ADD COLUMN IF NOT EXISTS data_status public.data_status NOT NULL DEFAULT 'confirmed';
ALTER TABLE public.household_profiles ADD COLUMN IF NOT EXISTS data_status public.data_status NOT NULL DEFAULT 'confirmed';
ALTER TABLE public.home_checkup_items ADD COLUMN IF NOT EXISTS data_status public.data_status NOT NULL DEFAULT 'confirmed';
ALTER TABLE public.system_details ADD COLUMN IF NOT EXISTS data_status public.data_status NOT NULL DEFAULT 'confirmed';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_status public.data_status NOT NULL DEFAULT 'confirmed';

-- 3. needs_info queue
CREATE TABLE IF NOT EXISTS public.needs_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL,
  section TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT,
  prompt_shown_count INTEGER NOT NULL DEFAULT 0,
  last_prompted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT needs_info_property_field_unique UNIQUE (property_id, section, field_name)
);

CREATE INDEX IF NOT EXISTS needs_info_user_idx ON public.needs_info(user_id);
CREATE INDEX IF NOT EXISTS needs_info_property_idx ON public.needs_info(property_id);
CREATE INDEX IF NOT EXISTS needs_info_open_idx ON public.needs_info(property_id) WHERE resolved_at IS NULL;

ALTER TABLE public.needs_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own needs_info" ON public.needs_info;
CREATE POLICY "Users view own needs_info"
  ON public.needs_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own needs_info" ON public.needs_info;
CREATE POLICY "Users insert own needs_info"
  ON public.needs_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own needs_info" ON public.needs_info;
CREATE POLICY "Users update own needs_info"
  ON public.needs_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own needs_info" ON public.needs_info;
CREATE POLICY "Users delete own needs_info"
  ON public.needs_info FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_needs_info_updated_at ON public.needs_info;
CREATE TRIGGER update_needs_info_updated_at
  BEFORE UPDATE ON public.needs_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();