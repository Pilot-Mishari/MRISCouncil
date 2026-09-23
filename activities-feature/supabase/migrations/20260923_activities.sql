-- Activities & Fixtures schema
-- Run this in Supabase SQL Editor, or via `supabase db push` if you use the CLI.

create extension if not exists "pgcrypto";

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'general', -- e.g. 'football', 'basketball', 'chess', 'general'
  description text,
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  match_date timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'postponed', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fixtures_activity_id_idx on public.fixtures (activity_id);
create index if not exists fixtures_match_date_idx on public.fixtures (match_date);

alter table public.activities enable row level security;
alter table public.fixtures enable row level security;

-- Anyone (including logged-out visitors) can read activities and fixtures.
create policy "Public can view activities" on public.activities
  for select using (true);

create policy "Public can view fixtures" on public.fixtures
  for select using (true);

-- Only signed-in users can write. This just checks the person is
-- authenticated. If you already have a staff/role table (e.g. a
-- `profiles.role` column), tighten these to also check that, e.g.:
--   using (exists (
--     select 1 from public.profiles
--     where profiles.id = auth.uid() and profiles.role = 'staff'
--   ))
create policy "Authenticated users can insert activities" on public.activities
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update activities" on public.activities
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete activities" on public.activities
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can insert fixtures" on public.fixtures
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update fixtures" on public.fixtures
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete fixtures" on public.fixtures
  for delete using (auth.role() = 'authenticated');
