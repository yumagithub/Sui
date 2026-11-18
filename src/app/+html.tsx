import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Web 版の HTML の外枠（アプリには関係しない）。
// タイトルとリンクのプレビュー（OGP）は、ページごとの generateMetadata（src/lib/metadata.ts）で入れる。

export default function Root({ children }: PropsWithChildren) {
  // SDK 58 では、JS・CSS の読み込みタグは headNodes / bodyNodes で渡される。
  // ここで出さないとページが動かない（見た目だけ出て、タップしても反応しない）。
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    <html lang="ja" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#FFF6E8" />
        {/* 丸いフォント。Google Fonts は使う文字の分だけ読み込むので、アプリに同梱するより軽い */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;800&display=swap"
        />
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
