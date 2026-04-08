
-- Add investor to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'investor';

-- Create flip_projects table
CREATE TABLE public.flip_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_address text NOT NULL,
  status text NOT NULL DEFAULT 'acquisition',
  purchase_price numeric,
  renovation_budget numeric,
  current_spend numeric DEFAULT 0,
  projected_arv numeric,
  purchase_date timestamp with time zone,
  target_flip_date timestamp with time zone,
  completion_pct integer DEFAULT 0,
  budget_categories jsonb DEFAULT '{}',
  carrying_costs jsonb DEFAULT '{}',
  photo_url text,
  notes text,
  sold_price numeric,
  sold_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.flip_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flip projects" ON public.flip_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flip projects" ON public.flip_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flip projects" ON public.flip_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flip projects" ON public.flip_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create flip_contractors table
CREATE TABLE public.flip_contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.flip_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  license_number text,
  specialty text,
  contract_amount numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  completion_pct integer DEFAULT 0,
  quality_rating integer,
  lien_waiver_received boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.flip_contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flip contractors" ON public.flip_contractors FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flip contractors" ON public.flip_contractors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flip contractors" ON public.flip_contractors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flip contractors" ON public.flip_contractors FOR DELETE TO authenticated USING (auth.uid() = user_id);
