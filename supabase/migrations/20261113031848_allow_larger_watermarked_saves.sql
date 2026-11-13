/*
# Let finished watermarked images be larger than the photo

People can upload a photo up to 15 MB. The watermarked PNG is often two
to four times bigger, so a normal phone photo was rejected by the 15 MB
bucket limit even though the download worked.

The bucket now allows 50 MB, which is the most a file on the Free
Supabase plan can be. The trigger still refuses an original over 15 MB.
Only a finished image in the outputs folder, with an image type this
bucket already allows, may use the larger bucket limit. The 500 MB
account cap is unchanged. Nothing is deleted, and nobody's plan changes.

This does not drop storage.protect_delete or the protect_objects_delete
trigger, and it does not create an index on storage.objects. Hosted
postgres can replace this function and does not own that table.
*/

UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'watermark-images';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'watermark-images'
      AND file_size_limit = 52428800
  ) THEN
    RAISE EXCEPTION 'watermark-images bucket is missing or the 50 MB limit was not saved';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.enforce_watermark_storage_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  account_cap constant bigint := 524288000;
  original_cap constant bigint := 15728640;
  folder text;
  kind text;
  mime text;
  incoming bigint;
  used numeric;
  file_limit bigint;
  per_file_cap bigint;
  finished_output boolean;
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

  kind := split_part(NEW.name, '/', 2);
  mime := lower(btrim(split_part(
    coalesce(NEW.metadata->>'mimetype', NEW.metadata->>'contentType', ''),
    ';',
    1
  )));
  finished_output := kind = 'outputs'
    AND mime IN ('image/png', 'image/jpeg', 'image/webp');

  SELECT b.file_size_limit
    INTO file_limit
  FROM storage.buckets AS b
  WHERE b.id = 'watermark-images';

  -- Originals stay at 15 MB even though the bucket allows a larger finished PNG.
  per_file_cap := CASE
    WHEN finished_output THEN coalesce(file_limit, 52428800)
    ELSE original_cap
  END;

  IF incoming > per_file_cap THEN
    IF finished_output THEN
      RAISE EXCEPTION 'This finished image is too large to save.'
        USING ERRCODE = 'check_violation';
    END IF;
    RAISE EXCEPTION 'This file is too large. The limit is 15 MB.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- One upload at a time per account, so two at once cannot both pass the cap.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('forgestamp-watermark-cap'),
    pg_catalog.hashtext(folder)
  );

  SELECT coalesce(sum(least(private.object_byte_size(o.metadata), account_cap)), 0)
    INTO used
  FROM storage.objects AS o
  WHERE o.bucket_id = 'watermark-images'
    AND split_part(o.name, '/', 1) = folder
    AND o.id IS DISTINCT FROM NEW.id;

  IF used + incoming > account_cap THEN
    RAISE EXCEPTION 'Storage limit reached. This account can store up to 500 MB.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION private.enforce_watermark_storage_cap() IS
  'Rejects watermark-images originals over 15 MB, finished images over the bucket limit, or an account over 500 MB.';

REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM anon;
REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM authenticated;
REVOKE ALL ON FUNCTION private.enforce_watermark_storage_cap() FROM service_role;

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

NOTIFY pgrst, 'reload schema';
