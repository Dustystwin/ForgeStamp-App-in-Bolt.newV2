/*
# Stop the broken SQL cleanup job

cleanup-expired-images deleted storage.objects with SQL. Storage now
rejects that, so the daily job fails and expired files stay. The
replacement is the cleanup-expired-images edge function, which deletes
through the Storage API. Schedule that function after it is deployed.
This migration does not delete files and does not store a cron secret.
*/

DO $$
DECLARE
  existing_job bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR existing_job IN
      SELECT jobid
      FROM cron.job
      WHERE jobname = 'cleanup-expired-images'
    LOOP
      PERFORM cron.unschedule(existing_job);
    END LOOP;
  END IF;
END $$;
