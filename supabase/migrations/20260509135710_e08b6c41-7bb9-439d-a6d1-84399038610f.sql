ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS parcel_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS assessor_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS rentcast_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS legal_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS subdivision TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON public.properties(parcel_id) WHERE parcel_id IS NOT NULL;

COMMENT ON COLUMN public.properties.parcel_id IS 'County Assessor Parcel Number (APN) — used for county permit/tax lookups';
COMMENT ON COLUMN public.properties.assessor_id IS 'RentCast assessorID field — county assessor identifier';
COMMENT ON COLUMN public.properties.rentcast_id IS 'RentCast internal property ID for future API lookups';