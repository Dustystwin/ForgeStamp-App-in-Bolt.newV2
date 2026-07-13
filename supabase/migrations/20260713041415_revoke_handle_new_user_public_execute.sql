REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;