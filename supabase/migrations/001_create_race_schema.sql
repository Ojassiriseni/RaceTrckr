create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make text not null,
  model text not null,
  year integer,
  nickname text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  route_name text not null,
  start_location text not null,
  end_location text not null,
  distance numeric,
  route_geometry jsonb,
  created_at timestamptz not null default now(),
  constraint routes_route_name_unique unique (creator_id, route_name)
);

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.routes(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  total_time numeric not null,
  average_speed numeric,
  max_speed numeric,
  distance numeric,
  completed_at timestamptz not null default now(),
  is_valid boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.race_participants (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  finish_time numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (race_id, user_id)
);

create table if not exists public.laps (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lap_number integer not null,
  lap_time numeric not null,
  sector_times jsonb,
  created_at timestamptz not null default now(),
  unique (race_id, user_id, lap_number)
);

create table if not exists public.ghost_replays (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint friendships_unique_pair unique (requester_id, receiver_id)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists vehicles_user_id_idx on public.vehicles (user_id);
create index if not exists routes_creator_idx on public.routes (creator_id);
create index if not exists races_route_user_idx on public.races (route_id, user_id, total_time);
create index if not exists races_valid_idx on public.races (is_valid, completed_at desc);
create index if not exists race_participants_race_idx on public.race_participants (race_id, status);
create index if not exists laps_race_user_idx on public.laps (race_id, user_id, lap_number);
create index if not exists friendships_status_idx on public.friendships (status, requester_id, receiver_id);
create index if not exists challenges_route_idx on public.challenges (route_id, status);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.routes enable row level security;
alter table public.races enable row level security;
alter table public.race_participants enable row level security;
alter table public.laps enable row level security;
alter table public.ghost_replays enable row level security;
alter table public.friendships enable row level security;
alter table public.challenges enable row level security;

create policy "Profiles are viewable by authenticated users"
on public.profiles
for select
using (true);

create policy "Users can manage their own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can view public vehicle profiles"
on public.vehicles
for select
using (true);

create policy "Users can manage their own vehicles"
on public.vehicles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Routes are readable by authenticated users"
on public.routes
for select
using (true);

create policy "Users can manage their own routes"
on public.routes
for all
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "Users can view valid race results"
on public.races
for select
using (is_valid = true);

create policy "Users can manage their own race submissions"
on public.races
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view race participants"
on public.race_participants
for select
using (true);

create policy "Users can manage their own participation"
on public.race_participants
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view laps for valid races"
on public.laps
for select
using (exists (
  select 1 from public.races r where r.id = laps.race_id and r.is_valid = true
));

create policy "Users can manage their own lap history"
on public.laps
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view ghost replays for valid races"
on public.ghost_replays
for select
using (exists (
  select 1 from public.races r where r.id = ghost_replays.race_id and r.is_valid = true
));

create policy "Users can manage their own ghost replays"
on public.ghost_replays
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage friendships involving them"
on public.friendships
for all
using (auth.uid() = requester_id or auth.uid() = receiver_id)
with check (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can view challenges involving them"
on public.challenges
for select
using (auth.uid() = creator_id or auth.uid() = opponent_id);

create policy "Users can manage their own challenge records"
on public.challenges
for all
using (auth.uid() = creator_id or auth.uid() = opponent_id)
with check (auth.uid() = creator_id or auth.uid() = opponent_id);

create or replace function public.validate_race_submission()
returns trigger
language plpgsql
as $$
begin
  if new.total_time is null or new.total_time <= 0 then
    raise exception 'Race total_time must be positive';
  end if;

  if new.average_speed is not null and new.average_speed < 0 then
    raise exception 'average_speed cannot be negative';
  end if;

  if new.max_speed is not null and new.max_speed < 0 then
    raise exception 'max_speed cannot be negative';
  end if;

  if new.distance is not null and new.distance <= 0 then
    raise exception 'distance must be positive';
  end if;

  new.is_valid = coalesce(new.is_valid, true);
  return new;
end;
$$;

create trigger validate_race_submission_trigger
before insert or update on public.races
for each row
execute function public.validate_race_submission();
