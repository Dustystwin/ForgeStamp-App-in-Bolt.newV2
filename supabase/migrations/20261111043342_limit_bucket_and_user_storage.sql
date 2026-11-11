/*
# 15 MB per file, 500 MB per account

The editor already refuses files over 15 MB. The bucket allowed 50 MB.
The bucket limit is now 15 MB. PNG, JPEG, and WebP stay allowed.

Each account can store 500 MB in watermark-images, counted from real
file sizes. The same cap applies to every account. The trigger runs for
storage uploads, so the browser is not the only check. Existing files
are not deleted. An account that is already over the cap cannot add more.
*/

UPDATE storage.buckets
SET file_size_limit = 15728640
WHERE id = 'watermark-images';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'watermark-images'
      AND file_size_limit = 15728640
  ) THEN
    RAISE EXCEPTION 'watermark-images bucket is missing or the 15 MB limit was not saved';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.object_byte_size(meta jsonb)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN coalesce(meta->>'size', meta->>'contentLength') ~ '^[0-9]+$'
    THEN (coalesce(meta->>'size', meta->>'contentLength'))::bigint
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION private.object_byte_size(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.object_byte_size(jsonb) FROM anon;
REVOKE ALL ON FUNCTION private.object_byte_size(jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION private.object_byte_size(jsonb) FROM service_role;

CREATE OR REPLACE FUNCTION private.enforce_watermark_storage_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cap constant bigint := 524288000;
  folder text;
  incoming bigint;
  used numeric;
  file_limit bigint;
BEGIN
  IF NEW.bucket_id IS DISTINCT FROM 'watermark-images' THEN
    RETURN NEW;
  END IF;

  folder := split_part(NEW.name, '/', 1);
  IF folder IS NULL
     OR folder !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RAISE EXCEPTION 'Image files must be saved in your own folder.'
      USING ERRCODE = '42501';
  END IF;

  incoming := private.object_byte_size(NEW.metadata);
  IF incoming IS NULL OR incoming < 0 THEN
    RAISE EXCEPTION 'Could not read the file size. Try the upload again.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT b.file_size_limit
    INTO file_limit
  FROM storage.buckets AS b
  WHERE b.id = 'watermark-images';

  IF file_limit IS NOT NULL AND incoming > file_limit THEN
    RAISE EXCEPTION 'This file is too large. The limit is 15 MB.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- One upload at a time per account, so two at once cannot both pass the cap.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('forgestamp-watermark-cap'),
    pg_catalog.hashtext(folder)
  );

  SELECT coalesce(sum(least(private.object_byte_size(o.metadata), cap)), 0)
    INTO used
  FROM storage.objects AS o
  WHERE o.bucket_id = 'watermark-images'
    AND split_part(o.name, '/', 1) = folder
    AND o.id IS DISTINCT FROM NEW.id;

  IF used + incoming > cap THEN
    RAISE EXCEPTION 'Storage limit reached. This account can store up to 500 MB.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION private.enforce_watermark_storage_cap() IS
  'Rejects watermark-images uploads that exceed 15 MB or the 500 MB account cap.';

REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM anon;
REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM authenticated;
REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM service_role;

GRANT EXECUTE ON FUNCTION private.object_byte_size(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION private.enforce_watermark_storage_cap() TO postgres;
GRANT EXECUTE ON FUNCTION private.enforce_watermark_storage_cap() TO authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_watermark_storage_cap() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    GRANT USAGE ON SCHEMA private TO supabase_storage_admin;
    GRANT EXECUTE ON FUNCTION private.object_byte_size(jsonb) TO supabase_storage_admin;
    GRANT EXECUTE ON FUNCTION private.enforce_watermark_storage_cap() TO supabase_storage_admin;
  END IF;
END $$;

DROP TRIGGER IF EXISTS enforce_watermark_storage_cap ON storage.objects;
CREATE TRIGGER enforce_watermark_storage_cap
  BEFORE INSERT OR UPDATE OF name, metadata, bucket_id
  ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'watermark-images')
  EXECUTE FUNCTION private.enforce_watermark_storage_cap();

CREATE INDEX IF NOT EXISTS watermark_objects_owner_folder_idx
  ON storage.objects (bucket_id, (split_part(name, '/', 1)))
  WHERE bucket_id = 'watermark-images';

NOTIFY pgrst, 'reload schema';
