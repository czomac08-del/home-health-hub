
CREATE TABLE public.certification_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certification_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares" ON public.certification_shares FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own shares" ON public.certification_shares FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own shares" ON public.certification_shares FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view by token" ON public.certification_shares FOR SELECT TO anon USING (true);
