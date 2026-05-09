CREATE TABLE IF NOT EXISTS public.system_pending_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  system_name text NOT NULL,
  field_path text NOT NULL,
  value_a text,
  source_a text,
  value_b text,
  source_b text,
  resolved_at timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_pending_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_spv_property ON public.system_pending_verifications(property_id, system_name);
CREATE INDEX IF NOT EXISTS idx_spv_unresolved ON public.system_pending_verifications(property_id) WHERE resolved_at IS NULL;

CREATE POLICY "Owners read pending verifications"
  ON public.system_pending_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert pending verifications"
  ON public.system_pending_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update pending verifications"
  ON public.system_pending_verifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners delete pending verifications"
  ON public.system_pending_verifications FOR DELETE
  USING (auth.uid() = user_id);