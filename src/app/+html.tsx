import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Web 版の HTML の外枠（アプリには関係しない）。
// LINE などにリンクを貼ったときのプレビュー（タイトル・説明）をここで決める。
const TITLE = "Sui｜どこ行く？投票しよう";
const DESCRIPTION = "友達と行き先を3つの候補から投票で決めよう。リンクを開いて、なまえを入れるだけ。";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Sui" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:locale" content="ja_JP" />
        <meta name="twitter:card" content="summary" />
        <meta name="theme-color" content="#0d9488" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
