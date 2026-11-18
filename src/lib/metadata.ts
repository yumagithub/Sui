// Web 版のタイトルとリンクのプレビュー（OGP）。
// Expo Router（SDK 58）は、ページのファイルが export する generateMetadata をサーバー側描画で <head> に入れる。
// レイアウトには効かないので、ページごとに `export { generateMetadata } from "@/lib/metadata";` を書く。

type Metadata = {
  title?: string;
  description?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    locale?: string;
    type?: string;
    images?: string | string[];
  };
  twitter?: { card?: "summary" | "summary_large_image"; title?: string; description?: string };
};

export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://sui-okinawa.expo.app").replace(/\/$/, "");

const TITLE = "Sui｜どこ行く？投票しよう";
const DESCRIPTION = "友達と行き先を3つの候補から投票で決めよう。リンクを開いて、なまえを入れるだけ。";

export function buildMetadata(overrides: { title?: string; description?: string; image?: string; url?: string } = {}): Metadata {
  const title = overrides.title ?? TITLE;
  const description = overrides.description ?? DESCRIPTION;
  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "Sui",
      locale: "ja_JP",
      title,
      description,
      ...(overrides.url ? { url: overrides.url } : {}),
      ...(overrides.image ? { images: overrides.image } : {}),
    },
    twitter: { card: overrides.image ? "summary_large_image" : "summary", title, description },
  };
}

/** ふつうのページのタイトルとプレビュー */
export function generateMetadata(): Metadata {
  return buildMetadata();
}
