-- Sui: 共有コードでおでかけに参加する
--
-- outings を誰でも読める状態にせずに参加できるよう、security definer の関数にする。
-- public スキーマ（= RPC として公開）に置くので、anon からは実行できないようにし、
-- 関数の中でも auth.uid() を確かめる。匿名ログインのユーザーは authenticated ロールで呼べる。

create function public.join_outing(share_code text, display_name text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := btrim(coalesce(join_outing.display_name, ''));
  v_outing_id uuid;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です' using errcode = '42501';
  end if;

  if char_length(v_name) not between 1 and 20 then
    raise exception '名前は1〜20文字で入れてね' using errcode = '22023';
  end if;

  select o.id
    into v_outing_id
    from public.outings o
   where o.share_code = lower(btrim(coalesce(join_outing.share_code, '')));

  -- コードが違う理由は区別しない（存在の有無を探られないように）
  if v_outing_id is null then
    raise exception 'おでかけが見つかりません' using errcode = 'P0002';
  end if;

  -- 参加済みなら表示名だけ更新する
  insert into public.outing_members as m (outing_id, user_id, display_name)
  values (v_outing_id, v_user_id, v_name)
  on conflict (outing_id, user_id)
  do update set display_name = excluded.display_name;

  return v_outing_id;
end;
$$;

revoke all on function public.join_outing(text, text) from public, anon, authenticated;
grant execute on function public.join_outing(text, text) to authenticated;
