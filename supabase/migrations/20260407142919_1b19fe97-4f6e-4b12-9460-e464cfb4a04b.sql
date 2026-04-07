
-- Fix 1: Remove the public INSERT policy on user_roles to prevent privilege escalation
-- Role assignment is handled server-side by the handle_new_user trigger
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Fix 2: Make system-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'system-photos';

-- Remove the overly permissive public SELECT policy on system-photos
DROP POLICY IF EXISTS "System photos are public" ON storage.objects;

-- Add owner-scoped storage policies for system-photos
CREATE POLICY "Owner can view own system photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'system-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can upload system photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'system-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can delete system photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'system-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
