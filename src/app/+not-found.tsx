import { router } from "expo-router";

import { Problem } from "@/components/state-view";

export default function NotFound() {
  return (
    <Problem
      title="ページが見つからないみたい"
      message="リンクがまちがっているかも。もう一回確かめてね"
      actionLabel="ホームへ"
      onAction={() => router.replace("/")}
    />
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
