
-- Create warranties table
CREATE TABLE public.warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  system_detail_id UUID REFERENCES public.system_details(id) ON DELETE CASCADE,
  warranty_type TEXT NOT NULL DEFAULT 'manufacturer',
  provider_name TEXT,
  coverage_start DATE,
  coverage_end DATE,
  claim_phone TEXT,
  claim_website TEXT,
  claim_notes TEXT,
  document_path TEXT,
  document_url TEXT,
  extended_doc_path TEXT,
  extended_doc_url TEXT,
  is_transferable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warranties" ON public.warranties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own warranties" ON public.warranties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own warranties" ON public.warranties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own warranties" ON public.warranties FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_warranties_updated_at BEFORE UPDATE ON public.warranties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for warranty documents
INSERT INTO storage.buckets (id, name, public) VALUES ('warranty-documents', 'warranty-documents', false);

CREATE POLICY "Users can upload warranty docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'warranty-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own warranty docs" ON storage.objects FOR SELECT USING (bucket_id = 'warranty-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own warranty docs" ON storage.objects FOR DELETE USING (bucket_id = 'warranty-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
