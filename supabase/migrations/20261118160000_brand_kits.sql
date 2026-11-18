-- Brand kits. This file is NOT applied by the app change.
-- Apply it in Supabase when kits should sync to the account.
-- Until then, the editor keeps a kit in this browser only.
--
-- A logo file is stored at {user id}/brand/{kit id}.png in the existing
-- watermark-images bucket. The storage cap trigger already counts those
-- bytes toward the 500 MB account limit.

create table if not exists public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  logo_path text,
  logo_bytes bigint not null default 0 check (logo_bytes >= 0),
  fonts jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  handles jsonb not null default '[]'::jsonb,
  website text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists brand_kits_user_id_idx on public.brand_kits (user_id, created_at);

alter table public.brand_kits enable row level security;

drop policy if exists brand_kits_select_own on public.brand_kits;
create policy brand_kits_select_own on public.brand_kits
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists brand_kits_insert_own on public.brand_kits;
create policy brand_kits_insert_own on public.brand_kits
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists brand_kits_update_own on public.brand_kits;
create policy brand_kits_update_own on public.brand_kits
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists brand_kits_delete_own on public.brand_kits;
create policy brand_kits_delete_own on public.brand_kits
  for delete to authenticated
  using (auth.uid() = user_id);

revoke all on table public.brand_kits from public;
revoke all on table public.brand_kits from anon;
grant select, insert, update, delete on table public.brand_kits to authenticated;
