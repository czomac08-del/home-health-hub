-- Add a flag column indicating year_built may be a range-boundary artifact
-- and needs the user to confirm a specific year.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS year_built_needs_confirmation boolean NOT NULL DEFAULT false;

-- Backfill: known correction for 556 Sunnyside (range 1970–1990 → confirmed 1988).
UPDATE public.properties
   SET year_built = '1988',
       year_built_needs_confirmation = false
 WHERE address ILIKE '%Sunnyside%';

-- Flag all other properties whose year_built looks like a decade boundary
-- (1700–2100, ends in 0). Do NOT change the value — only mark for confirmation.
UPDATE public.properties
   SET year_built_needs_confirmation = true
 WHERE year_built IS NOT NULL
   AND year_built ~ '^(17|18|19|20|21)[0-9]0$'
   AND address NOT ILIKE '%Sunnyside%';