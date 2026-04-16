
-- Create property_records table for permanent property-level record storage
CREATE TABLE public.property_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'other',
  document_date DATE,
  source TEXT NOT NULL DEFAULT 'other',
  file_name TEXT,
  storage_path TEXT,
  url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  uploaded_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_records ENABLE ROW LEVEL SECURITY;

-- Users can view records for properties they own
CREATE POLICY "Users can view records for own properties"
ON public.property_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_records.property_id
    AND properties.user_id = auth.uid()
  )
);

-- Users can insert records for their own properties
CREATE POLICY "Users can insert records for own properties"
ON public.property_records
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by_user_id
  AND EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_records.property_id
    AND properties.user_id = auth.uid()
  )
);

-- Users can update their own uploaded records
CREATE POLICY "Users can update own records"
ON public.property_records
FOR UPDATE
TO authenticated
USING (auth.uid() = uploaded_by_user_id);

-- Users can delete their own uploaded records
CREATE POLICY "Users can delete own records"
ON public.property_records
FOR DELETE
TO authenticated
USING (auth.uid() = uploaded_by_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_property_records_updated_at
BEFORE UPDATE ON public.property_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for property records
INSERT INTO storage.buckets (id, name, public) VALUES ('property-records', 'property-records', false);

-- Storage policies
CREATE POLICY "Users can upload property records"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own property records"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'property-records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own property records"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-records' AND auth.uid()::text = (storage.foldername(name))[1]);
