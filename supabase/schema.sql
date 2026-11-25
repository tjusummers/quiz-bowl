-- Quiz Bowl Playground: accounts and saved progress.
-- Run once in your Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run again.

-- One row per student. Only a username is stored: no real name, no email.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

-- Each student's progress as one JSON document:
-- { version, questions: {id: review box...}, lessons: {"subject/lesson": {...}}, quizzes: [rounds...] }
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_size check (pg_column_size(data) < 1000000)
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- Students can only see and change their own rows.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "read own progress" on public.progress;
create policy "read own progress" on public.progress
  for select using ((select auth.uid()) = user_id);

drop policy if exists "insert own progress" on public.progress;
create policy "insert own progress" on public.progress
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "update own progress" on public.progress;
create policy "update own progress" on public.progress
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Create the profile row when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets a signed-in student delete their own account and everything saved with it.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
