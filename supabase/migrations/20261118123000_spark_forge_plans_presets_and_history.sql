/*
# Spark and Forge plans, saved presets, and export history

profiles.tier gains spark and forge. free stays the default for a new
account. pro is a legacy alias for forge: existing pro rows are moved to
forge, and any pro row left behind is still treated as forge. This does
not change is_admin and does not delete files.

Signed-in users still cannot change their own tier or admin flag. That
lock stays in private.protect_profile_privileges. Only service_role,
postgres, and supabase_admin can set a plan.

Saved images:
  free  — 30 days, up to 20 images at a time
  spark — 180 days, up to 100 images at a time
  forge — kept until the person deletes them (stored as now + 100 years
          so the existing cleanup job, which deletes past expires_at, does
          not need a special case). No count cap.
The 500 MB account cap is unchanged. Images already saved keep the expiry
they have, except current Forge (including just-migrated Pro) and admin
images that have not expired yet are extended so they are not removed on
the old 30-day clock.

watermark_presets stores a person's watermark settings. The logo file is
not part of a preset. Spark can save 10. Forge can save 200. Free cannot
save one. Row Level Security is on.

These numbers match src/lib/plans.ts. This file does not touch
storage.objects, does not create an index on it, and does not change
storage.protect_delete.
*/

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;

DO $$
DECLARE
  cons_name text;
BEGIN
  FOR cons_name IN
    SELECT c.conname
    FROM pg_constraint AS c
    JOIN pg_class AS t ON t.oid = c.conrelid
    JOIN pg_namespace AS n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'profiles'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%tier%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cons_name);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'spark', 'forge', 'pro'));

COMMENT ON COLUMN public.profiles.tier IS
  'free, spark, or forge. pro is a legacy alias for forge. New accounts stay free. Only service_role, postgres, and supabase_admin may change this.';

-- Do this before reading tiers below. postgres is allowed to change tier.
UPDATE public.profiles
SET tier = 'forge'
WHERE tier = 'pro';

CREATE OR REPLACE FUNCTION private.effective_plan(tier text, is_admin boolean)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN coalesce(is_admin, false) OR tier IN ('forge', 'pro') THEN 'forge'
    WHEN tier = 'spark' THEN 'spark'
    ELSE 'free'
  END;
$$;

CREATE OR REPLACE FUNCTION private.image_retention(plan text)
RETURNS interval
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE plan
    WHEN 'forge' THEN interval '100 years'
    WHEN 'spark' THEN interval '180 days'
    ELSE interval '30 days'
  END;
$$;

CREATE OR REPLACE FUNCTION private.image_cap(plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE plan
    WHEN 'forge' THEN NULL
    WHEN 'spark' THEN 100
    ELSE 20
  END;
$$;

CREATE OR REPLACE FUNCTION private.preset_cap(plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE plan
    WHEN 'forge' THEN 200
    WHEN 'spark' THEN 10
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION private.effective_plan(text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.image_retention(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.image_cap(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.preset_cap(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.effective_plan(text, boolean) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION private.image_retention(text) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION private.image_cap(text) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION private.preset_cap(text) TO authenticated, service_role, postgres;

CREATE OR REPLACE FUNCTION private.protect_image_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  trusted boolean := current_user IN ('service_role', 'postgres', 'supabase_admin');
  plan text;
  owner_tier text;
  owner_admin boolean;
  cap integer;
  existing_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT trusted THEN
      NEW.user_id := (SELECT auth.uid());
      IF NEW.user_id IS NULL
         OR NOT private.storage_path_owned_by(NEW.original_path, NEW.user_id)
         OR NOT private.storage_path_owned_by(NEW.output_path, NEW.user_id) THEN
        RAISE EXCEPTION 'Image files must be saved in your own folder.'
          USING ERRCODE = '42501';
      END IF;

      SELECT p.tier, p.is_admin
      INTO owner_tier, owner_admin
      FROM public.profiles AS p
      WHERE p.id = NEW.user_id;

      plan := private.effective_plan(owner_tier, owner_admin);
      NEW.expires_at := now() + private.image_retention(plan);
      cap := private.image_cap(plan);

      IF cap IS NOT NULL THEN
        PERFORM pg_advisory_xact_lock(hashtext('forgestamp-images:' || NEW.user_id::text)::bigint);
        SELECT count(*)
        INTO existing_count
        FROM public.images
        WHERE user_id = NEW.user_id
          AND expires_at > now();
        IF existing_count >= cap THEN
          IF plan = 'spark' THEN
            RAISE EXCEPTION 'Spark accounts can keep 100 saved images for 180 days. Delete one in My Images to save another.';
          ELSE
            RAISE EXCEPTION 'Free accounts can keep 20 saved images for 30 days. Delete one in My Images to save another.';
          END IF;
        END IF;
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

REVOKE ALL ON FUNCTION private.protect_image_row() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.protect_image_row() TO authenticated, service_role, postgres;

-- Extend images that are still available for Forge and admin accounts.
-- Expired rows are left alone. Nothing is deleted.
UPDATE public.images AS image
SET expires_at = now() + interval '100 years'
WHERE image.expires_at > now()
  AND EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = image.user_id
      AND (profile.tier IN ('forge', 'pro') OR profile.is_admin)
  );

CREATE TABLE IF NOT EXISTS public.watermark_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  settings jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watermark_presets_name_len CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  CONSTRAINT watermark_presets_settings_obj CHECK (
    jsonb_typeof(settings) = 'object'
    AND octet_length(settings::text) <= 8000
  )
);

COMMENT ON TABLE public.watermark_presets IS
  'Per-account watermark settings. Spark may store 10, Forge 200. The logo file is not stored.';

CREATE INDEX IF NOT EXISTS watermark_presets_user_id_idx
  ON public.watermark_presets (user_id, created_at DESC);

ALTER TABLE public.watermark_presets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.protect_preset_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  trusted boolean := current_user IN ('service_role', 'postgres', 'supabase_admin');
  plan text;
  owner_tier text;
  owner_admin boolean;
  cap integer;
  existing_count integer;
BEGIN
  IF NOT trusted THEN
    IF TG_OP = 'INSERT' THEN
      NEW.user_id := (SELECT auth.uid());
    ELSE
      NEW.id := OLD.id;
      NEW.user_id := OLD.user_id;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to save a preset.'
      USING ERRCODE = '42501';
  END IF;

  NEW.name := btrim(coalesce(NEW.name, ''));
  IF char_length(NEW.name) < 1 OR char_length(NEW.name) > 60 THEN
    RAISE EXCEPTION 'Preset name must be between 1 and 60 characters.';
  END IF;

  IF jsonb_typeof(NEW.settings) IS DISTINCT FROM 'object'
     OR octet_length(NEW.settings::text) > 8000 THEN
    RAISE EXCEPTION 'That preset could not be saved.';
  END IF;

  NEW.updated_at := now();

  IF TG_OP = 'INSERT' AND NOT trusted THEN
    SELECT p.tier, p.is_admin
    INTO owner_tier, owner_admin
    FROM public.profiles AS p
    WHERE p.id = NEW.user_id;

    plan := private.effective_plan(owner_tier, owner_admin);
    cap := private.preset_cap(plan);

    IF cap = 0 THEN
      RAISE EXCEPTION 'Saved presets are included with Spark (up to 10) and Forge (up to 200).';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('forgestamp-presets:' || NEW.user_id::text)::bigint);
    SELECT count(*)
    INTO existing_count
    FROM public.watermark_presets
    WHERE user_id = NEW.user_id;

    IF existing_count >= cap THEN
      IF plan = 'spark' THEN
        RAISE EXCEPTION 'Spark accounts can save 10 presets. Delete one to save another.';
      ELSE
        RAISE EXCEPTION 'Forge accounts can save 200 presets. Delete one to save another.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_preset_row() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.protect_preset_row() TO authenticated, service_role, postgres;

DROP TRIGGER IF EXISTS protect_preset_row ON public.watermark_presets;
CREATE TRIGGER protect_preset_row
  BEFORE INSERT OR UPDATE ON public.watermark_presets
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_preset_row();

DROP POLICY IF EXISTS "select_own_presets" ON public.watermark_presets;
CREATE POLICY "select_own_presets" ON public.watermark_presets
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT private.auth_is_admin()));

DROP POLICY IF EXISTS "insert_own_presets" ON public.watermark_presets;
CREATE POLICY "insert_own_presets" ON public.watermark_presets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "update_own_presets" ON public.watermark_presets;
CREATE POLICY "update_own_presets" ON public.watermark_presets
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_presets" ON public.watermark_presets;
CREATE POLICY "delete_own_presets" ON public.watermark_presets
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT private.auth_is_admin()));

REVOKE ALL ON TABLE public.watermark_presets FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.watermark_presets TO authenticated;
GRANT INSERT (user_id, name, settings) ON TABLE public.watermark_presets TO authenticated;
GRANT UPDATE (name, settings) ON TABLE public.watermark_presets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.watermark_presets TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    GRANT EXECUTE ON FUNCTION private.effective_plan(text, boolean) TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.image_retention(text) TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.image_cap(text) TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.preset_cap(text) TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.protect_image_row() TO supabase_admin;
    GRANT EXECUTE ON FUNCTION private.protect_preset_row() TO supabase_admin;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
