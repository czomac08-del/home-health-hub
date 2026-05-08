DROP POLICY IF EXISTS "Users can update own system details" ON public.system_details;
CREATE POLICY "Users can update own system details"
ON public.system_details
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own photos" ON public.system_photos;
CREATE POLICY "Users can update own photos"
ON public.system_photos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);