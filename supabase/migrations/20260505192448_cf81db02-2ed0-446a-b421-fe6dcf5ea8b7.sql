CREATE TABLE IF NOT EXISTS public.inspection_review_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_record_id UUID NOT NULL UNIQUE REFERENCES public.property_records(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  free_trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  free_trial_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 days'),
  one_time_access_expires_at TIMESTAMPTZ,
  one_time_purchase_count INTEGER NOT NULL DEFAULT 0,
  last_one_time_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ira_user ON public.inspection_review_access(user_id);
CREATE INDEX IF NOT EXISTS idx_ira_property ON public.inspection_review_access(property_id);

ALTER TABLE public.inspection_review_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their inspection access"
ON public.inspection_review_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owners insert their inspection access"
ON public.inspection_review_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ira_touch_updated_at
BEFORE UPDATE ON public.inspection_review_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.start_inspection_review_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner UUID;
BEGIN
  IF COALESCE(NEW.record_type, '') NOT ILIKE '%inspection%' THEN
    RETURN NEW;
  END IF;

  SELECT p.user_id INTO _owner
    FROM public.properties p WHERE p.id = NEW.property_id;
  IF _owner IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.inspection_review_access (
    property_record_id, property_id, user_id,
    free_trial_started_at, free_trial_expires_at
  ) VALUES (
    NEW.id, NEW.property_id, _owner,
    now(), now() + interval '60 days'
  )
  ON CONFLICT (property_record_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_start_inspection_trial ON public.property_records;
CREATE TRIGGER trg_start_inspection_trial
AFTER INSERT ON public.property_records
FOR EACH ROW EXECUTE FUNCTION public.start_inspection_review_trial();

INSERT INTO public.inspection_review_access (property_record_id, property_id, user_id, free_trial_started_at, free_trial_expires_at)
SELECT pr.id, pr.property_id, p.user_id,
       COALESCE(pr.created_at, now()),
       COALESCE(pr.created_at, now()) + interval '60 days'
FROM public.property_records pr
JOIN public.properties p ON p.id = pr.property_id
WHERE COALESCE(pr.record_type,'') ILIKE '%inspection%'
ON CONFLICT (property_record_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_inspection_access_status(
  _property_record_id UUID,
  _user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  status TEXT,
  days_remaining INTEGER,
  free_trial_started_at TIMESTAMPTZ,
  free_trial_expires_at TIMESTAMPTZ,
  one_time_access_expires_at TIMESTAMPTZ,
  is_subscribed BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := COALESCE(_user_id, auth.uid());
  _row public.inspection_review_access;
  _has_sub BOOLEAN := false;
  _now TIMESTAMPTZ := now();
  _trial_end TIMESTAMPTZ;
  _ot_end TIMESTAMPTZ;
  _days INTEGER;
  _status TEXT;
BEGIN
  IF _uid IS NULL THEN
    RETURN QUERY SELECT 'expired'::TEXT, 0, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, false;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _uid
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > _now)
  ) INTO _has_sub;

  SELECT * INTO _row FROM public.inspection_review_access
   WHERE property_record_id = _property_record_id;

  _trial_end := _row.free_trial_expires_at;
  _ot_end := _row.one_time_access_expires_at;

  IF _has_sub THEN
    RETURN QUERY SELECT 'subscribed'::TEXT, NULL::INTEGER, _row.free_trial_started_at, _trial_end, _ot_end, true;
    RETURN;
  END IF;

  IF _ot_end IS NOT NULL AND _ot_end > _now THEN
    _days := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_ot_end - _now)) / 86400.0))::INTEGER;
    RETURN QUERY SELECT 'one_time_active'::TEXT, _days, _row.free_trial_started_at, _trial_end, _ot_end, false;
    RETURN;
  END IF;

  IF _trial_end IS NOT NULL AND _trial_end > _now THEN
    _days := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_trial_end - _now)) / 86400.0))::INTEGER;
    IF _days <= 5 THEN
      _status := 'trial_final_days';
    ELSIF _days <= 15 THEN
      _status := 'trial_expiring_soon';
    ELSE
      _status := 'trial_active';
    END IF;
    RETURN QUERY SELECT _status, _days, _row.free_trial_started_at, _trial_end, _ot_end, false;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'expired'::TEXT, 0, _row.free_trial_started_at, _trial_end, _ot_end, false;
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_inspection_one_time_access(
  _property_record_id UUID,
  _days INTEGER DEFAULT 30
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now TIMESTAMPTZ := now();
  _new_end TIMESTAMPTZ;
BEGIN
  UPDATE public.inspection_review_access
     SET one_time_access_expires_at = GREATEST(COALESCE(one_time_access_expires_at, _now), _now) + make_interval(days => _days),
         one_time_purchase_count = one_time_purchase_count + 1,
         last_one_time_purchase_at = _now,
         updated_at = _now
   WHERE property_record_id = _property_record_id
   RETURNING one_time_access_expires_at INTO _new_end;

  RETURN _new_end;
END;
$$;

REVOKE ALL ON FUNCTION public.extend_inspection_one_time_access(UUID, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.get_inspection_access_status(UUID, UUID) TO authenticated;