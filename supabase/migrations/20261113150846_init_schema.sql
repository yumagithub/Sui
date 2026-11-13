-- Sui: テーブル
-- spots / outings / outing_candidates / outing_members / votes / visit_feedback

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- API（Data API）に公開しない関数を置く場所
create schema if not exists private;

-- 共有コード：10文字（32種類 × 10桁 = 50ビット）。暗号用の乱数を使う。
-- 紛らわしい i / l / o / u は使わない。
create function private.generate_share_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstvwxyz0123456789';
  bytes bytea := extensions.gen_random_bytes(10);
  code text := '';
begin
  for i in 0..9 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------
-- spots：スポット（クライアントからは書き込まない。ダッシュボードかスクリプトで投入）
-- ---------------------------------------------------------------
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  -- 3行程度の説明
  description text check (char_length(description) <= 200),
  category text not null check (category in ('food', 'cafe', 'play', 'nature', 'view')),
  municipality text not null check (
    municipality in ('うるま市', '沖縄市', '北谷町', '宜野湾市', '北中城村', '中城村', '西原町')
  ),
  location extensions.geography(point, 4326) not null,
  is_indoor boolean not null,
  -- 不明なら null
  has_parking boolean,
  car_free_ok boolean,
  -- 1人あたりの目安（円）
  budget_yen integer check (budget_yen >= 0),
  hours_note text,
  photo_url text,
  google_maps_url text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  -- CSV を入れ直しても同じスポットが増えないように
  constraint spots_name_municipality_key unique (name, municipality)
);

create index spots_location_idx on public.spots using gist (location);
create index spots_published_municipality_idx on public.spots (municipality) where is_published;

-- ---------------------------------------------------------------
-- outings：1回のおでかけ
-- ---------------------------------------------------------------
create table public.outings (
  id uuid primary key default gen_random_uuid(),
  share_code text not null unique default private.generate_share_code()
    check (share_code ~ '^[a-z0-9]{10}$'),
  created_by uuid not null references auth.users (id) on delete cascade,
  -- エリア・車の有無・予算・気分・天気など
  conditions jsonb not null default '{}',
  status text not null default 'voting' check (status in ('voting', 'decided')),
  decided_spot_id uuid,
  created_at timestamptz not null default now(),
  constraint outings_decided_consistency check (
    (status = 'decided') = (decided_spot_id is not null)
  )
);

create index outings_created_by_idx on public.outings (created_by);

-- ---------------------------------------------------------------
-- outing_candidates：おでかけごとの3候補
-- ---------------------------------------------------------------
create table public.outing_candidates (
  outing_id uuid not null references public.outings (id) on delete cascade,
  spot_id uuid not null references public.spots (id),
  position smallint not null check (position between 1 and 3),
  primary key (outing_id, position),
  unique (outing_id, spot_id)
);

create index outing_candidates_spot_id_idx on public.outing_candidates (spot_id);

-- 決定したスポットは、そのおでかけの候補の中からだけ
alter table public.outings
  add constraint outings_decided_spot_fkey
  foreign key (id, decided_spot_id)
  references public.outing_candidates (outing_id, spot_id);

-- ---------------------------------------------------------------
-- outing_members：参加者（作成者も含む）
-- ---------------------------------------------------------------
create table public.outing_members (
  outing_id uuid not null references public.outings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  joined_at timestamptz not null default now(),
  primary key (outing_id, user_id)
);

create index outing_members_user_id_idx on public.outing_members (user_id);

-- ---------------------------------------------------------------
-- votes：1人1票（投票先の変更は可）
-- ---------------------------------------------------------------
create table public.votes (
  outing_id uuid not null,
  user_id uuid not null,
  spot_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (outing_id, user_id),
  -- 参加者しか投票できない
  foreign key (outing_id, user_id)
    references public.outing_members (outing_id, user_id) on delete cascade,
  -- 候補以外には投票できない（引き直しで候補が消えたら票も消える）
  foreign key (outing_id, spot_id)
    references public.outing_candidates (outing_id, spot_id) on delete cascade
);

create index votes_outing_id_spot_id_idx on public.votes (outing_id, spot_id);

-- ---------------------------------------------------------------
-- visit_feedback：「実際に行った？」（1人1回）
-- ---------------------------------------------------------------
create table public.visit_feedback (
  outing_id uuid not null,
  user_id uuid not null,
  went boolean not null,
  created_at timestamptz not null default now(),
  primary key (outing_id, user_id),
  foreign key (outing_id, user_id)
    references public.outing_members (outing_id, user_id) on delete cascade
);
