-- Status function: tells the share page whether the link is active/expired/revoked/invalid
CREATE OR REPLACE FUNCTION public.get_share_status(_token uuid)
RETURNS TABLE(
  status text,
  share_id uuid,
  property_id uuid,
  owner_first_name text,
  owner_full_name text,
  property_address text,
  property_year_built text,
  property_health_score integer,
  expires_at timestamptz,
  created_at timestamptz,
  message text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row record;
BEGIN
  SELECT s.id, s.property_id, s.expires_at, s.revoked_at, s.created_at, s.message,
         p.full_name, prop.address, prop.year_built, prop.health_score
    INTO _row
    FROM public.property_shares s
    JOIN public.properties prop ON prop.id = s.property_id
    LEFT JOIN public.profiles p ON p.user_id = s.user_id
   WHERE s.token = _token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::integer, NULL::timestamptz, NULL::timestamptz, NULL::text;
    RETURN;
  END IF;

  IF _row.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT 'revoked'::text, _row.id, _row.property_id,
      split_part(COALESCE(_row.full_name, ''), ' ', 1),
      _row.full_name, _row.address, _row.year_built, _row.health_score, _row.expires_at, _row.created_at, _row.message;
    RETURN;
  END IF;

  IF _row.expires_at IS NOT NULL AND _row.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::text, _row.id, _row.property_id,
      split_part(COALESCE(_row.full_name, ''), ' ', 1),
      _row.full_name, _row.address, _row.year_built, _row.health_score, _row.expires_at, _row.created_at, _row.message;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'active'::text, _row.id, _row.property_id,
    split_part(COALESCE(_row.full_name, ''), ' ', 1),
    _row.full_name, _row.address, _row.year_built, _row.health_score, _row.expires_at, _row.created_at, _row.message;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_share_status(uuid) TO anon, authenticated;

-- Increment view count when share page is opened
CREATE OR REPLACE FUNCTION public.record_share_view(_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.property_shares
     SET access_count = access_count + 1,
         last_accessed_at = now()
   WHERE token = _token
     AND revoked_at IS NULL
     AND (expires_at IS NULL OR expires_at > now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_share_view(uuid) TO anon, authenticated;

-- Owner revokes a share by id
CREATE OR REPLACE FUNCTION public.revoke_property_share(_share_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ok boolean;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  UPDATE public.property_shares
     SET revoked_at = now()
   WHERE id = _share_id
     AND user_id = _uid
     AND revoked_at IS NULL
   RETURNING true INTO _ok;
  RETURN COALESCE(_ok, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_property_share(uuid) TO authenticated;