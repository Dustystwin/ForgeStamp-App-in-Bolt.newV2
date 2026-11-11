/*
# Keep image files in the owner's folder and let the server set expiry

Signed-in users could insert or update their own images rows with any
storage path and any expires_at. Cleanup and admin-api delete with the
service role, so a row could name someone else's file or stay forever.

Paths must start with that user's id. The server sets expires_at to 30
days on create and ignores later client changes. service_role, postgres,
and supabase_admin can still change those fields. This does not change
profiles.tier or profiles.is_admin.

Rows that already expire more than 30 days out are pulled back. A normal
30-day row is left as it is. Files are not deleted here.
*/

CREATE OR REPLACE FUNCTION private.storage_path_owned_by(path text, owner_id uuid)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    owner_id IS NOT NULL
    AND path IS NOT NULL
    AND char_length(path) BETWEEN 1 AND 1024
    AND split_part(path, '/', 1) = owner_id::text
    AND split_part(path, '/', 2) <> ''
    AND path !~ '\\'
    AND path !~ '[[:cntrl:]]'
    AND path !~ '(^|/)\.\.(/|$)';
$$;

REVOKE ALL ON FUNCTION private.storage_path_owned_by(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.storage_path_owned_by(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION private.storage_path_owned_by(text, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION private.storage_path_owned_by(text, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION private.storage_path_owned_by(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.storage_path_owned_by(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.storage_path_owned_by(text, uuid) TO postgres;

CREATE OR REPLACE FUNCTION private.protect_image_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  trusted boolean := current_user IN ('service_role', 'postgres', 'supabase_admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT trusted THEN
      NEW.user_id := (SELECT auth.uid());
      NEW.expires_at := now() + interval '30 days';
      IF NEW.user_id IS NULL
         OR NOT private.storage_path_owned_by(NEW.original_path, NEW.user_id)
         OR NOT private.storage_path_owned_by(NEW.output_path, NEW.user_id) THEN
        RAISE EXCEPTION 'Image files must be saved in your own folder.'
          USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.expires_at IS NULL THEN
      NEW.expires_at := now() + interval '30 days';
    END IF;
    RETURN NEW;
  END IF;

  IF NOT trusted THEN
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.expires_at := OLD.expires_at;
    IF NOT private.storage_path_owned_by(NEW.original_path, OLD.user_id)
       OR NOT private.storage_path_owned_by(NEW.output_path, OLD.user_id) THEN
      RAISE EXCEPTION 'Image files must stay in your own folder.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_image_row() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.protect_image_row() FROM anon;
REVOKE ALL ON FUNCTION private.protect_image_row() FROM authenticated;
REVOKE ALL ON FUNCTION private.protect_image_row() FROM service_role;
GRANT EXECUTE ON FUNCTION private.protect_image_row() TO authenticated;
GRANT EXECUTE ON FUNCTION private.protect_image_row() TO service_role;
GRANT EXECUTE ON FUNCTION private.protect_image_row() TO postgres;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    GRANT EXECUTE ON FUNCTION private.protect_image_row() TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.storage_path_owned_by(text, uuid) TO supabase_admin;
  END IF;
END $$;

DROP TRIGGER IF EXISTS protect_image_row ON public.images;
CREATE TRIGGER protect_image_row
  BEFORE INSERT OR UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_image_row();

DROP POLICY IF EXISTS "insert_own_images" ON public.images;
CREATE POLICY "insert_own_images" ON public.images
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND private.storage_path_owned_by(original_path, (SELECT auth.uid()))
    AND private.storage_path_owned_by(output_path, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "update_images" ON public.images;
CREATE POLICY "update_images" ON public.images
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT private.auth_is_admin()))
  WITH CHECK (
    private.storage_path_owned_by(original_path, user_id)
    AND private.storage_path_owned_by(output_path, user_id)
    AND (
      (SELECT auth.uid()) = user_id
      OR (SELECT private.auth_is_admin())
    )
  );

-- Clients may create a row and edit its label or settings.
-- They cannot choose the owner, the expiry, or a path outside their folder.
REVOKE INSERT, UPDATE ON TABLE public.images FROM PUBLIC, anon, authenticated;
GRANT INSERT (user_id, original_path, output_path, settings, filename, total_size)
  ON TABLE public.images TO authenticated;
GRANT UPDATE (settings, filename)
  ON TABLE public.images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.images TO service_role;

-- Pull back rows whose expiry was moved past the 30-day window.
-- Equal-to-30-day rows are not changed. Nothing is deleted.
UPDATE public.images
SET expires_at = least(created_at, now()) + interval '30 days'
WHERE expires_at > least(created_at, now()) + interval '30 days';

NOTIFY pgrst, 'reload schema';
