/*
# Scheduled Cleanup: Delete Expired Images

Schedules a daily cron job at 03:00 UTC that:
1. Deletes storage objects (files) for expired image records.
2. Deletes the expired image rows.

Uses SELECT ... ON CONFLICT to make the schedule idempotent (safe to re-run).
*/

SELECT cron.schedule(
  'cleanup-expired-images',
  '0 3 * * *',
  $$
    DELETE FROM storage.objects
    WHERE bucket_id = 'watermark-images'
      AND name IN (
        SELECT original_path FROM images WHERE expires_at < now()
        UNION ALL
        SELECT output_path  FROM images WHERE expires_at < now()
      );

    DELETE FROM images WHERE expires_at < now();
  $$
);
