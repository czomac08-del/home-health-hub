ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_active_property_id ON public.profiles(active_property_id);