import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** スポットのカテゴリごとの名前・アイコン・色（写真がないときの代わりにも使う） */
export const CATEGORY: Record<string, { label: string; icon: IconName; bg: string; fg: string }> = {
  food: { label: "ごはん", icon: "restaurant", bg: "bg-orange-100", fg: "#ea580c" },
  cafe: { label: "カフェ", icon: "cafe", bg: "bg-amber-100", fg: "#b45309" },
  play: { label: "遊ぶ", icon: "game-controller", bg: "bg-violet-100", fg: "#7c3aed" },
  nature: { label: "自然", icon: "leaf", bg: "bg-emerald-100", fg: "#059669" },
  view: { label: "景色", icon: "image", bg: "bg-sky-100", fg: "#0284c7" },
};

export function categoryOf(category: string) {
  return CATEGORY[category] ?? CATEGORY.play;
}
