-- Sui: 条件に合うスポットを3件ランダムに選ぶ
--
-- 絶対条件（ゆるめない）: 公開中 / 車なしなら car_free_ok = true
-- 優先（並び順だけ）    : 雨なら屋内 / 車ありなら駐車場あり
-- 3件そろわないときは、この順にゆるめる:
--   0. すべて満たす
--   1. 予算を外す
--   2. 気分を外す
--   3. エリアを広げる（基準から近い順）
--   4. 前回出した候補（exclude_ids）も使う
--
-- security invoker なので spots の RLS（公開中だけ）がそのまま効く。

create function public.pick_candidates(
  origin_lat double precision,
  origin_lng double precision,
  has_car boolean,
  -- null なら「現在地の近く」（半径15km）
  municipality text default null,
  -- null なら「気にしない」。budget_yen が不明（null）のスポットは通す
  max_budget_yen integer default null,
  -- null か空なら「おまかせ」
  categories text[] default null,
  prefer_indoor boolean default false,
  exclude_ids uuid[] default '{}'
)
returns table (
  id uuid,
  name text,
  description text,
  category text,
  municipality text,
  lat double precision,
  lng double precision,
  distance_m double precision,
  is_indoor boolean,
  has_parking boolean,
  car_free_ok boolean,
  budget_yen integer,
  hours_note text,
  photo_url text,
  google_maps_url text,
  tags text[],
  relaxed boolean
)
language sql
volatile
security invoker
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(
      extensions.st_makepoint(pick_candidates.origin_lng, pick_candidates.origin_lat),
      4326
    )::extensions.geography as g
  ),
  pool as (
    select
      s.*,
      extensions.st_distance(s.location, o.g) as dist,
      (
        pick_candidates.max_budget_yen is null
        or s.budget_yen is null
        or s.budget_yen <= pick_candidates.max_budget_yen
      ) as budget_ok,
      (
        coalesce(cardinality(pick_candidates.categories), 0) = 0
        or s.category = any (pick_candidates.categories)
      ) as mood_ok,
      coalesce(
        case
          when pick_candidates.municipality is not null
            then s.municipality = pick_candidates.municipality
          else extensions.st_dwithin(s.location, o.g, 15000)
        end,
        false
      ) as area_ok,
      s.id = any (coalesce(pick_candidates.exclude_ids, '{}')) as excluded
    from public.spots s
    cross join origin o
    where s.is_published
      and (pick_candidates.has_car or s.car_free_ok is true)
  ),
  ranked as (
    select
      p.*,
      case
        when p.excluded then 4
        when p.area_ok and p.mood_ok and p.budget_ok then 0
        when p.area_ok and p.mood_ok then 1
        when p.area_ok then 2
        else 3
      end as relax_level
    from pool p
  )
  select
    r.id,
    r.name,
    r.description,
    r.category,
    r.municipality,
    extensions.st_y(r.location::extensions.geometry) as lat,
    extensions.st_x(r.location::extensions.geometry) as lng,
    r.dist as distance_m,
    r.is_indoor,
    r.has_parking,
    r.car_free_ok,
    r.budget_yen,
    r.hours_note,
    r.photo_url,
    r.google_maps_url,
    r.tags,
    r.relax_level > 0 as relaxed
  from ranked r
  order by
    r.relax_level,
    (pick_candidates.prefer_indoor and r.is_indoor) desc,
    (pick_candidates.has_car and r.has_parking is true) desc,
    -- エリアを広げたときは、気分・予算が合うもの → 近いもの
    r.mood_ok desc,
    r.budget_ok desc,
    case when r.relax_level = 3 then r.dist end,
    random()
  limit 3;
$$;

revoke all on function public.pick_candidates(
  double precision, double precision, boolean, text, integer, text[], boolean, uuid[]
) from public, anon, authenticated;

grant execute on function public.pick_candidates(
  double precision, double precision, boolean, text, integer, text[], boolean, uuid[]
) to anon, authenticated;
