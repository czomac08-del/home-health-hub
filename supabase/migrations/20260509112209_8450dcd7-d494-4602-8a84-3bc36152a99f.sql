UPDATE public.warranties w
SET property_id = sd.property_id
FROM public.system_details sd
WHERE w.system_detail_id = sd.id
  AND sd.property_id IS NOT NULL
  AND sd.property_id::text <> ''
  AND w.property_id IS DISTINCT FROM sd.property_id;

UPDATE public.warranties w
SET property_id = pr.property_id
FROM public.property_records pr
WHERE w.source_record_id = pr.id
  AND pr.property_id IS NOT NULL
  AND w.property_id IS DISTINCT FROM pr.property_id;