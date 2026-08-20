REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_inspection_access_status(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_property_share(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.spend_credits(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_shared_property_package(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_shared_report(uuid) FROM authenticated;