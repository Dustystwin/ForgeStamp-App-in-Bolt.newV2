/*
# Enable pg_cron Extension
Enables the pg_cron extension so we can schedule recurring database jobs.
*/
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
