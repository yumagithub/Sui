-- Sui: 友達に渡す前の仕上げ（位置情報・いたずら対策・保存期間）

-- ---------------------------------------------------------------
-- 1. 現在地の座標は保存しない（プライバシーポリシー：位置情報は候補の抽選にだけ使う）
--    すでに保存されたものから消す
-- ---------------------------------------------------------------
update public.outings
   set conditions = conditions - 'lat' - 'lng'
 where conditions ? 'lat' or conditions ? 'lng';

-- ---------------------------------------------------------------
-- 2. create_outing：座標を受け取っても捨てる＋1時間に10件まで（いたずら対策）
-- ---------------------------------------------------------------
create or replace function public.create_outing(
  spot_ids uuid[],
  display_name text,
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
  v_name text := btrim(coalesce(create_outing.display_name, ''));
  v_conditions jsonb := coalesce(create_outing.conditions, '{}'::jsonb);
  v_outing_id uuid;
  v_share_code text;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です' using errcode = '42501';
  end if;

  if char_length(v_name) not between 1 and 20 then
    raise exception '名前は1〜20文字で入れてね' using errcode = '22023';
  end if;

  if coalesce(cardinality(create_outing.spot_ids), 0) <> 3 then
    raise exception '候補は3つ必要です' using errcode = '22023';
  end if;

  select count(distinct s.id)
    into v_count
    from public.spots s
   where s.id = any (create_outing.spot_ids)
     and s.is_published;
  if v_count <> 3 then
    raise exception '候補のスポットが正しくありません' using errcode = '22023';
  end if;

  if jsonb_typeof(v_conditions) <> 'object' or pg_column_size(v_conditions) > 2000 then
    raise exception '条件の形が正しくありません' using errcode = '22023';
  end if;
  v_conditions := v_conditions - 'lat' - 'lng';

  -- 同じ人が短い時間にたくさん作れないようにする
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
      insert into public.outings (created_by, conditions)
      values (v_user_id, v_conditions)
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
    from unnest(create_outing.spot_ids) with ordinality as t (spot_id, ord);

  insert into public.outing_members (outing_id, user_id, display_name)
  values (v_outing_id, v_user_id, v_name);

  return query select v_outing_id, v_share_code;
end;
$$;

-- create or replace では権限が引き継がれるが、念のため明示する
revoke all on function public.create_outing(uuid[], text, jsonb) from public, anon, authenticated;
grant execute on function public.create_outing(uuid[], text, jsonb) to authenticated;

-- 作った人ごとの件数を数えるので、作成日時を含む索引にする
drop index if exists public.outings_created_by_idx;
create index outings_created_by_created_at_idx on public.outings (created_by, created_at);

-- ---------------------------------------------------------------
-- 3. 保存期間：おでかけは作ってから1年で消す（候補・参加者・票・回答もいっしょに消える）
-- ---------------------------------------------------------------
create extension if not exists pg_cron;

select cron.schedule(
  'sui-delete-old-outings',
  '15 18 * * *', -- 毎日 3:15（日本時間）
  $$delete from public.outings where created_at < now() - interval '1 year'$$
);
