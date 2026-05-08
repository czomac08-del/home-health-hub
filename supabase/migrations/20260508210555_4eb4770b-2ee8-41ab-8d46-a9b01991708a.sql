
-- Enum for structure types
DO $$ BEGIN
  CREATE TYPE public.structure_type AS ENUM (
    'main_house','addition','attached_garage','detached_garage','adu','workshop','pool_house','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- property_structures table
CREATE TABLE IF NOT EXISTS public.property_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  structure_type public.structure_type NOT NULL DEFAULT 'main_house',
  added_by_permit boolean NOT NULL DEFAULT false,
  permit_year integer,
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_structures_property ON public.property_structures(property_id);

ALTER TABLE public.property_structures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners view structures" ON public.property_structures;
CREATE POLICY "owners view structures" ON public.property_structures FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owners insert structures" ON public.property_structures;
CREATE POLICY "owners insert structures" ON public.property_structures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owners update structures" ON public.property_structures;
CREATE POLICY "owners update structures" ON public.property_structures FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owners delete structures" ON public.property_structures;
CREATE POLICY "owners delete structures" ON public.property_structures FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_property_structures_updated_at ON public.property_structures;
CREATE TRIGGER trg_property_structures_updated_at
  BEFORE UPDATE ON public.property_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: one Main House per existing property
INSERT INTO public.property_structures (property_id, name, structure_type, is_default)
SELECT p.id, 'Main House', 'main_house', true
FROM public.properties p
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_structures s WHERE s.property_id = p.id AND s.is_default = true
);

-- Auto-create Main House when a new property is created
CREATE OR REPLACE FUNCTION public.create_default_structure_for_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.property_structures (property_id, name, structure_type, is_default)
  VALUES (NEW.id, 'Main House', 'main_house', true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_properties_default_structure ON public.properties;
CREATE TRIGGER trg_properties_default_structure
  AFTER INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.create_default_structure_for_property();

-- Extend system_details
ALTER TABLE public.system_details
  ADD COLUMN IF NOT EXISTS instance_name text,
  ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.property_structures(id) ON DELETE SET NULL;

-- Backfill instance_name and zone_id for legacy rows
UPDATE public.system_details sd
SET instance_name = COALESCE(sd.instance_name, sd.system_name)
WHERE sd.instance_name IS NULL;

UPDATE public.system_details sd
SET zone_id = s.id
FROM public.property_structures s
WHERE sd.zone_id IS NULL
  AND s.property_id = sd.property_id
  AND s.is_default = true;

CREATE INDEX IF NOT EXISTS idx_system_details_zone ON public.system_details(zone_id);

-- Extend inspection_findings
ALTER TABLE public.inspection_findings
  ADD COLUMN IF NOT EXISTS system_instance_id uuid REFERENCES public.system_details(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inspection_findings_system_instance ON public.inspection_findings(system_instance_id);
