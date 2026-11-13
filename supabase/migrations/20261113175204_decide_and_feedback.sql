-- Sui: 投票の締めくくり（決定）と「実際に行った？」

-- ---------------------------------------------------------------
-- 決定した時刻（「決定から3時間たったら聞く」に使う）
-- ---------------------------------------------------------------
alter table public.outings add column decided_at timestamptz;

alter table public.outings
  add constraint outings_decided_at_consistency check (
    (status = 'decided') = (decided_at is not null)
  );

-- ---------------------------------------------------------------
-- スポットの緯度・経度（Googleマップの URL を作るため。位置から自動で計算する）
-- ---------------------------------------------------------------
alter table public.spots
  add column lat double precision
    generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision
    generated always as (extensions.st_x(location::extensions.geometry)) stored;

-- ---------------------------------------------------------------
-- 決定する（作った人だけ・投票中だけ・候補の中からだけ。取り消しはできない）
-- outings にはクライアント向けの書き込み権限がないので security definer にする。
-- ---------------------------------------------------------------
create function public.decide_outing(share_code text, spot_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_outing_id uuid;
  v_created_by uuid;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です' using errcode = '42501';
  end if;

  select o.id, o.created_by, o.status
    into v_outing_id, v_created_by, v_status
    from public.outings o
   where o.share_code = lower(btrim(coalesce(decide_outing.share_code, '')))
   for update;

  if v_outing_id is null then
    raise exception 'おでかけが見つかりません' using errcode = 'P0002';
  end if;
  if v_created_by <> v_user_id then
    raise exception '決められるのは作った人だけです' using errcode = '42501';
  end if;
  if v_status <> 'voting' then
    raise exception 'もう決まっています' using errcode = '22023';
  end if;
  if not exists (
    select 1
      from public.outing_candidates c
     where c.outing_id = v_outing_id
       and c.spot_id = decide_outing.spot_id
  ) then
    raise exception '候補にない場所です' using errcode = '22023';
  end if;

  update public.outings
     set status = 'decided',
         decided_spot_id = decide_outing.spot_id,
         decided_at = now()
   where id = v_outing_id;
end;
$$;

revoke all on function public.decide_outing(text, uuid) from public, anon, authenticated;
grant execute on function public.decide_outing(text, uuid) to authenticated;

-- ---------------------------------------------------------------
-- 決定を全員の画面にリアルタイムで届ける（outings の SELECT ポリシー＝参加者だけに届く）
-- ---------------------------------------------------------------
alter publication supabase_realtime add table public.outings;

-- ---------------------------------------------------------------
-- 「実際に行った？」は、決定から3時間たってからだけ答えられる（検証のデータをぶらさないため）
-- ---------------------------------------------------------------
create function private.can_answer_feedback(target_outing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.outings o
     where o.id = target_outing_id
       and o.status = 'decided'
       and o.decided_at <= now() - interval '3 hours'
  );
$$;

revoke all on function private.can_answer_feedback(uuid) from public, anon, authenticated;
grant execute on function private.can_answer_feedback(uuid) to authenticated;

drop policy "visit_feedback_insert_own" on public.visit_feedback;
drop policy "visit_feedback_update_own" on public.visit_feedback;

create policy "visit_feedback_insert_own_after_decided"
  on public.visit_feedback for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.can_answer_feedback(outing_id))
  );

create policy "visit_feedback_update_own_after_decided"
  on public.visit_feedback for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.can_answer_feedback(outing_id))
  )
  with check (
    user_id = (select auth.uid())
    and (select private.can_answer_feedback(outing_id))
  );
