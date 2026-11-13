-- Sui: 3候補でおでかけを作る
--
-- おでかけ・候補3件・作成者の参加をまとめて作る。
-- outings / outing_candidates / outing_members にはクライアント向けの書き込み権限がないので、
-- security definer にする。public（= RPC として公開）に置くので anon からは実行させず、
-- 関数の中でも auth.uid() と入力を確かめる。

create function public.create_outing(
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

  -- 公開中で、重複しない3件か
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

  -- 共有コードがたまたま重なったら作り直す（50ビットなのでまず起きない）
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

revoke all on function public.create_outing(uuid[], text, jsonb) from public, anon, authenticated;
grant execute on function public.create_outing(uuid[], text, jsonb) to authenticated;
