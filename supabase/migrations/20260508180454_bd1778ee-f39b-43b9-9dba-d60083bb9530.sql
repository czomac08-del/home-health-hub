ALTER TABLE public.system_photos
  ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_analysis_result JSONB,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_system_photos_ai_analyzed
  ON public.system_photos (system_detail_id, ai_analyzed);

ALTER TABLE public.system_details
  ADD COLUMN IF NOT EXISTS source_tags JSONB NOT NULL DEFAULT '{}'::jsonb;