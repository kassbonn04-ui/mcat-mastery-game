-- Arcanum MCAT Mastery — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists game_saves_updated_at_idx
  on public.game_saves (updated_at desc);

alter table public.profiles enable row level security;
alter table public.game_saves enable row level security;

-- Profiles: each user manages their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Saves: private per account (Kass on phone + laptop stays in sync)
drop policy if exists "saves_select_own" on public.game_saves;
create policy "saves_select_own"
  on public.game_saves for select
  using (auth.uid() = user_id);

drop policy if exists "saves_insert_own" on public.game_saves;
create policy "saves_insert_own"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

drop policy if exists "saves_update_own" on public.game_saves;
create policy "saves_update_own"
  on public.game_saves for update
  using (auth.uid() = user_id);

-- Auto-create profile + empty save on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.game_saves (user_id, display_name, save_data)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.game_saves to authenticated;
