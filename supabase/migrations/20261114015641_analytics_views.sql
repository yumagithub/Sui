-- Sui: 検証用の数字（MVP で確かめたいこと）
--
-- API に公開しない analytics スキーマに置く。Supabase のダッシュボード
-- （Table Editor でスキーマ analytics を選ぶ、または SQL Editor）から見る。
-- anon / authenticated からは読めない。

create schema if not exists analytics;
revoke all on schema analytics from public, anon, authenticated;

-- 自分たちのテスト用ユーザーは集計から外す（ダッシュボードで user_id を足す）
create table analytics.excluded_users (
  user_id uuid primary key,
  note text,
  created_at timestamptz not null default now()
);
alter table analytics.excluded_users enable row level security;

-- ---------------------------------------------------------------
-- おでかけ1件ごとの事実（ほかのビューの元）
-- ---------------------------------------------------------------
create view analytics.outing_facts as
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
  -- 決定から3時間たって「実際に行った？」を聞ける状態か
  (o.decided_at is not null and o.decided_at <= now() - interval '3 hours') as feedback_open
from public.outings o
where not exists (select 1 from analytics.excluded_users e where e.user_id = o.created_by);

comment on view analytics.outing_facts is 'おでかけ1件ごとの参加人数・票数・回答数（テスト用ユーザーが作ったものは除く）';

-- ---------------------------------------------------------------
-- 週ごと（日本時間・月曜はじまり）
-- ---------------------------------------------------------------
create view analytics.weekly as
select
  date_trunc('week', created_at_jst)::date as week_start,
  count(*) as outings,
  count(*) filter (where status = 'decided') as decided,
  round(100.0 * count(*) filter (where status = 'decided') / nullif(count(*), 0), 1) as decided_pct,
  round(avg(member_count), 2) as avg_members
from analytics.outing_facts
group by 1
order by 1 desc;

comment on view analytics.weekly is '週ごとの作成数・決定数・決定率(%)・1件あたりの平均参加人数';

-- ---------------------------------------------------------------
-- 全体のまとめ（1行）
-- ---------------------------------------------------------------
create view analytics.summary as
with f as (
  select * from analytics.outing_facts
),
answers as (
  select vf.went
  from public.visit_feedback vf
  join f on f.id = vf.outing_id
  where not exists (select 1 from analytics.excluded_users e where e.user_id = vf.user_id)
),
creators as (
  select created_by, count(*) as n from f group by created_by
)
select
  (select count(*) from f) as outings,
  (select count(*) from f where status = 'decided') as decided,
  round(100.0 * (select count(*) from f where status = 'decided') / nullif((select count(*) from f), 0), 1)
    as decided_pct,
  (select round(avg(member_count), 2) from f) as avg_members,
  -- 「行った」率（回答ごと）
  (select count(*) from answers) as feedback_answers,
  round(100.0 * (select count(*) from answers where went) / nullif((select count(*) from answers), 0), 1)
    as went_pct_by_answer,
  -- 「行った」率（おでかけごと）：回答があったおでかけのうち、1人でも「行った」と答えたもの。MVP の目標（4割）はこれで見る
  (select count(*) from f where feedback_open) as asked_outings,
  round(
    100.0 * (select count(*) from f where feedback_open and went_count > 0)
      / nullif((select count(*) from f where feedback_open and feedback_count > 0), 0),
    1
  ) as went_pct_by_outing,
  -- 聞けるおでかけのうち、1人でも答えたものの割合
  round(
    100.0 * (select count(*) from f where feedback_open and feedback_count > 0)
      / nullif((select count(*) from f where feedback_open), 0),
    1
  ) as answered_outing_pct,
  -- 2回以上作った人の割合（匿名ユーザーID＝端末ごとに数えるので少なめに出る）。MVP の目標は2割
  (select count(*) from creators) as creators,
  round(100.0 * (select count(*) from creators where n >= 2) / nullif((select count(*) from creators), 0), 1)
    as repeat_creator_pct;

comment on view analytics.summary is '全体の数字：作成数・決定率・平均参加人数・行った率・2回以上作った人の割合';

-- API から見えないスキーマだが、念のため読めないことを明示する
revoke all on all tables in schema analytics from public, anon, authenticated;
