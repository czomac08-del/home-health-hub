
ALTER TABLE public.inspection_findings DROP CONSTRAINT IF EXISTS inspection_findings_status_check;
ALTER TABLE public.inspection_findings
  ADD CONSTRAINT inspection_findings_status_check
  CHECK (status IN ('open','fixed','skipped','in_progress','resolved','dismissed','monitoring'));

ALTER TABLE public.inspection_findings
  ADD COLUMN IF NOT EXISTS severity_label TEXT,
  ADD COLUMN IF NOT EXISTS system_category TEXT,
  ADD COLUMN IF NOT EXISTS location_in_home TEXT,
  ADD COLUMN IF NOT EXISTS inspector_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS resolved_by TEXT,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolution_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS contractor_name TEXT,
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS source_document_id UUID,
  ADD COLUMN IF NOT EXISTS in_progress_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_findings_severity_label ON public.inspection_findings(severity_label);
CREATE INDEX IF NOT EXISTS idx_findings_source_document ON public.inspection_findings(source_document_id);
