-- One-time cleanup: clear any system_details fields that were marked as
-- ai_extracted but have no provable source (no linked inspection record / document).
-- Honest blank > confident wrong answer.
UPDATE public.system_details
SET
  brand = NULL,
  model = NULL,
  serial_number = NULL,
  install_date = NULL,
  purchase_date = NULL,
  warranty_exp = NULL,
  warranty_provider = NULL,
  last_service = NULL,
  next_service = NULL,
  service_company = NULL,
  service_phone = NULL,
  location_in_home = NULL,
  specs = '{}'::jsonb,
  data_status = 'unknown'::public.data_status,
  updated_at = now()
WHERE data_status = 'ai_extracted'::public.data_status
  AND NOT EXISTS (
    SELECT 1
    FROM public.field_sources fs
    WHERE fs.property_id = system_details.property_id
      AND fs.current_source IN ('inspector_verified', 'county_record', 'ai_extracted')
      AND fs.source_record_id IS NOT NULL
  );