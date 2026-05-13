# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Sui（すい）は沖縄のスポット巡りをサポートするモバイルアプリ。React Native (Expo) + TypeScript で構築。

## Commands

```bash
# Start dev server
npm start          # or: npx expo start

# Platform-specific
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Lint
npm run lint       # expo lint (eslint-config-expo)
```

No test runner is configured yet.

## Architecture

### Routing (Expo Router / file-based)

- [app/_layout.tsx](app/_layout.tsx) — Root layout: wraps the app in React Navigation's `ThemeProvider`, defines the Stack (tabs + modal)
- [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) — Tab bar layout: two tabs (Home, Explore) with `HapticTab` and `IconSymbol`
- New screens go in `app/` (Stack) or `app/(tabs)/` (tab pages)

### Path Aliases

`@/*` maps to the repo root (configured in [tsconfig.json](tsconfig.json)). Use `@/components/...`, `@/hooks/...`, etc.

### Theming

- [constants/theme.ts](constants/theme.ts) — `Colors` object with `light` and `dark` variants
- [hooks/use-color-scheme.ts](hooks/use-color-scheme.ts) — Returns current color scheme; web variant at `use-color-scheme.web.ts`
- [components/themed-text.tsx](components/themed-text.tsx) and [components/themed-view.tsx](components/themed-view.tsx) — Theme-aware primitives; prefer these over raw `Text`/`View`

### Platform-specific files

Expo resolves `.ios.tsx` before `.tsx`. Example: [components/ui/icon-symbol.ios.tsx](components/ui/icon-symbol.ios.tsx) uses native SF Symbols on iOS; [components/ui/icon-symbol.tsx](components/ui/icon-symbol.tsx) is the fallback.

### Key config

- `app.json`: `newArchEnabled: true`, `typedRoutes: true`, `reactCompiler: true`
- Backend: Supabase (not yet wired in code as of initial commit)

---

# Sui — 基本設計ドキュメント

> 沖縄在住者のための、AI駆動スポット巡りアプリ  
> 最終更新: 2026-05-12（ブランディング追記・全セクション完了）

---

## 1. プロジェクト概要

### コンセプト
「地元なのに知らない沖縄がある」という課題を解決する、沖縄在住者向けの散策アプリ。
ユーザーの好み・気分・天気・時間帯・過去の訪問履歴を複合的に考慮し、AIが「今日の自分」に最適なスポットルートを提案する。

### ターゲットユーザー
- **メイン**: 沖縄在住者（20〜40代）。週末の行き先に悩む、友人・家族を案内したい、地元の良さを再発見したいユーザー
- **サブ**: 沖縄移住者・長期滞在者。まだ知らないエリアを探索したい

### 差別化ポイント
| 比較対象 | Suiの優位性 |
|---|---|
| 観光アプリ | 在住者目線。観光客向け王道スポットではなく地元民の日常に根ざした提案 |
| Google Maps | 単なる地図ではなく「今日どこ行こう」という意思決定をAIが丸ごとサポート |
| SNS | バズり情報ではなく、自分の好みと文脈に合った静かな発見体験 |

### 解決する課題
地元民には観光客向け情報が溢れているが、自分の好みに合った穴場・再発見スポットを見つける手段が乏しい。

---

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド | React Native + Expo | クロスプラットフォーム対応 |
| ルーティング | Expo Router | ファイルベースルーティング |
| バックエンド | Supabase | DB / 認証 / ストレージ / Edge Functions |
| データベース | PostgreSQL（Supabase） | リレーショナル設計 |
| AI | Claude API | ルート提案プロンプト処理 |
| 地図 | Mapbox（`@rnmapbox/maps`） | 無料枠50,000loads/月。デザイン自由度高 |
| 開発スタイル | AI駆動開発（Claude / Cursor） | 設計ドキュメント先行 |

### 技術選定の判断軸
- **コスト優先**: 初期フェーズは無料枠で収める
- **学習コスト**: Supabaseは経験あり。AWSは将来の移行先候補として把握
- Supabase無料枠の目安: DB 500MB / Storage 1GB / MAU 50,000 / Edge Functions 500,000回/月

---

## 3. 画面設計

### 3-1. 画面一覧

#### 起動フロー
| 画面名 | 主な要素 |
|---|---|
| スプラッシュ | ロゴ・アプリ名、初回/既存ユーザー分岐 |
| オンボーディング | 好みジャンル選択（複数可）、よく行くエリア選択、行動パターン（朝型/夜型など） |
| 認証（検討中） | ログイン/新規登録、ゲストスキップ（要検討）、SNSログイン（要検討） |

#### ホームタブ
| 画面名 | 主な要素 |
|---|---|
| ホーム | 今日のAIルート提案カード、気分・天気・時間入力UI、再提案ボタン、提案スポット一覧（3〜5件） |
| ルート詳細 | スポット順序表示、マップビュー（ルート線）、所要時間・移動手段、「出発する」ボタン |
| スポット詳細（共通） | 写真ギャラリー、スポット名・説明・タグ、地図・アクセス情報、「訪問済みにする」ボタン、シェアボタン |

#### 探すタブ
| 画面名 | 主な要素 |
|---|---|
| 探す | キーワード検索バー、ジャンル・エリアフィルター、マップ/リスト切替、おすすめタグ（穴場・新着など） |
| 検索結果一覧 | スポットカード一覧、ソート（近い順・人気順）、→スポット詳細へ遷移 |

#### 記録タブ
| 画面名 | 主な要素 |
|---|---|
| 記録（訪問履歴） | 訪問済みスポット一覧、訪問日・サムネイル表示、訪問数カウンター |
| 記録詳細 | 訪問日時、メモ・感想テキスト、投稿写真、スポット詳細へのリンク |
| 記録追加 | スポット選択（検索）、訪問日時ピッカー、メモ入力、写真アップロード |

#### マイページタブ
| 画面名 | 主な要素 |
|---|---|
| マイページ | アイコン・ニックネーム、訪問スポット数・統計、よく行くエリア表示、設定メニュー一覧 |
| プロフィール編集 | アイコン変更、ニックネーム編集 |
| 好み設定 | ジャンル・エリア再設定、行動パターン変更、通知設定 |

### 3-2. 画面遷移の設計方針
- ボトムナビゲーション: **ホーム・探す・記録・マイページ** の4タブ
- **スポット詳細はホーム・探すタブ双方から遷移する共通画面**
- ルートは都度AIがパーソナライズ生成する使い捨て設計（保存機能はMVPスコープ外）
- 記録はスポット単位で管理（ルート単位の保存は行わない）
- 認証方針は未確定。ゲスト利用を許可する場合は `/spots`・`/spots/:id` のみ認証不要で公開

---

## 4. API設計

ベースURL: Supabase プロジェクトURL + `/functions/v1`（Edge Functions）または Supabase REST API

### スポット

| メソッド | パス | 説明 | 利用画面 |
|---|---|---|---|
| GET | `/spots` | スポット一覧取得。`keyword`, `genre`, `area`, `sort` クエリ対応 | 探す・検索結果 |
| GET | `/spots/:id` | スポット詳細取得（写真・説明・位置情報） | スポット詳細（共通） |

### AIルート提案

| メソッド | パス | 説明 | 利用画面 |
|---|---|---|---|
| POST | `/routes/suggest` | AIルート生成。気分・天気・時間帯・ジャンル・エリアを渡す | ホーム |
| GET | `/routes/:id` | 生成済みルート詳細（スポット順序・所要時間） | ルート詳細 |

リクエストボディ例（`/routes/suggest`）:
```json
{
  "mood": "のんびり",
  "weather": "晴れ",
  "time_of_day": "午前",
  "genre_ids": ["nature", "cafe"],
  "area": "北谷"
}
```

### 訪問記録

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/visits` | ログインユーザーの訪問履歴一覧 | 要 |
| GET | `/visits/:id` | 訪問記録詳細（日時・メモ・写真） | 要 |
| POST | `/visits` | 訪問記録の新規作成 | 要 |
| PUT | `/visits/:id` | 訪問記録の編集 | 要 |
| DELETE | `/visits/:id` | 訪問記録の削除 | 要 |

### ユーザー / 設定

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/users/me` | 自分のプロフィール・統計情報取得 | 要 |
| PUT | `/users/me` | プロフィール更新（ニックネーム・アイコン） | 要 |
| GET | `/users/me/preferences` | 好み設定取得（ジャンル・エリア・行動パターン） | 要 |
| PUT | `/users/me/preferences` | 好み設定更新 | 要 |

---

## 5. システムアーキテクチャ

### 構成概要

```
[クライアント: React Native + Expo]
        ↓ REST / Realtime
[Supabase]
  ├── Auth（JWT認証）
  ├── PostgreSQL（スポット・記録DB）
  ├── Storage（写真・画像）
  └── Edge Functions（AI呼び出し処理）
        ↓                  ↓
[Claude API]        [Maps API]
 AIルート生成      Mapbox / Google Maps
```

### AIルート生成フロー詳細

1. **ユーザー入力** — 気分・天気・時間帯・エリアを選択（クライアント）
2. **`POST /routes/suggest`** — アプリ → Supabase Edge Functions
3. **Edge Function 処理**
   - DBからユーザーの好み・訪問履歴を取得
   - Claude API用プロンプトを組み立て（ユーザー情報 + 入力パラメータ + スポット候補リスト）
4. **Claude API** — スポットIDのリストを生成・返却
   - ※ スポット詳細テキストはClaudeに生成させず、DBのデータを正とする
5. **スポット詳細の解決** — IDでPostgreSQLをクエリ
6. **レスポンス** — ルートデータをアプリに返す

### 設計上の判断メモ
- `/routes/suggest` をPOSTにしている理由: AIへのリクエストはパラメータが多く、GETのクエリ文字列より構造化されたボディが適切
- Claudeに返させるのは「スポットIDのリスト」のみ。内容ブレを防ぎDBデータを正として扱う
- Edge Functions は月50万回まで無料のため、MVP段階はコスト不要
- Maps APIはMapbox推奨（無料枠: 月50,000リクエスト、デザイン自由度が高い）

---

## 6. DBテーブル設計

### 6-1. ERD概要

```
users ──< visits >── spots ──< spot_photos
  |                    |
  └── user_preferences └──< spot_genres >── genres
```

### 6-2. テーブル定義

#### users
Supabase Authの `auth.users` と連携。アプリ固有情報のみ保持。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | auth.users(id) を参照 |
| nickname | text | 表示名 |
| avatar_url | text | アイコン画像URL |
| created_at | timestamptz | 作成日時 |

#### user_preferences
ユーザーの好み設定。AIルート提案のパーソナライズに使用。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | users(id) |
| genre_ids | text[] | 好みジャンルのスラッグ配列 |
| area_ids | text[] | よく行くエリアID配列 |
| behavior_pattern | text | `morning` / `night` / `flexible` |
| updated_at | timestamptz | 更新日時 |

#### spots
スポットのマスターデータ。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | スポット名 |
| description | text | 説明文 |
| area | text NOT NULL | エリア名（例: 北谷、那覇） |
| latitude | float8 NOT NULL | 緯度 |
| longitude | float8 NOT NULL | 経度 |
| created_at | timestamptz | 作成日時 |

#### spot_photos
スポットの写真。Supabase Storageのパスを保持。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| spot_id | uuid FK | spots(id) |
| storage_path | text NOT NULL | Storageパス |
| order_index | smallint | 表示順 |

#### genres
スポットのジャンルマスター。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | 表示名（例: 自然、カフェ） |
| slug | text NOT NULL UNIQUE | 識別子（例: nature, cafe） |

#### spot_genres
スポットとジャンルの中間テーブル（多対多）。

| カラム | 型 | 説明 |
|---|---|---|
| spot_id | uuid FK | spots(id) |
| genre_id | uuid FK | genres(id) |

#### visits
ユーザーの訪問記録。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | users(id) |
| spot_id | uuid FK | spots(id) |
| visited_at | timestamptz NOT NULL | 訪問日時 |
| memo | text | メモ・感想 |
| photo_paths | text[] | 投稿写真のStorageパス配列 |

### 6-3. DDL（Supabase SQL Editor用）

```sql
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
create index spots_area_idx    on public.spots(area);
create index visits_user_id_idx on public.visits(user_id);
create index visits_spot_id_idx on public.visits(spot_id);

-- Row Level Security
alter table public.users             enable row level security;
alter table public.user_preferences  enable row level security;
alter table public.spots             enable row level security;
alter table public.visits            enable row level security;

create policy "users: own row" on public.users
  using (auth.uid() = id);

create policy "prefs: own" on public.user_preferences
  using (auth.uid() = user_id);

create policy "spots: public read" on public.spots
  for select using (true);

create policy "visits: own" on public.visits
  using (auth.uid() = user_id);
```

### 6-4. 設計上の判断メモ
- `users` は `auth.users` を参照するだけにしてアプリ固有情報を分離。Supabase Authとの二重管理を避ける
- `visits.photo_paths` は `text[]` に。写真はStorageパスを保存するだけなので別テーブル不要
- `spots` のRLSは `select` のみ全員許可。ゲスト利用の方針に関わらず変更不要
- Edge FunctionsからClaude APIへ渡すスポット候補リストは `spots` + `spot_genres` をJOINして生成する

---

## 7. 認証方針

### 7-1. ゲスト / ログイン済みの機能差分

| 機能 | ゲスト（未ログイン） | ログイン済み |
|---|---|---|
| スポット閲覧・検索 | 可 | 可 |
| AIルート提案 | 可（端末設定のみ反映） | 可（履歴・クラウド設定も反映） |
| 訪問記録 | 不可 | 可 |
| 好み設定の保存 | 端末ローカルのみ | クラウド保存 |
| マイページ | 不可 | 可 |

### 7-2. ログイン方法

| プロバイダー | 理由 |
|---|---|
| メール＋パスワード | Supabase Auth標準。設定のみで即使用可 |
| Google | 国内普及率高。設定難易度低・無料 |
| Apple | iOS App Store公開時に必須（ガイドライン要件） |
| LINE | 国内普及率ほぼ100%。沖縄ユーザー層に最適。無料 |

X（旧Twitter）は2023年のAPI有料化（$100/月〜）と仕様変更リスクが高いためMVPスコープ外。

### 7-3. ゲスト → ログイン移行フロー

1. ゲストとしてスポット閲覧・ルート提案を利用
2. 「訪問済みにする」など認証が必要な操作をタップ
3. ログイン促進モーダルを表示し、登録・ログインを案内
4. ログイン完了後、そのまま元の操作へ遷移

### 7-4. 設計上の判断メモ
- ゲスト中の好み設定は端末ローカル（AsyncStorage）に保存
- ログイン後に `user_preferences` テーブルへマージする実装を推奨
- Apple ログインは Apple Developer Program（年間$99）への登録が必要。App Store公開前に取得しておく
- LINE ログインは LINE Developers への登録で無料で利用可能。Supabase Auth の Custom OAuth として設定

---

## 8. Maps API選定

### 選定結果: Mapbox

| 項目 | 内容 |
|---|---|
| 採用 | Mapbox |
| 無料枠 | 月50,000 Mapロード（MVPフェーズは無料枠内に収まる見込み） |
| 超過時 | $0.50 / 1,000 loads |
| Expo対応 | `@rnmapbox/maps` ライブラリで対応 |

### 主な用途
- スポットのピン表示
- ルート詳細画面でのルート線描画
- 探すタブのマップビュー

### Google Mapsを選ばなかった理由
- スポット情報は独自DBで管理するためGoogle MapsのPOI精度が活きない
- デザインの自由度が低く、Suiのブランドカラーに合わせにくい
- $200クレジット方式はユーザー増時のコスト予測が立てにくい
- オフライン対応不可

---

## 9. スポット初期データ

### 方針
- MVP時点で20〜25件を手動キュレーションして投入
- 「地元民目線」の説明文がSuiの差別化ポイント。観光ガイド調にしない
- スプレッドシートで収集 → CSV → Supabase Table Editorでインポート

### ジャンル別目安件数

| ジャンル（slug） | 目安件数 |
|---|---|
| 自然・絶景（nature） | 4〜5件 |
| ビーチ・海（beach） | 3〜4件 |
| カフェ・飲食（cafe） | 4〜5件 |
| 歴史・文化（history） | 3〜4件 |
| 穴場・ローカル（local） | 4〜5件 |
| ドライブ途中（drive） | 2〜3件 |

### 収集シート項目

| カラム | 内容 |
|---|---|
| name | スポット名（例: 残波岬） |
| description | 地元目線の説明・おすすめポイント（2〜3文） |
| area | エリア名（例: 読谷、那覇、北谷） |
| latitude | 緯度（Google マップ右クリックで取得） |
| longitude | 経度（同上） |
| genre_slugs | nature / cafe / beach など（複数可、カンマ区切り） |
| photos | 写真ファイル名（後でStorageにアップ） |

### 投入手順
1. スプレッドシートに上記項目を列として作成
2. スポットを現地・Googleマップで調査しながら記入
3. CSV出力
4. Supabase Table Editor の Import 機能で `spots` テーブルへ一括投入
5. `spot_genres` の中間テーブルはインポート後にSQLで別途挿入

### descriptionの書き方指針
観光ガイド調ではなく、地元民が友人に教えるようなトーンで書く。

- NG: 「〇〇は沖縄を代表する絶景スポットです。」
- OK: 「観光客が帰る夕方以降が本番。地元の人はみんな知ってる夕日スポット。」

---

## 10. ブランディング

### 10-1. ブランドの核

| 項目 | 内容 |
|---|---|
| 核となる体験 | 「地元民だけが知っている」発見 |
| ブランドエッセンス | 沖縄の粋（いき）を、自分のペースで巡る |
| パーソナリティ | 物知りで落ち着いた、地元の友人 |
| 対象スポット | 自然・名店・穴場カフェ・文化——ジャンルを問わず「知る人ぞ知る」もの |
| 避けるもの | 観光ガイド感・インスタ映え訴求・騒がしさ |

### 10-2. アプリ名

**Sui（スイ）** — 「粋（いき）」として定義。短く覚えやすく、漢字でニュアンスが伝わる。  
英語圏では「Swee」と発音される想定。リリース前に再検討の余地あり。

### 10-3. カラーパレット

| 名前 | HEX | 用途 |
|---|---|---|
| 深海・夜の海 | `#1A3A3A` | メインカラー・テキスト |
| 沖縄のターコイズ | `#4ABFBF` | アクセント・CTAボタン |
| 白砂・オフホワイト | `#F5F0E8` | 背景 |
| 琉球の土 | `#C8A882` | サブアクセント |
| カード背景 | `#FFFFFF` | カード・UI面 |

### 10-4. ビジュアル方針

- 余白・静けさ・上質さを優先。自然派すぎない洗練感
- 緑・木の質感を前面に出した「エコ・クラフト系」は避ける
- ロゴは小文字・細ウェイト・余白重視。「粋」漢字をサブロゴとして使用可

### 10-5. トーン&マナー

**使うトーン**
- 「知る人だけが行く場所」
- 「地元に根づいた一軒」
- 「静かな発見がある」
- 「自分だけのルートで」
- 「何度来ても、まだある」

**使わないトーン**
- 「インスタ映えスポット！」
- 「必見・絶対行くべき」
- 「大自然を満喫」
- 「観光客に人気」
- 「〜が最高すぎる！」

### 10-6. スポット説明文の指針
地元民が友人に教えるトーンで、ジャンルを問わず統一する。

- NG（自然）: 「沖縄を代表する絶景スポットです。」
- OK（自然）: 「観光客が帰る夕方以降が本番。地元の人はみんな知ってる夕日スポット。」
- NG（名店）: 「地元で人気のおすすめ食堂です。」
- OK（名店）: 「看板も出ていないのに、昼には売り切れる。地元の常連だけが通う一軒。」

---

## 11. 未決定事項・今後の検討

| 項目 | 状況 | 優先度 |
|---|---|---|
| 認証方針 | 完了（セクション7参照） | — |
| Maps API選定（Mapbox vs Google Maps） | 完了（セクション8参照・Mapbox採用） | — |
| DBテーブル設計 | 完了（セクション6参照） | — |
| スポットデータの初期投入方法 | 完了（セクション9参照） | — |
| アプリ名・ブランディング再検討 | 完了（セクション10参照） | — |

---

## 12. 開発フェーズ

| フェーズ | 内容 | 状況 |
|---|---|---|
| 基本設計 | 画面設計・API設計・アーキテクチャ | ✅ 完了 |
| DBテーブル設計 | Supabaseスキーマ定義 | ✅ 完了 |
| 環境構築 | Expo + Supabase初期セットアップ | 未着手 |
| MVP実装 | コア機能の実装 | 未着手 |
| テスト・リリース | TestFlight / Expo Go での検証 | 未着手 |
