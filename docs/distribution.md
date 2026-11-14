# Sui を友達に試してもらう（配布と検証の手順）

最終更新：2026-11-14

## 全体像

| 方法 | iPhone | Android | 必要なもの | おすすめ |
|---|---|---|---|---|
| **Web版**（リンクを開くだけ） | ✅ | ✅ | なし | ◎ まずはこれ |
| **Expo Go** | ⚠️ あなたと同じ Expo アカウントでのログインが必要 | ✅（同じ Wi-Fi、または `--tunnel`） | Mac で開発サーバーを動かし続ける | 身近な人と、その場で試すとき |
| **EAS の preview ビルド**（APK） | ❌ Apple Developer Program（有料）が必要 | ✅ | EAS のビルド（無料枠あり） | Android の友達に、アプリとして配るとき |

アプリを入れていなくても、Web版で参加・投票・決定・「実際に行った？」まで全部できます。
iPhone の友達には、今は Web版で試してもらうのが現実的です。

---

## 1. Web版（https://sui-okinawa.expo.app）

### 友達に渡すもの
- トップページ：`https://sui-okinawa.expo.app`
- おでかけの共有リンク：アプリやWebで「この3つで友達に聞く」を押すと出る `https://sui-okinawa.expo.app/o/<コード>`

### 更新して公開し直す
```bash
npm run deploy:web
```
- やっていること：`EXPO_PUBLIC_WEB_URL=https://sui-okinawa.expo.app` で `expo export -p web` → `eas deploy --prod`
- 公開先：EAS Hosting（プロジェクト `@yuyuyu235715/sui`）
- 公開の前に確かめること：
  - 型チェックと lint：`npx tsc --noEmit` / `npx expo lint`
  - 書き出した `dist/` に秘密キー（`.admin-secrets.local` の値）が入っていないこと
- 公開の履歴と取り消し：EAS のダッシュボード → Hosting → Deployments

### 共有リンクのドメイン
- 共有リンクの先頭は `EXPO_PUBLIC_WEB_URL` で決まる
  - `.env.local`（手元の開発サーバー・Expo Go）：`https://sui-okinawa.expo.app`
  - EAS の環境変数（preview / production のビルド）：同じ値を登録済み
  - `npm run deploy:web`：スクリプトの中で本番の URL に固定
- 同じ Wi-Fi の中だけで試したいときは、`.env.local` を `http://<MacのIP>:8081` に変えて開発サーバーを起動し直す

---

## 2. Expo Go で試してもらう

### 開発サーバーを動かす（Mac）
```bash
npx expo start
```
- ターミナルに QR コードが出る
- 友達が別のネットワークにいるときは、トンネル経由にする
  ```bash
  npx expo start --tunnel
  ```
- Mac とこのサーバーが動いている間しか使えない

### Android の友達
1. Google Play から「Expo Go」を入れる（最新版）
2. Expo Go の「Scan QR code」で、ターミナルの QR コードを読む

### iPhone の友達
- iPhone の Expo Go で開発サーバーのプロジェクトを開くには、**Expo CLI（あなたの Mac）と同じ Expo アカウント**で Expo Go にログインしている必要がある（Expo のドキュメントより）
- 自分のアカウントを人に貸すのはおすすめしないので、iPhone の友達には **Web版** を案内する
- 自分の iPhone で試すとき：`npx expo login` と Expo Go の両方で同じアカウントにログインしてから QR コードを読む（アカウントを変えたら、開発サーバーを起動し直す）

---

## 3. EAS の preview ビルドで配る（Android）

### 準備（済み）
- EAS プロジェクト：`@yuyuyu235715/sui`（`app.json` の `extra.eas.projectId`）
- Android のパッケージ名：`com.suiokinawa.app`（ストアに出したあとは変えられない）
- `eas.json` の `preview`：`distribution: internal`、`android.buildType: apk`、`environment: preview`
- EAS の環境変数（preview / production）に、アプリに入れる公開用の値を登録済み
  - `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `EXPO_PUBLIC_WEB_URL` / `EXPO_PUBLIC_TURNSTILE_SITE_KEY`
  - 確認：`npx eas-cli@latest env:list --environment preview`
  - 秘密キー（`SUPABASE_SECRET_KEY`）は **登録しない**（アプリに入ってしまうため）

### ビルドする
```bash
npx eas-cli@latest build --platform android --profile preview
```
- はじめてのときは、署名用のキー（keystore）を EAS に作ってもらうか聞かれるので「作る」を選ぶ
- ビルドは EAS のクラウドで行われ、数十分かかることがある（無料枠には月ごとの回数の上限がある）
- 終わると、インストール用のリンク（と QR コード）が出る

### 友達に入れてもらう
1. インストール用のリンクを LINE などで送る
2. Android で開いて APK をダウンロードし、「この提供元のアプリを許可」を求められたら許可する
3. 入れたあとは、新しいアイコンとスプラッシュ（青緑の地に白い「Sui」）で起動する

### 更新するとき
- もう一度 preview でビルドして、新しいリンクを送る
- （EAS Update による差分の配信は、まだ設定していない）

### iPhone 向けのビルドについて
- ad hoc 配布（端末の UDID を登録、年間100台まで）も TestFlight も、**Apple Developer Program（有料）への加入が必要**
- 加入したら、`eas.json` に iOS の設定を足して `--platform ios` でビルドできる

---

## 4. スポットのデータを入れ直す

```bash
npm run import-spots -- data/<ファイル名>.csv --dry-run   # チェックだけ
npm run import-spots -- data/<ファイル名>.csv             # 取り込む
```
- 列は `data/spots_template.csv` と同じ
- `(name, municipality)` が同じなら上書き。隠したいスポットは `is_published` を `false` にする
- 秘密キーは `.admin-secrets.local`（git に入らない。名前に env を含めない）

---

## 5. 検証の数字を見る

### 見る場所
Supabase のダッシュボード → **Table Editor** でスキーマを `analytics` に切り替える（または **SQL Editor** で `select * from analytics.summary;`）。
アプリ（API）からは読めない場所に置いてある。

| ビュー | 中身 |
|---|---|
| `analytics.summary` | 全体の数字（1行） |
| `analytics.weekly` | 週ごと（日本時間・月曜はじまり）の作成数・決定数・決定率・平均参加人数 |
| `analytics.outing_facts` | おでかけ1件ごとの参加人数・票数・回答数 |

### 数字の意味（`analytics.summary`）
| 列 | 意味 | MVP の目標 |
|---|---|---|
| `outings` | 作られたおでかけの数 | |
| `decided_pct` | 決定まで進んだ割合（%） | |
| `avg_members` | 1つのおでかけあたりの平均参加人数（作った人を含む） | |
| `went_pct_by_outing` | 「行った？」の回答があったおでかけのうち、1人でも「行った」と答えた割合（%） | **4割以上** |
| `went_pct_by_answer` | 回答のうち「行った」の割合（%） | |
| `answered_outing_pct` | 決定から3時間たったおでかけのうち、1人でも答えた割合（%）。低いと上の数字があてにならない | |
| `repeat_creator_pct` | おでかけを作った人のうち、2回以上作った人の割合（%） | **2割以上** |

注意：
- 人は「匿名ユーザーID」で数えている。同じ人でもスマホと Web、別の端末では別人になるので、`repeat_creator_pct` は少なめに出る
- おでかけは作ってから1年で自動削除されるので、それより前の数字は残らない

### 自分たちのテストを数字から外す
自分やテストで使ったユーザーIDを `analytics.excluded_users` に入れると、そのユーザーが作ったおでかけと回答が集計から外れる。
SQL Editor で、自分が使った表示名から探して入れるのが簡単：

```sql
-- 例：「たろう」として参加したユーザーを外す（名前は自分のものに変える）
insert into analytics.excluded_users (user_id, note)
select distinct user_id, '自分のテスト'
from public.outing_members
where display_name = 'たろう'
on conflict (user_id) do nothing;
```

---

## 6. 友達に渡す前のチェックリスト

- [ ] 問い合わせ先を `src/constants/legal.ts` の `CONTACT` に入れて、`npm run deploy:web`
- [ ] Supabase：Authentication → Sign In / Providers → **Email をオフ**（匿名ログインしか使わないため）
- [ ] 本物のスポットのデータを取り込む（今は実在する14件だけで、駐車場などは推測の値）
- [ ] 自分のテスト用ユーザーを `analytics.excluded_users` に入れる
- [ ] 無料の Supabase プロジェクトは、1週間使われないと一時停止する。間が空くときはダッシュボードで状態を確かめる

---

## 7. 本番用の Supabase プロジェクトを分けるか（2026-11 時点の判断）

**今は分けない。** 理由：
- 友達との試験運用で、規模が小さく、データも検証のための一時的なもの
- 分けると、マイグレーション・環境変数・CAPTCHA・Web公開を2組ずつ管理することになる
- 自分のテストのデータは `analytics.excluded_users` で集計から外せる

**分けるタイミング**（どれかに当てはまったら）：
- 友達が使っている最中に、スキーマを大きく変えたくなったとき（今は変更がそのまま本番に入る）
- 友達以外にも広く公開するとき
- 有料プランにして、プレビュー用のブランチ機能を使うとき
