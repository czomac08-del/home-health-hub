
CREATE TABLE public.household_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  people_count integer DEFAULT 2,
  bedrooms integer DEFAULT 3,
  guest_frequency text DEFAULT 'rarely',
  work_from_home text DEFAULT 'no',
  pets jsonb DEFAULT '[]'::jsonb,
  health_factors text[] DEFAULT '{}',
  activity_level text DEFAULT 'moderate',
  cooking_frequency text DEFAULT 'few_times_week',
  dusty_hobbies boolean DEFAULT false,
  smart_integrations jsonb DEFAULT '{}'::jsonb,
  recommended_filter_merv integer,
  recommended_filter_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.household_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household profiles" ON public.household_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own household profiles" ON public.household_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own household profiles" ON public.household_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own household profiles" ON public.household_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_household_profiles_updated_at
  BEFORE UPDATE ON public.household_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
