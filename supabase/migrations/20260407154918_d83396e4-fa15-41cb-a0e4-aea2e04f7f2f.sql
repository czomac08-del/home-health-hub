
-- Create profile type enum (if not exists)
DO $$ BEGIN CREATE TYPE public.profile_type AS ENUM ('personal', 'business'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create app_profiles table
CREATE TABLE IF NOT EXISTS public.app_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_name text NOT NULL DEFAULT 'Personal',
  profile_type public.profile_type NOT NULL DEFAULT 'personal'::public.profile_type,
  business_name text,
  separate_expenses boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_profiles' AND policyname = 'Users can view own app_profiles') THEN
    CREATE POLICY "Users can view own app_profiles" ON public.app_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_profiles' AND policyname = 'Users can insert own app_profiles') THEN
    CREATE POLICY "Users can insert own app_profiles" ON public.app_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_profiles' AND policyname = 'Users can update own app_profiles') THEN
    CREATE POLICY "Users can update own app_profiles" ON public.app_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_profiles' AND policyname = 'Users can delete own app_profiles') THEN
    CREATE POLICY "Users can delete own app_profiles" ON public.app_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add profile_id to properties if not exists
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN profile_id uuid REFERENCES public.app_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill: create default personal profiles for existing users
INSERT INTO public.app_profiles (user_id, profile_name, profile_type)
SELECT DISTINCT user_id, 'Personal', 'personal'::public.profile_type FROM public.properties
WHERE user_id NOT IN (SELECT user_id FROM public.app_profiles);

-- Link existing properties to default personal profiles
UPDATE public.properties p
SET profile_id = ap.id
FROM public.app_profiles ap
WHERE p.user_id = ap.user_id AND ap.profile_type = 'personal'::public.profile_type AND p.profile_id IS NULL;

-- Trigger: auto-create personal profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.app_profiles (user_id, profile_name, profile_type)
  VALUES (NEW.id, 'Personal', 'personal'::public.profile_type);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
