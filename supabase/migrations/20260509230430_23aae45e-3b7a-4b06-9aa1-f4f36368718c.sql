-- Phase 2: Pro dashboard document attachments
CREATE TABLE IF NOT EXISTS public.record_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID,
  parent_table TEXT NOT NULL,
  parent_id UUID NOT NULL,
  document_record_id UUID,
  file_name TEXT,
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'property-records',
  doc_type TEXT,
  notes TEXT,
  shared_with_homeowner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_record_attachments_parent
  ON public.record_attachments (parent_table, parent_id);
CREATE INDEX IF NOT EXISTS idx_record_attachments_user
  ON public.record_attachments (user_id);
CREATE INDEX IF NOT EXISTS idx_record_attachments_property
  ON public.record_attachments (property_id);
CREATE INDEX IF NOT EXISTS idx_record_attachments_document
  ON public.record_attachments (document_record_id);

ALTER TABLE public.record_attachments ENABLE ROW LEVEL SECURITY;

-- Creators (pros) can fully manage their own attachments
CREATE POLICY "Users manage own record attachments"
  ON public.record_attachments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Property owners can view attachments tied to their property
CREATE POLICY "Property owners view attachments to their property"
  ON public.record_attachments
  FOR SELECT
  TO authenticated
  USING (
    property_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = record_attachments.property_id
        AND p.user_id = auth.uid()
    )
  );

-- Auto-update updated_at on changes
DROP TRIGGER IF EXISTS trg_record_attachments_updated_at ON public.record_attachments;
CREATE TRIGGER trg_record_attachments_updated_at
  BEFORE UPDATE ON public.record_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();