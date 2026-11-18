# Design Review: Sui の UI/UX 見直し（ポップ化）

Reviewed against: DESIGN_BRIEF.md
Philosophy: 「ステッカー」— 砂浜の地に、海の青・夕日のオレンジ・紺のインク。太いふちとずらした影、丸いフォント、遊び心のある動き
Date: 2026-11-18

## Screenshots Captured

| Screenshot | Breakpoint | Description |
| --- | --- | --- |
| `screenshots/review-home-mobile-375.jpg` | Mobile (375×812) | ホーム（初回）：手書きロゴ＋診断カード |
| `screenshots/review-quiz-swipe-mobile-375.jpg` | Mobile (375×812) | 診断のスワイプカード（お財布の質問） |
| `screenshots/review-quiz-result-mobile-375.jpg` | Mobile (375×812) | 診断の結果（腹ペコ探検家＋候補） |
| `screenshots/review-picks-mobile-375.jpg` | Mobile (375×812) | 候補3つ（条件えらびから） |
| `screenshots/review-new-mobile-375.jpg` | Mobile (375×812) | 自分で条件を決める |
| `screenshots/review-vote-join-mobile-375.jpg` | Mobile (375×812) | 投票ページ：参加前の名前入力 |
| `screenshots/review-vote-step1-mobile-375.jpg` | Mobile (375×812) | 投票ページ：作った人・①友達に送る |
| `screenshots/review-vote-step3-desktop.jpg` | Pane width | 投票ページ：③決定する（主役が「ここに決定！」に） |
| `screenshots/review-decide-sheet-mobile-375.jpg` | Mobile (375×812) | 決定シート（いちばん人気を選択済み） |
| `screenshots/review-decided-mobile-375.jpg` | Mobile (375×812) | 決定画面 |
| `screenshots/review-home-desktop-1280.jpg` | Desktop (1280×800) | ホーム |
| `screenshots/review-quiz-result-desktop-1280.jpg` | Desktop (1280×800) | 診断の結果（候補の読み込み中） |

> All screenshots are in `.design/ui-refresh/screenshots/`. Tablet (768) はデスクトップと同じ問題（横に伸びる）なので省略。ダークモードは明るい表示に固定のため対象外。

## Summary

ブリーフの方向（ポップで遊び心、海・夕日・紺、丸いフォント、診断が主役、主役のボタンは1つ）は全画面で実現できている。いちばん大きな改善は投票ページで、作った人に「①送る ②待つ ③決定」が出て、主役のボタンが状態で切り替わるため「次に何をするか」が明確になった。最大の課題は**Web の広い画面で中身が横いっぱいに伸びる**こと。

## Must Fix

（なし）機能の不具合・アクセシビリティの失敗・ブリーフからの大きなずれは見つからなかった。

## Should Fix

1. **広い画面で中身が横いっぱいに伸びる**：ホーム・結果など、1280px ではボタンやカードが画面幅いっぱいになり、ステッカーの形が崩れて見える。See `screenshots/review-home-desktop-1280.jpg`, `screenshots/review-quiz-result-desktop-1280.jpg`. _Fix: 画面の中身を `max-w-[480px] w-full self-center` で包む（スマホの幅のまま中央に置く）。PC から投票する友達もいるので、Web では効果が大きい。_
2. **実機での確認がまだ**：スワイプの触り心地（傾き・はじく強さ・ばねの戻り）、振動、丸いフォントの読み込み（アプリ版）は、ブラウザでしか確かめていない。_Fix: Expo Go（iPhone）で、診断を3回ほど通しで試す。気になる値は `swipe-card.tsx` の `COMMIT_DISTANCE`（110）・`COMMIT_VELOCITY`（800）で調整。_
3. **写真がないカードの色面が大きい**：候補や結果のカードは、写真の代わりのカテゴリ色の面（高さ 112px）が並ぶので、同じカテゴリが続くと単調。See `screenshots/review-picks-mobile-375.jpg`. _Fix: 色面を 80px 程度に下げるか、スポットの写真を少しずつ足す。_

## Could Improve

1. **「予算？」のバッジの意味が分かりにくい**：予算が不明なときに「予算？」と出るが、意味が伝わりにくい。_Suggestion: 不明なときはバッジ自体を出さない。_
2. **条件えらびの「まず場所をえらんでね」**：押せないボタンの文字が淡く（2.65:1、押せない状態なので基準の対象外）、少し読みにくい。_Suggestion: ボタンの上に「場所をえらぶと出せるよ」と普通の色で書く。_
3. **結果画面のタイプのステッカー**：絵文字が小さめ。_Suggestion: 絵文字をもう一回り大きくして、タイプの印象を強める。_
4. **アイコンとスプラッシュの色**：アイコンは前の青緑のまま。新しいブランド色（海の青）に合わせるかは未決（ブリーフの未解決事項）。

## What Works Well

- **ステッカーの一貫性**：ボタン・カード・選択肢・シート・決定画面がすべて「紺の太いふち＋ずらした影」でそろい、どの画面を見ても Sui だと分かる。押すと影まで沈む動きが、触って楽しい。
- **主役が1つ**：ホーム（診断スタート）、結果・候補（この3つで友達に聞く）、投票（送る→決定）、決定（Googleマップで開く）と、どの画面も夕日のボタンが1つだけ。引き直し・シェアは文字のリンクに下がっている。
- **スワイプ診断**：Yes!/No! のスタンプがカードの向かう側に出て、下のボタン（左 No!・右 Yes!）とも向きがそろっている。ボタン・← → キー・読み上げの操作でも答えられる。
- **投票ページの進み具合**：「①送る ②待つ ③決定」と状態に合わせた一言で、作った人も参加者も、次にすることが分かる。
- **アクセシビリティ**：白い文字の青を濃くして 5.2:1、Web のキーボード移動で枠が出る、エラーは読み上げ、飾りのアイコンは読み上げない、視差効果を減らす設定ではフェードだけ。
