# ForgeStamp

IMPORTANT — NOTE TO ANY AI ASSISTANT (INCLUDING BOLT):
This repository contains a COMPLETE, WORKING, TESTED application.
Do NOT regenerate, rebuild, scaffold, or replace this application.
Do NOT create a new app, new theme, or new layout.
Only make changes the user explicitly and specifically requests.
To run: npm install && npm run dev

ForgeStamp is a watermarking web app: upload a photo, then stamp text,
your own logo, or a QR code. Text keeps 16 full-coverage patterns (including
true hexagon honeycomb, curved spiral/concentric text, and Word Direction).
Logo and QR use the same single placement and full-coverage patterns, without
bending the image. The app can scan uploads for existing watermarks and
AI-generation markers.

Plans are Free, Spark, and Forge. Spark and Forge are not for sale, and
there is no checkout. A new account is Free. A legacy Pro account is Forge.

- Free: PNG only, original photo size, 3 photos per export, up to 20 saved
  images for 30 days. No saved presets.
- Spark: premium fonts and colors, PNG / JPG / WebP, 25 photos per export,
  10 saved presets, up to 100 saved images for 180 days.
- Forge: everything in Spark, 50 photos per export, up to 200 saved presets,
  and saved images stay until you delete them. Each account can still store
  only 500 MB. Uploads stay at 15 MB.

Watermarking runs in the browser. There is no priority queue and no monthly
batch allowance. Every plan downloads at the photo's original pixel size.

## Plans on the live database

Apply this migration after the new site is deployed, so existing Pro
accounts are not briefly treated as Free by the old site:

`supabase/migrations/20261118123000_spark_forge_plans_presets_and_history.sql`

It adds Spark and Forge, moves any remaining `pro` rows to `forge`, adds
saved presets, and sets how long My Images keeps new exports. It does not
delete files and does not change the 500 MB storage cap. Images already
saved keep their current expiry, except images still on a Forge or admin
account are kept until deleted.

To put a test account on a plan, open the Supabase SQL editor (it runs as
postgres, which is allowed to change plans) and run:

```sql
UPDATE public.profiles
SET tier = 'forge'
WHERE email = 'person@example.com';
```

Use `free`, `spark`, or `forge`. Do not put a service role key in the app
or in this file.

The Admin page can set the same plans after you deploy the updated function:

```
supabase functions deploy admin-api
```

The daily cleanup function does not need a new deploy for this change. It
already deletes files whose `expires_at` has passed. Forge dates are far in
the future, so those files stay until someone deletes them or the 500 MB
cap is the reason a new save is refused.

## After the security migrations

Apply the new SQL files to the live database before relying on saved images.
They do not change anyone's plan or admin flag.

Deploy the 30-day cleanup only after that, from a machine logged into the Supabase CLI:

```
supabase functions deploy cleanup-expired-images --no-verify-jwt
```

In the Supabase dashboard, open Edge Functions, choose cleanup-expired-images, and add the schedule `0 3 * * *` (daily at 03:00 UTC). The schedule must call the function with the service role key. No new secret is stored in this repo. The function deletes files that are already past 30 days.

Photos you upload can be up to 15 MB. A finished PNG saved to My Images can be up to 50 MB, because the watermarked file is often larger than the photo. A PNG bigger than that is stored as a smaller copy of the same picture. Each account can store 500 MB. Apply `supabase/migrations/20261113031848_allow_larger_watermarked_saves.sql` on the live database so finished PNGs larger than 15 MB can be stored as PNGs. That migration does not change anyone's plan or delete any files. Password reset returns to the site root; that address must already be allowed by Supabase Auth. Redirect allow-list, email confirmation, and captcha stay unchanged until launch.
