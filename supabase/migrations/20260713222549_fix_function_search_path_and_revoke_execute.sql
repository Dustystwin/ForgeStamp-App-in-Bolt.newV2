/*
# Fix SECURITY DEFINER function vulnerabilities

1. Changes
- Recreate `auth_is_admin()` with `SET search_path = ''` and fully-qualified table references
  to prevent search_path hijacking attacks.
- Recreate `handle_new_user()` with `SET search_path = ''` and fully-qualified table references.
- Revoke EXECUTE on `auth_is_admin()` from anon and authenticated roles
  (it is an internal helper called only by RLS policies, not exposed via RPC).
- Revoke EXECUTE on `handle_new_user()` from authenticated role
  (it is called by a trigger only, not by application users).

2. Security
- Both functions are SECURITY DEFINER and must not have a mutable search_path
  since an attacker could shadow standard schema objects.
- auth_is_admin() must NOT be callable via /rest/v1/rpc/ by any app role.
- handle_new_user() must NOT be callable via /rest/v1/rpc/ by any app role.
*/

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

REVOKE EXECUTE ON FUNCTION public.auth_is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_is_admin() FROM authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;