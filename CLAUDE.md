# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Sui（すい）は沖縄在住者向けの AI 駆動スポット巡りアプリ。React Native (Expo) + TypeScript + Supabase で構築。

## Commands

```bash
npm start          # Expo dev server（Expo Go で確認）
npm run ios        # iOS シミュレーター
npm run android    # Android エミュレーター
npm run lint       # eslint-config-expo

# Supabase Edge Function のデプロイ
npx supabase functions deploy suggest-route

# DB マイグレーション適用（Supabase CLI v2.51.0）
npx supabase db push
```

No test runner is configured.

## Architecture

### Routing

Expo Router のファイルベースルーティング。

```
app/
  index.tsx          # 初回起動判定 → /onboarding or /(tabs)
  _layout.tsx        # Root Stack + AuthProvider + deep link handler
  onboarding.tsx     # スライド3枚 → ジャンル選択 → /auth
  auth.tsx           # メール/パスワード認証 + ゲストスキップ
  (tabs)/
    _layout.tsx      # 4タブ: ホーム・探す・記録・マイページ
    index.tsx        # ホーム（AI ルート提案）
    search.tsx       # スポット検索
    record.tsx       # 訪問履歴
    mypage.tsx       # マイページ・ジャンル設定
  spot/[id].tsx      # スポット詳細（ホーム・探すから遷移する共通画面）
```

新しい Stack 画面は `app/` に、タブ画面は `app/(tabs)/` に追加する。`app/_layout.tsx` の `<Stack>` への登録も忘れずに。

### Auth Flow

`contexts/auth.tsx` の `AuthProvider` が session を管理。`useAuth()` で `{ user, session, loading, signOut }` を取得。

- **ゲスト**: `user === null`。スポット閲覧・AI 提案は可能。訪問記録は不可（→ `/auth` に誘導）
- **ログイン済み**: Supabase Auth の JWT セッションを `expo-secure-store` に永続化
- **セッション永続化**: `services/supabase.ts` で 2000 バイトごとにチャンク分割する `SecureStoreAdapter` を使用（`expo-secure-store` の上限対策）
- **メール確認リンク**: `sui://` ディープリンクで受け取り `_layout.tsx` で `supabase.auth.setSession()` を呼ぶ

### Supabase

```ts
// services/supabase.ts
import { supabase } from '@/services/supabase';

// スポット一覧（genres JOIN）
supabase.from('spots').select('*, spot_genres(genres(slug, name))')

// 訪問記録（spots JOIN）
supabase.from('visits').select('id, spot_id, visited_at, memo, spots(name, area)')
  .eq('user_id', user.id)
```

RLS: `spots` は全員 SELECT 可。`visits` / `users` / `user_preferences` は本人のみ。

### AI ルート提案

`supabase functions invoke('suggest-route')` → `supabase/functions/suggest-route/index.ts`（Deno）。

フロー: DB からスポット候補取得 → Gemini API (`gemini-flash-latest`) に日本語プロンプト送信 → `{"spot_ids": [...]}` を受け取り → ID でスポット詳細を再クエリ → 返却。

- Gemini API キーは `X-goog-api-key` ヘッダーで渡す（`?key=` クエリパラメータは動作しない）
- Edge Function は Deno runtime のため `tsconfig.json` の `exclude` に `supabase/functions` を指定済み
- `// @ts-nocheck` が Edge Function ファイルの先頭に必要

### Hooks

| Hook | 役割 |
|---|---|
| `useAuth()` | セッション・ユーザー情報 |
| `useSpots(genreSlug, keyword)` | スポット一覧取得（ジャンル・キーワードフィルター） |
| `useVisits()` | 訪問履歴の fetch / addVisit / deleteVisit |
| `useRouteSuggestion()` | AI ルート提案。呼び出し時に `sui_genre_prefs` を自動読み込み |

### SecureStore Keys

| キー | 内容 |
|---|---|
| `sui_onboarding_done` | `"true"` で初回起動スキップ |
| `sui_genre_prefs` | ジャンル slug の JSON 配列 `["nature","beach"]` |

### Theming

- `constants/theme.ts` — `Brand`（固定カラー）と `Colors`（`light`/`dark` 両対応）をエクスポート
- `useColorScheme()` でカラースキームを取得し `Colors[colorScheme ?? 'light']` で色を参照
- `ThemedText` / `ThemedView` を `Text` / `View` の代わりに使う

### Path Aliases

`@/*` → リポジトリルート（`tsconfig.json` で設定）。

### Platform-specific files

Expo は `.ios.tsx` を `.tsx` より優先解決する。`components/ui/icon-symbol.ios.tsx` が SF Symbols、`icon-symbol.tsx` が Android/Web フォールバック。

## DB Schema

```
users ──< visits >── spots ──< spot_photos
  |                    |
  └── user_preferences └──< spot_genres >── genres
```

マイグレーションは `supabase/migrations/` に格納。`auth.users` への insert トリガーで `public.users` を自動作成。

## Branding Constraints

スポット説明文・UI コピーは「地元民が友人に教えるトーン」で統一する。

- NG: 「沖縄を代表する絶景スポットです」「必見・絶対行くべき」
- OK: 「観光客が帰る夕方以降が本番。地元の人はみんな知ってる夕日スポット」

## Development Note

マイページ下部の「🛠 初回状態にリセット（開発用）」ボタンで `sui_onboarding_done` と `sui_genre_prefs` をクリアしてオンボーディングを再確認できる。
