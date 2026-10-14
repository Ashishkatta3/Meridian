-- ============================================================
--  MERIDIAN — database schema
--  Paste this whole file into the Supabase SQL editor and run it.
--  Dashboard → SQL Editor → New query → paste → Run.
--
--  Three things live here:
--    profiles — one row per person, holds the admin flag
--    vault    — one row per person, holds that person's whole journal
--    guide    — the shared public atlas, editable by admins only
--
--  Row Level Security is on everywhere. A signed-in person can only
--  ever read or write their own vault row; the database enforces it,
--  not the JavaScript, so a tampered browser cannot reach anyone else.
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from public.profiles where id = auth.uid()));
  -- note: the check clause stops anyone granting themselves admin

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- give every new sign-up a profile row automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- vault: one person's entire journal, as one JSON blob ----------
-- Marks, dates, places added, written entries and notes all live in here.
-- One row per person keeps saving atomic: there is no half-synced state.
create table if not exists public.vault (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vault enable row level security;

drop policy if exists "own vault" on public.vault;
create policy "own vault" on public.vault
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- guide: the shared atlas, same for everyone ----------
-- Admin edits to country blurbs, seasons and popular spots land here and
-- override what is shipped in the JavaScript files.
create table if not exists public.guide (
  key        text primary key,          -- e.g. 'country:japan'
  data       jsonb not null,
  updated_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.guide enable row level security;

drop policy if exists "anyone can read the guide" on public.guide;
create policy "anyone can read the guide" on public.guide
  for select using (true);

drop policy if exists "admins write the guide" on public.guide;
create policy "admins write the guide" on public.guide
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ---------- photo storage ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Each person's photos live under a folder named with their user id,
-- and these policies make that folder private to them.
drop policy if exists "own photos read" on storage.objects;
create policy "own photos read" on storage.objects
  for select using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photos write" on storage.objects;
create policy "own photos write" on storage.objects
  for insert with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photos update" on storage.objects;
create policy "own photos update" on storage.objects
  for update using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photos delete" on storage.objects;
create policy "own photos delete" on storage.objects
  for delete using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
--  MAKING YOURSELF AN ADMIN
--  Sign up through the site first, then run this once with your
--  own email. Admin cannot be granted from the browser by design.
--
--    update public.profiles set is_admin = true
--    where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================
