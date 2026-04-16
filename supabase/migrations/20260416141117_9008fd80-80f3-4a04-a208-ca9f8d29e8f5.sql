
CREATE TABLE public.refresh_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  refresh_scope TEXT NOT NULL DEFAULT 'full',
  sources_queried TEXT[] NOT NULL DEFAULT '{}',
  updates_found INTEGER NOT NULL DEFAULT 0,
  results_summary JSONB NOT NULL DEFAULT '{}',
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refresh_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own refresh logs"
  ON public.refresh_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own refresh logs"
  ON public.refresh_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own refresh logs"
  ON public.refresh_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_refresh_logs_property ON public.refresh_logs(property_id, created_at DESC);
CREATE INDEX idx_refresh_logs_user ON public.refresh_logs(user_id);
