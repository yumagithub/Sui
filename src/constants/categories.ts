import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** スポットのカテゴリごとの名前・アイコン・色（写真がないときの代わりにも使う） */
export const CATEGORY: Record<string, { label: string; icon: IconName; bg: string; fg: string }> = {
  food: { label: "ごはん", icon: "restaurant", bg: "bg-[#FFD9C2]", fg: "#B4410C" },
  cafe: { label: "カフェ", icon: "cafe", bg: "bg-[#FFE9A8]", fg: "#8A5A00" },
  play: { label: "遊ぶ", icon: "game-controller", bg: "bg-[#E4DBFF]", fg: "#5B3CC4" },
  nature: { label: "自然", icon: "leaf", bg: "bg-[#C9F2DA]", fg: "#17734A" },
  view: { label: "景色", icon: "sunny", bg: "bg-[#C6E9FF]", fg: "#0C6FBF" },
};

export function categoryOf(category: string) {
  return CATEGORY[category] ?? CATEGORY.play;
}
