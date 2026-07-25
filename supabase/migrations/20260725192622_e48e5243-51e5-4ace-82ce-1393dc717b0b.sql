
UPDATE public.system_details
SET specs = jsonb_set(
  (specs - 'tankSize'),
  '{tankCapacityGallons}',
  specs->'tankSize',
  true
)
WHERE (LOWER(system_name) LIKE '%septic%' OR LOWER(system_name) LIKE '%sewer%' OR LOWER(system_name) LIKE '%waste%')
  AND specs ? 'tankSize'
  AND NOT (specs ? 'tankCapacityGallons');

UPDATE public.system_details
SET specs = specs - 'tankSize'
WHERE (LOWER(system_name) LIKE '%septic%' OR LOWER(system_name) LIKE '%sewer%' OR LOWER(system_name) LIKE '%waste%')
  AND specs ? 'tankSize'
  AND specs ? 'tankCapacityGallons';

UPDATE public.system_details
SET specs = jsonb_set(
  (specs - 'tankMaterial'),
  '{tankType}',
  specs->'tankMaterial',
  true
)
WHERE (LOWER(system_name) LIKE '%septic%' OR LOWER(system_name) LIKE '%sewer%' OR LOWER(system_name) LIKE '%waste%')
  AND specs ? 'tankMaterial'
  AND NOT (specs ? 'tankType');

UPDATE public.system_details
SET specs = specs - 'tankMaterial'
WHERE (LOWER(system_name) LIKE '%septic%' OR LOWER(system_name) LIKE '%sewer%' OR LOWER(system_name) LIKE '%waste%')
  AND specs ? 'tankMaterial'
  AND specs ? 'tankType';
