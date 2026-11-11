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
AI-generation markers, and export PNGs. Free can export up to 3 photos
as a ZIP. A Pro account, or an admin, can export up to 25. Unlimited
batch is not available yet, and Spark and Forge are not for sale.

## After the security migrations

Apply the new SQL files to the live database before relying on saved images.
They do not change anyone's plan or admin flag.

Deploy the 30-day cleanup only after that, from a machine logged into the Supabase CLI:

```
supabase functions deploy cleanup-expired-images --no-verify-jwt
```

In the Supabase dashboard, open Edge Functions, choose cleanup-expired-images, and add the schedule `0 3 * * *` (daily at 03:00 UTC). The schedule must call the function with the service role key. No new secret is stored in this repo. The function deletes files that are already past 30 days.

Each file can be up to 15 MB. Each account can store 500 MB. Password reset returns to the site root; that address must already be allowed by Supabase Auth. Redirect allow-list, email confirmation, and captcha stay unchanged until launch.
