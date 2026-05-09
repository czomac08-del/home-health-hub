UPDATE public.warranties w
SET property_id = sd.property_id
FROM public.system_details sd
WHERE w.system_detail_id = sd.id
  AND (w.property_id IS NULL OR w.property_id::text = '')
  AND sd.property_id IS NOT NULL;