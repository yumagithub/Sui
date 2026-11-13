import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useMemo, type ComponentProps } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, useReducedMotion } from "react-native-reanimated";

import { CARD_ENTER_MS, CARD_EXIT_MS, CARD_STAGGER_MS, EASE_OUT } from "@/constants/motion";
import type { Database } from "@/lib/database.types";

export type Candidate = Database["public"]["Functions"]["pick_candidates"]["Returns"][number];

type IconName = ComponentProps<typeof Ionicons>["name"];

const CATEGORY: Record<string, { label: string; icon: IconName; bg: string; fg: string }> = {
  food: { label: "ごはん", icon: "restaurant", bg: "bg-orange-100", fg: "#ea580c" },
  cafe: { label: "カフェ", icon: "cafe", bg: "bg-amber-100", fg: "#b45309" },
  play: { label: "遊ぶ", icon: "game-controller", bg: "bg-violet-100", fg: "#7c3aed" },
  nature: { label: "自然", icon: "leaf", bg: "bg-emerald-100", fg: "#059669" },
  view: { label: "景色", icon: "image", bg: "bg-sky-100", fg: "#0284c7" },
};

function budgetLabel(yen: number | null) {
  if (yen === null) return "予算？";
  if (yen === 0) return "無料";
  return `${yen.toLocaleString("ja-JP")}円くらい`;
}

function distanceLabel(m: number) {
  return m < 1000 ? `${Math.round(m / 100) * 100}m` : `${(m / 1000).toFixed(1)}km`;
}

function Badge({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
      <Ionicons name={icon} size={13} color="#475569" />
      <Text className="text-xs font-medium text-slate-600">{label}</Text>
    </View>
  );
}

type Props = {
  spot: Candidate;
  index: number;
  showDistance: boolean;
};

export function SpotCard({ spot, index, showDistance }: Props) {
  const reduceMotion = useReducedMotion();
  const category = CATEGORY[spot.category] ?? CATEGORY.play;

  // 下から少しだけ浮かび上がる。視差効果を減らす設定ならフェードだけ。
  // ※ 自作の Keyframe は Web でキーフレームが入らず表示されないことがあったので、組み込みのものを使う
  const entering = useMemo(
    () =>
      reduceMotion
        ? FadeIn.duration(200)
        : FadeInDown.duration(CARD_ENTER_MS).delay(index * CARD_STAGGER_MS).easing(EASE_OUT),
    [index, reduceMotion],
  );

  return (
    <Animated.View entering={entering} exiting={FadeOut.duration(CARD_EXIT_MS)}>
      <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {spot.photo_url ? (
          <Image
            source={{ uri: spot.photo_url }}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
            contentFit="cover"
            transition={150}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className={`aspect-video items-center justify-center ${category.bg}`}>
            <Ionicons name={category.icon} size={40} color={category.fg} />
          </View>
        )}

        <View className="gap-2 p-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold text-teal-700">{category.label}</Text>
            <Text className="text-xs text-slate-400">{spot.municipality}</Text>
            {spot.relaxed ? (
              <Text className="ml-auto text-xs text-amber-600">条件ゆるめ</Text>
            ) : null}
          </View>

          <Text className="text-lg font-bold text-slate-900" numberOfLines={2}>
            {spot.name}
          </Text>

          {spot.description ? (
            <Text className="text-sm leading-5 text-slate-600" numberOfLines={3}>
              {spot.description}
            </Text>
          ) : null}

          <View className="mt-1 flex-row flex-wrap gap-1.5">
            <Badge icon="wallet-outline" label={budgetLabel(spot.budget_yen)} />
            {spot.has_parking ? <Badge icon="car-outline" label="駐車場" /> : null}
            {spot.is_indoor ? <Badge icon="umbrella-outline" label="屋内" /> : null}
            {spot.car_free_ok ? <Badge icon="bus-outline" label="車なしOK" /> : null}
            {showDistance ? <Badge icon="navigate-outline" label={distanceLabel(spot.distance_m)} /> : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
