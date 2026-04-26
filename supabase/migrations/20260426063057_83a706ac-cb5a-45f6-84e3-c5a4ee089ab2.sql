ALTER TABLE public.inspection_findings
  ADD COLUMN IF NOT EXISTS page_reference integer;

CREATE INDEX IF NOT EXISTS idx_inspection_findings_record_page
  ON public.inspection_findings (inspection_record_id, page_reference);