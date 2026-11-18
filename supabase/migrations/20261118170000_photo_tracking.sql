-- Photo tracking pages. This file is NOT applied by the app change.
-- Apply it in Supabase when a Forge QR should open a public mini page
-- and count scans. Until then, the editor explains that the page is waiting.

create table if not exists public.track_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  shop_url text not null default '',
  contact text not null default '',
  socials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists track_pages_user_idx on public.track_pages (user_id);

create table if not exists public.track_scans (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.track_pages(id) on delete cascade,
  visitor text not null check (char_length(visitor) between 8 and 80),
  created_at timestamptz not null default now()
);

create index if not exists track_scans_page_recent_idx
  on public.track_scans (page_id, visitor, created_at desc);

alter table public.track_pages enable row level security;
alter table public.track_scans enable row level security;

drop policy if exists track_pages_select_own on public.track_pages;
create policy track_pages_select_own on public.track_pages
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists track_pages_insert_own on public.track_pages;
create policy track_pages_insert_own on public.track_pages
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists track_pages_update_own on public.track_pages;
create policy track_pages_update_own on public.track_pages
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists track_pages_delete_own on public.track_pages;
create policy track_pages_delete_own on public.track_pages
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists track_scans_select_own on public.track_scans;
create policy track_scans_select_own on public.track_scans
  for select to authenticated
  using (
    exists (
      select 1 from public.track_pages as page
      where page.id = track_scans.page_id
        and page.user_id = auth.uid()
    )
  );

revoke all on table public.track_pages from public, anon;
revoke all on table public.track_scans from public, anon;
grant select, insert, update, delete on table public.track_pages to authenticated;
grant select on table public.track_scans to authenticated;

-- One public page, by slug. Does not list anyone else's pages.
create or replace function public.read_track_page(page_slug text)
returns table (slug text, shop_url text, contact text, socials jsonb)
language sql
security definer
stable
set search_path = public
as $$
  select page.slug, page.shop_url, page.contact, page.socials
  from public.track_pages as page
  where page.slug = page_slug
  limit 1;
$$;

-- One scan per visitor per page per minute. Extra calls in that minute do nothing.
create or replace function public.record_track_scan(page_slug text, visitor_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  found uuid;
begin
  if visitor_token is null or char_length(visitor_token) < 8 or char_length(visitor_token) > 80 then
    return;
  end if;
  if page_slug is null or page_slug !~ '^[a-z0-9-]{3,40}$' then
    return;
  end if;
  select id into found from public.track_pages where slug = page_slug;
  if found is null then
    return;
  end if;
  if exists (
    select 1 from public.track_scans
    where page_id = found
      and visitor = visitor_token
      and created_at > now() - interval '1 minute'
  ) then
    return;
  end if;
  insert into public.track_scans (page_id, visitor)
  values (found, visitor_token);
end;
$$;

revoke all on function public.read_track_page(text) from public;
revoke all on function public.record_track_scan(text, text) from public;
grant execute on function public.read_track_page(text) to anon, authenticated;
grant execute on function public.record_track_scan(text, text) to anon, authenticated;
