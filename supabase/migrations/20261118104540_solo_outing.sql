-- Sui: ひとりモード（友達に聞かずに、自分で1つ選んですぐ決める）

alter table public.outings
  add column mode text not null default 'group' check (mode in ('group', 'solo'));

-- ---------------------------------------------------------------
-- ひとりで決める：候補3つを保存し、選んだ場所にすぐ決定する。参加者は自分だけ。
-- 作成数の上限（1時間10件）は、友達との create_outing と合わせて数える。
-- ---------------------------------------------------------------
create function public.create_solo_outing(
  spot_ids uuid[],
  chosen_spot_id uuid,
  conditions jsonb default '{}'
)
returns table (id uuid, share_code text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_conditions jsonb := coalesce(create_solo_outing.conditions, '{}'::jsonb);
  v_outing_id uuid;
  v_share_code text;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です' using errcode = '42501';
  end if;

  if coalesce(cardinality(create_solo_outing.spot_ids), 0) <> 3 then
    raise exception '候補は3つ必要です' using errcode = '22023';
  end if;

  if not (create_solo_outing.chosen_spot_id = any (create_solo_outing.spot_ids)) then
    raise exception '候補にない場所です' using errcode = '22023';
  end if;

  select count(distinct s.id)
    into v_count
    from public.spots s
   where s.id = any (create_solo_outing.spot_ids)
     and s.is_published;
  if v_count <> 3 then
    raise exception '候補のスポットが正しくありません' using errcode = '22023';
  end if;

  if jsonb_typeof(v_conditions) <> 'object' or pg_column_size(v_conditions) > 2000 then
    raise exception '条件の形が正しくありません' using errcode = '22023';
  end if;
  -- 現在地の座標は保存しない
  v_conditions := v_conditions - 'lat' - 'lng';

  select count(*)
    into v_count
    from public.outings o
   where o.created_by = v_user_id
     and o.created_at > now() - interval '1 hour';
  if v_count >= 10 then
    raise exception 'ちょっと作りすぎかも。少し時間をおいてね' using errcode = 'P0001';
  end if;

  for attempt in 1..5 loop
    begin
      insert into public.outings (created_by, conditions, mode)
      values (v_user_id, v_conditions, 'solo')
      returning outings.id, outings.share_code
        into v_outing_id, v_share_code;
      exit;
    exception when unique_violation then
      if attempt = 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.outing_candidates (outing_id, spot_id, position)
  select v_outing_id, t.spot_id, t.ord::smallint
    from unnest(create_solo_outing.spot_ids) with ordinality as t (spot_id, ord);

  insert into public.outing_members (outing_id, user_id, display_name)
  values (v_outing_id, v_user_id, 'わたし');

  -- 自分の票も入れておく（決定画面の「◯票」を自然に見せるため）
  insert into public.votes (outing_id, user_id, spot_id)
  values (v_outing_id, v_user_id, create_solo_outing.chosen_spot_id);

  update public.outings
     set status = 'decided',
         decided_spot_id = create_solo_outing.chosen_spot_id,
         decided_at = now()
   where outings.id = v_outing_id;

  return query select v_outing_id, v_share_code;
end;
$$;

revoke all on function public.create_solo_outing(uuid[], uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_solo_outing(uuid[], uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------
-- 検証の数字を、ひとりと友達で分けて見る
-- ---------------------------------------------------------------
create or replace view analytics.outing_facts as
select
  o.id,
  o.created_by,
  o.created_at,
  (o.created_at at time zone 'Asia/Tokyo') as created_at_jst,
  o.status,
  o.decided_at,
  (select count(*) from public.outing_members m where m.outing_id = o.id) as member_count,
  (select count(*) from public.votes v where v.outing_id = o.id) as vote_count,
  (select count(*) from public.visit_feedback f where f.outing_id = o.id) as feedback_count,
  (select count(*) from public.visit_feedback f where f.outing_id = o.id and f.went) as went_count,
  (o.decided_at is not null and o.decided_at <= now() - interval '3 hours') as feedback_open,
  o.mode
from public.outings o
where not exists (select 1 from analytics.excluded_users e where e.user_id = o.created_by);

create view analytics.summary_by_mode as
select
  mode,
  count(*) as outings,
  round(100.0 * count(*) filter (where status = 'decided') / nullif(count(*), 0), 1) as decided_pct,
  round(avg(member_count), 2) as avg_members,
  count(*) filter (where feedback_open) as asked_outings,
  round(
    100.0 * count(*) filter (where feedback_open and went_count > 0)
      / nullif(count(*) filter (where feedback_open and feedback_count > 0), 0),
    1
  ) as went_pct_by_outing
from analytics.outing_facts
group by mode;

comment on view analytics.summary_by_mode is 'ひとり（solo）と友達（group）ごとの作成数・決定率・平均参加人数・行った率';

revoke all on all tables in schema analytics from public, anon, authenticated;
