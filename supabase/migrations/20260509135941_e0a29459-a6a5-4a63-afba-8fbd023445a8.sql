ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS parcel_id        TEXT NULL,
  ADD COLUMN IF NOT EXISTS assessor_id      TEXT NULL,
  ADD COLUMN IF NOT EXISTS rentcast_id      TEXT NULL,
  ADD COLUMN IF NOT EXISTS legal_description TEXT NULL,
  ADD COLUMN IF NOT EXISTS subdivision      TEXT NULL,
  ADD COLUMN IF NOT EXISTS bedrooms         INTEGER NULL,
  ADD COLUMN IF NOT EXISTS bathrooms        NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS lot_size         NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS last_sale_date   DATE NULL,
  ADD COLUMN IF NOT EXISTS last_sale_price  NUMERIC NULL;

CREATE INDEX IF NOT EXISTS idx_properties_parcel_id
  ON public.properties(parcel_id) WHERE parcel_id IS NOT NULL;

COMMENT ON COLUMN public.properties.parcel_id IS
  'County Assessor Parcel Number (APN) — primary key for county permit/tax lookups';