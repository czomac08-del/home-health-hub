ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_additional_structures boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS additional_structures_banner_dismissed_at timestamptz;