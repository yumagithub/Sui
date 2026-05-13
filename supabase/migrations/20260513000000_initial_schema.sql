-- users はSupabase Authのauth.usersと連携
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text,
  avatar_url  text,
  created_at  timestamptz default now()
);

create table public.user_preferences (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.users(id) on delete cascade,
  genre_ids        text[] default '{}',
  area_ids         text[] default '{}',
  behavior_pattern text,   -- 'morning' | 'night' | 'flexible'
  updated_at       timestamptz default now()
);

create table public.spots (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  area        text not null,
  latitude    float8 not null,
  longitude   float8 not null,
  created_at  timestamptz default now()
);

create table public.spot_photos (
  id           uuid primary key default gen_random_uuid(),
  spot_id      uuid not null references public.spots(id) on delete cascade,
  storage_path text not null,
  order_index  smallint default 0
);

create table public.genres (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.spot_genres (
  spot_id  uuid references public.spots(id) on delete cascade,
  genre_id uuid references public.genres(id) on delete cascade,
  primary key (spot_id, genre_id)
);

create table public.visits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  spot_id     uuid not null references public.spots(id) on delete cascade,
  visited_at  timestamptz not null default now(),
  memo        text,
  photo_paths text[] default '{}'
);

-- インデックス
create index spots_area_idx     on public.spots(area);
create index visits_user_id_idx on public.visits(user_id);
create index visits_spot_id_idx on public.visits(spot_id);

-- Row Level Security
alter table public.users            enable row level security;
alter table public.user_preferences enable row level security;
alter table public.spots            enable row level security;
alter table public.visits           enable row level security;

create policy "users: own row" on public.users
  using (auth.uid() = id);

create policy "prefs: own" on public.user_preferences
  using (auth.uid() = user_id);

create policy "spots: public read" on public.spots
  for select using (true);

create policy "visits: own" on public.visits
  using (auth.uid() = user_id);
