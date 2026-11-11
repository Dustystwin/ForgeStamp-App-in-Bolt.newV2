/*
# Restore signed-in access and lock account privileges

Migration 20260713222549 revoked EXECUTE on public.auth_is_admin() from
authenticated. Row Level Security still calls that function, so profile,
image, and storage queries fail with "permission denied for function
auth_is_admin".

Granting EXECUTE again on the public copy would also publish it at
/rest/v1/rpc/auth_is_admin. A SECURITY DEFINER function must not live in
an exposed schema. The helper now lives in schema private, which is not
part of the Data API. Signed-in users can execute it only so policies can
run. Do not add schema private to Exposed schemas.

This migration also locks profiles.tier and profiles.is_admin. Restoring
profile updates without that lock would let someone mark themselves Pro
or admin. The admin-api edge function uses the service role, which is
still allowed to change those columns. postgres and supabase_admin can
change them from the SQL editor. This file does not update any profile row.
*/

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

DO $$
DECLARE
  exposed text := coalesce(current_setting('pgrst.db_schemas', true), 'public');
BEGIN
  IF EXISTS (
    SELECT 1
    FROM unnest(string_to_array(exposed, ',')) AS item(name)
    WHERE btrim(item.name) = 'private'
  ) THEN
    RAISE EXCEPTION 'schema private is exposed to the Data API; refusing to store privileged helpers there';
  END IF;
END $$;

COMMENT ON SCHEMA private IS
  'ForgeStamp internal helpers. Do not add this schema to Data API exposed schemas.';

CREATE OR REPLACE FUNCTION private.auth_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (
      SELECT p.is_admin
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
    ),
    false
  );
$$;

COMMENT ON FUNCTION private.auth_is_admin() IS
  'True when the signed-in user has profiles.is_admin. Used by RLS only.';

REVOKE ALL ON FUNCTION private.auth_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_admin() FROM anon;
REVOKE ALL ON FUNCTION private.auth_is_admin() FROM authenticated;
REVOKE ALL ON FUNCTION private.auth_is_admin() FROM service_role;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.auth_is_admin() TO authenticated;
-- Owner execute is not implied once PUBLIC is revoked.
GRANT EXECUTE ON FUNCTION private.auth_is_admin() TO postgres;

CREATE OR REPLACE FUNCTION private.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Signup runs as the function owner, not service_role. New profiles
    -- stay Free and non-admin. service_role may insert another tier.
    IF current_user IS DISTINCT FROM 'service_role' THEN
      NEW.tier := 'free';
      NEW.is_admin := false;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'You cannot change the account id.'
      USING ERRCODE = '42501';
  END IF;

  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin')
     AND (
       NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     ) THEN
    RAISE EXCEPTION 'You cannot change account type or admin access.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_profile_privileges() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.protect_profile_privileges() FROM anon;
REVOKE ALL ON FUNCTION private.protect_profile_privileges() FROM authenticated;
REVOKE ALL ON FUNCTION private.protect_profile_privileges() FROM service_role;

GRANT EXECUTE ON FUNCTION private.protect_profile_privileges() TO authenticated;
GRANT EXECUTE ON FUNCTION private.protect_profile_privileges() TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.protect_profile_privileges() TO service_role;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_profile_privileges();

-- Table-level UPDATE covers every column. Remove it, then give back email only.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (email) ON TABLE public.profiles TO authenticated;
REVOKE INSERT, DELETE, TRUNCATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- service_role is the admin-api path. Make its column access explicit.
GRANT SELECT, UPDATE ON TABLE public.profiles TO service_role;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id OR (SELECT private.auth_is_admin()));

DROP POLICY IF EXISTS "update_profile" ON public.profiles;
CREATE POLICY "update_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id OR (SELECT private.auth_is_admin()))
  WITH CHECK ((SELECT auth.uid()) = id OR (SELECT private.auth_is_admin()));

DROP POLICY IF EXISTS "admin_select_images" ON public.images;
CREATE POLICY "admin_select_images" ON public.images
  FOR SELECT TO authenticated
  USING ((SELECT private.auth_is_admin()));

DROP POLICY IF EXISTS "update_images" ON public.images;
CREATE POLICY "update_images" ON public.images
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT private.auth_is_admin()))
  WITH CHECK ((SELECT auth.uid()) = user_id OR (SELECT private.auth_is_admin()));

DROP POLICY IF EXISTS "delete_images" ON public.images;
CREATE POLICY "delete_images" ON public.images
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT private.auth_is_admin()));

DROP POLICY IF EXISTS "storage_select_own" ON storage.objects;
CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'watermark-images'
    AND (
      (string_to_array(name, '/'))[1] = (SELECT auth.uid())::text
      OR (SELECT private.auth_is_admin())
    )
  );

DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;
CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'watermark-images'
    AND (
      (string_to_array(name, '/'))[1] = (SELECT auth.uid())::text
      OR (SELECT private.auth_is_admin())
    )
  );

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM service_role;

GRANT EXECUTE ON FUNCTION private.handle_new_user() TO postgres;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA private TO supabase_auth_admin;
    GRANT EXECUTE ON FUNCTION private.handle_new_user() TO supabase_auth_admin;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    GRANT USAGE ON SCHEMA private TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.protect_profile_privileges() TO supabase_admin;
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.handle_new_user();

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.auth_is_admin();

NOTIFY pgrst, 'reload schema';
