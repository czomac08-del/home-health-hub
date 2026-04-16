
-- Add well_type to system_details
ALTER TABLE public.system_details ADD COLUMN IF NOT EXISTS well_type text;

-- Create drought_cache table for caching USDA drought data
CREATE TABLE public.drought_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fips_code text NOT NULL UNIQUE,
  drought_level text NOT NULL DEFAULT 'None',
  drought_description text NOT NULL DEFAULT 'No drought',
  raw_data jsonb DEFAULT '{}'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.drought_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for drought cache (public data)
CREATE POLICY "Anyone can read drought cache"
ON public.drought_cache FOR SELECT
USING (true);

-- Service role writes handled by edge function (no user insert/update policy needed)

-- Create water_quality_tests table
CREATE TABLE public.water_quality_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  user_id uuid NOT NULL,
  test_date date NOT NULL,
  test_type text NOT NULL,
  result text NOT NULL DEFAULT 'pending',
  result_values jsonb DEFAULT '{}'::jsonb,
  lab_name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.water_quality_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water quality tests"
ON public.water_quality_tests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water quality tests"
ON public.water_quality_tests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water quality tests"
ON public.water_quality_tests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water quality tests"
ON public.water_quality_tests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Timestamp trigger for water_quality_tests
CREATE TRIGGER update_water_quality_tests_updated_at
BEFORE UPDATE ON public.water_quality_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Timestamp trigger for drought_cache
CREATE TRIGGER update_drought_cache_updated_at
BEFORE UPDATE ON public.drought_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
