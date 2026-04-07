
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category text NOT NULL,
  what_happened text NOT NULL DEFAULT '',
  improvement text NOT NULL DEFAULT '',
  page_route text NOT NULL DEFAULT '',
  user_role text NOT NULL DEFAULT 'homeowner',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
