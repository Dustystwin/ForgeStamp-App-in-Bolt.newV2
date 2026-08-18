# ForgeStamp — Phase 2 Backend Specification

INSTRUCTIONS FOR ME (the owner): In Bolt, first connect Supabase using Bolt's
built-in Supabase integration button. Then paste everything below this line as
ONE message to Bolt. Answer its questions with "follow the spec" unless it
finds a real conflict.

---

Add a complete backend to this existing watermark app using the connected
Supabase project. Do NOT redesign the existing editor, patterns, scanner, or
landing page — only add the features below and connect them.

## 1. Accounts (Supabase Auth)

- Email + password sign-up and login, with password reset by email.
- Sign Up / Log In buttons in the header; a small account menu when logged in
  (email shown, Log Out, My Images, and Admin — Admin visible only to admins).
- The editor stays usable WITHOUT an account, but saving images to "My Images"
  and the 30-day storage features require login. Prompt to sign up at the
  moment a guest tries to save.

## 2. Profiles & Tiers

- `profiles` table: id (auth user id), email, tier ('free' | 'pro'),
  is_admin boolean (default false), created_at.
- Auto-create a profile row on sign-up via trigger. Tier defaults to 'free'.
- Both tiers have UNLIMITED downloads. Show an "Unlimited downloads" badge
  next to the Download button for logged-in users.
- Do not build payments yet; tier is changed only by an admin.

## 3. 30-Day Image Storage ("My Images")

- When a logged-in user exports a watermarked image, store BOTH files in a
  private Supabase Storage bucket: the original upload and the watermarked PNG,
  plus a row in an `images` table: id, user_id, original_path, output_path,
  settings jsonb (the full watermark settings used), filename, created_at,
  expires_at (created_at + 30 days).
- "My Images" page shows a grid of the user's stored images with: thumbnail,
  filename, a clear "X days left" countdown badge (red when 5 days or fewer),
  Download, Edit, and Delete buttons.
- Edit button: loads the ORIGINAL image and its saved settings back into the
  editor so the user can adjust the watermark WITHOUT re-uploading, then
  re-export (which saves a new entry with a fresh 30-day clock).
- Expiry: a scheduled daily job (Supabase cron / edge function) permanently
  deletes rows AND storage files past expires_at. Also filter out expired
  items in every query so nothing expired ever shows.
- Row Level Security: users can only read/write their own rows and files.

## 4. Admin Dashboard (owner only)

- Route /admin, accessible only when profiles.is_admin = true; everyone else
  gets redirected away. Enforce with RLS/policies, not just UI hiding.
- Show: total users, sign-ups over time, total stored images, total storage
  used, exports per day.
- Users table: email, tier, image count, storage used, joined date; actions:
  change tier (free/pro), disable account, delete a user's stored images.
- Images view: recent uploads across all users with owner email, size, days
  to expiry, and a delete action.
- After deploying, set is_admin = true on MY account row (tell me the exact
  SQL to run in the Supabase SQL editor and I will run it).

## 5. Rules

- Keep all existing front-end behavior working exactly as it does now.
- All storage buckets private; access files through signed URLs only.
- Show friendly errors (toasts) for auth and network failures.
- Mobile-friendly for every new page.
