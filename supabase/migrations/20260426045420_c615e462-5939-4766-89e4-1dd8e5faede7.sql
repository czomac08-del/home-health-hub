
CREATE TABLE public.home_checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  current_section integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.home_checkup_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid NOT NULL REFERENCES public.home_checkups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  section_id text NOT NULL,
  item_id text NOT NULL,
  answer text NOT NULL,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(checkup_id, item_id)
);

CREATE INDEX idx_home_checkups_property ON public.home_checkups(property_id);
CREATE INDEX idx_home_checkup_items_checkup ON public.home_checkup_items(checkup_id);

ALTER TABLE public.home_checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_checkup_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkups" ON public.home_checkups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkups" ON public.home_checkups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checkups" ON public.home_checkups FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own checkups" ON public.home_checkups FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users view own checkup items" ON public.home_checkup_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkup items" ON public.home_checkup_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checkup items" ON public.home_checkup_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own checkup items" ON public.home_checkup_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER tr_home_checkups_updated BEFORE UPDATE ON public.home_checkups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_home_checkup_items_updated BEFORE UPDATE ON public.home_checkup_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
