-- Sui: 権限（GRANT）と RLS
--
-- 新しいテーブルは自動では Data API に公開されない前提で、必要な権限だけを明示的に与える。
-- おでかけの作成・参加・候補の抽選・決定は security definer の RPC からだけ書き込むので、
-- outings / outing_candidates / outing_members にはクライアント向けの書き込み権限を与えない。

-- ---------------------------------------------------------------
-- 権限：いったん全部外してから、必要なものだけ
-- ---------------------------------------------------------------
revoke all on table
  public.spots,
  public.outings,
  public.outing_candidates,
  public.outing_members,
  public.votes,
  public.visit_feedback
from anon, authenticated;

grant select on table public.spots to anon, authenticated;

grant select on table
  public.outings,
  public.outing_candidates,
  public.outing_members
to authenticated;

grant select, insert, update on table
  public.votes,
  public.visit_feedback
to authenticated;

-- 管理用（インポートスクリプトなど）。service_role は RLS を通らない。
grant select, insert, update, delete on table
  public.spots,
  public.outings,
  public.outing_candidates,
  public.outing_members,
  public.votes,
  public.visit_feedback
to service_role;

-- ---------------------------------------------------------------
-- ポリシー用の関数（private スキーマ = API から呼べない）
-- RLS の再帰を避けるため security definer。中で必ず auth.uid() を見る。
-- ---------------------------------------------------------------
create function private.is_outing_member(target_outing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.outing_members m
    where m.outing_id = target_outing_id
      and m.user_id = (select auth.uid())
  );
$$;

create function private.is_outing_voting(target_outing_id uuid)
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
      and o.status = 'voting'
  );
$$;

revoke all on all functions in schema private from public, anon, authenticated;

-- ポリシーは呼び出したロールの権限で評価されるので、authenticated には実行権限が要る
grant usage on schema private to authenticated;
grant execute on function private.is_outing_member(uuid) to authenticated;
grant execute on function private.is_outing_voting(uuid) to authenticated;

-- service_role が outings に直接 insert するとき、共有コードの初期値の関数が要る
grant usage on schema private to service_role;
grant execute on function private.generate_share_code() to service_role;

-- ---------------------------------------------------------------
-- RLS を有効化
-- ---------------------------------------------------------------
alter table public.spots enable row level security;
alter table public.outings enable row level security;
alter table public.outing_candidates enable row level security;
alter table public.outing_members enable row level security;
alter table public.votes enable row level security;
alter table public.visit_feedback enable row level security;

-- ---------------------------------------------------------------
-- spots：公開中のものは誰でも読める
-- ---------------------------------------------------------------
create policy "spots_select_published"
  on public.spots for select
  to anon, authenticated
  using (is_published);

-- ---------------------------------------------------------------
-- 参加者だけ読める
-- ---------------------------------------------------------------
create policy "outings_select_member"
  on public.outings for select
  to authenticated
  using ((select private.is_outing_member(id)));

create policy "outing_candidates_select_member"
  on public.outing_candidates for select
  to authenticated
  using ((select private.is_outing_member(outing_id)));

create policy "outing_members_select_member"
  on public.outing_members for select
  to authenticated
  using ((select private.is_outing_member(outing_id)));

-- ---------------------------------------------------------------
-- votes：参加者は読める。投票中なら自分の票だけ作成・変更できる（削除は不可）
-- 参加者であることは outing_members への外部キーで保証する
-- ---------------------------------------------------------------
create policy "votes_select_member"
  on public.votes for select
  to authenticated
  using ((select private.is_outing_member(outing_id)));

create policy "votes_insert_own_while_voting"
  on public.votes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.is_outing_voting(outing_id))
  );

create policy "votes_update_own_while_voting"
  on public.votes for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_outing_voting(outing_id))
  )
  with check (
    user_id = (select auth.uid())
    and (select private.is_outing_voting(outing_id))
  );

-- ---------------------------------------------------------------
-- visit_feedback：参加者は読める。自分の回答だけ作成・変更できる
-- ---------------------------------------------------------------
create policy "visit_feedback_select_member"
  on public.visit_feedback for select
  to authenticated
  using ((select private.is_outing_member(outing_id)));

create policy "visit_feedback_insert_own"
  on public.visit_feedback for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "visit_feedback_update_own"
  on public.visit_feedback for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
