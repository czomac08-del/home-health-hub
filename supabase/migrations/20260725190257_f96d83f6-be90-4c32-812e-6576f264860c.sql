
-- Tighten address_refresh_cache: only service role reads (edge functions).
DROP POLICY IF EXISTS "Authenticated read cache" ON public.address_refresh_cache;

-- Tighten email_queue: users don't need direct read access; edge functions use service role.
DROP POLICY IF EXISTS "Users view own queued emails" ON public.email_queue;

-- Add UPDATE and DELETE policies for property owners on contractor-submissions bucket.
CREATE POLICY "Owners can update their contractor submission files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contractor-submissions'
  AND EXISTS (
    SELECT 1 FROM public.property_shares ps
    JOIN public.properties p ON p.id = ps.property_id
    WHERE ps.token::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'contractor-submissions'
  AND EXISTS (
    SELECT 1 FROM public.property_shares ps
    JOIN public.properties p ON p.id = ps.property_id
    WHERE ps.token::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their contractor submission files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-submissions'
  AND EXISTS (
    SELECT 1 FROM public.property_shares ps
    JOIN public.properties p ON p.id = ps.property_id
    WHERE ps.token::text = (storage.foldername(storage.objects.name))[1]
      AND p.user_id = auth.uid()
  )
);
