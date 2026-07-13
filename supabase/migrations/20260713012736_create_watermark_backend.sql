/*
# ForgeStamp Backend Schema

Sets up profiles table, images table, storage bucket, RLS policies,
auto-profile trigger, and admin helper function.
*/

-- ============================================================
-- TABLE: profiles (must exist before auth_is_admin function)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  tier       text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  is_admin   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- AUTH HELPER: auth_is_admin()
-- SECURITY DEFINER bypasses RLS to avoid circular recursion in policies.
-- ============================================================
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- TRIGGER: auto-create profile on sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS: profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR auth_is_admin());

DROP POLICY IF EXISTS "update_profile" ON profiles;
CREATE POLICY "update_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR auth_is_admin())
  WITH CHECK (auth.uid() = id OR auth_is_admin());

-- ============================================================
-- TABLE: images
-- ============================================================
CREATE TABLE IF NOT EXISTS images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid()
                  REFERENCES auth.users(id) ON DELETE CASCADE,
  original_path text NOT NULL,
  output_path   text NOT NULL,
  settings      jsonb NOT NULL DEFAULT '{}',
  filename      text NOT NULL,
  total_size    bigint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX IF NOT EXISTS images_user_id_idx       ON images (user_id);
CREATE INDEX IF NOT EXISTS images_expires_at_idx    ON images (expires_at);
CREATE INDEX IF NOT EXISTS images_user_expires_idx  ON images (user_id, expires_at);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_images" ON images;
CREATE POLICY "select_own_images" ON images
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND expires_at > now());

DROP POLICY IF EXISTS "admin_select_images" ON images;
CREATE POLICY "admin_select_images" ON images
  FOR SELECT TO authenticated
  USING (auth_is_admin());

DROP POLICY IF EXISTS "insert_own_images" ON images;
CREATE POLICY "insert_own_images" ON images
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_images" ON images;
CREATE POLICY "update_images" ON images
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth_is_admin())
  WITH CHECK (auth.uid() = user_id OR auth_is_admin());

DROP POLICY IF EXISTS "delete_images" ON images;
CREATE POLICY "delete_images" ON images
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth_is_admin());

-- ============================================================
-- STORAGE: watermark-images bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'watermark-images',
  'watermark-images',
  false,
  52428800,
  ARRAY['image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
CREATE POLICY "storage_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'watermark-images'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_select_own" ON storage.objects;
CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'watermark-images'
    AND (
      (string_to_array(name, '/'))[1] = auth.uid()::text
      OR auth_is_admin()
    )
  );

DROP POLICY IF EXISTS "storage_update_own" ON storage.objects;
CREATE POLICY "storage_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'watermark-images'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'watermark-images'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;
CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'watermark-images'
    AND (
      (string_to_array(name, '/'))[1] = auth.uid()::text
      OR auth_is_admin()
    )
  );
