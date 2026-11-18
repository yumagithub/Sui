import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/text";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";

import { categoryOf } from "@/constants/categories";
import { COLORS } from "@/constants/colors";
import { EASE_OUT } from "@/constants/motion";
import { openMaps } from "@/lib/maps";

import type { SpotSummary } from "./spot-card";

import { Button } from "./button";
import { Sticker } from "./sticker";

type FeedbackProps = {
  answer: boolean | null | undefined;
  loading: boolean;
  error: boolean;
  onAnswer: (went: boolean) => void;
};

/** 「実際に行った？」（決定から3時間たってから出す） */
function FeedbackCard({ answer, loading, error, onAnswer }: FeedbackProps) {
  const [editing, setEditing] = useState(false);
  const answered = answer !== null && answer !== undefined && !editing;

  if (answered) {
    return (
      <View className="flex-row items-center gap-2 rounded-2xl border-2 border-ink bg-sea-tint p-4">
        <Text className="flex-1 text-sm font-bold text-ink">ありがとう！（{answer ? "行った" : "行かなかった"}）</Text>
        <Button label="変える" variant="quiet" onPress={() => setEditing(true)} />
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl border-2.5 border-ink bg-sun-tint p-4">
      <Text className="text-lg font-bold text-ink" accessibilityRole="header">
        実際に行った？
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            label="行った"
            onPress={() => {
              setEditing(false);
              onAnswer(true);
            }}
            loading={loading}
          />
        </View>
        <View className="flex-1">
          <Button
            label="行かなかった"
            variant="secondary"
            onPress={() => {
              setEditing(false);
              onAnswer(false);
            }}
            disabled={loading}
          />
        </View>
      </View>
      {error ? <Text className="text-sm font-bold text-coral-ink">送れなかった。もう一回押してね</Text> : null}
    </View>
  );
}

type Props = {
  spot: SpotSummary;
  /** 決定した場所に入っていた票の名前 */
  voterNames: string[];
  feedback: FeedbackProps | null;
  /** ひとりで決めたとき（票の表示を出さない） */
  solo?: boolean;
};

/** 決定画面：決まった場所を大きく出して、Googleマップに渡す */
export function DecidedView({ spot, voterNames, feedback, solo = false }: Props) {
  const reduceMotion = useReducedMotion();
  // めったに起きない「決まった！」の瞬間なので、少しだけ大きめに動かす（視差効果を減らす設定ならフェードだけ）
  const entering = useMemo(
    () => (reduceMotion ? FadeIn.duration(200) : FadeInDown.duration(300).easing(EASE_OUT)),
    [reduceMotion],
  );

  return (
    <View className="gap-4">
      {feedback ? <FeedbackCard {...feedback} /> : null}

      <Animated.View entering={entering}>
        <Sticker color={COLORS.white} radius={28} offset={6} tilt={-1.5}>
          {spot.photo_url ? (
            <Image
              source={{ uri: spot.photo_url }}
              style={{ width: "100%", aspectRatio: 4 / 3 }}
              contentFit="cover"
              transition={200}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View
              className={`aspect-[4/3] items-center justify-center border-b-2.5 border-ink ${categoryOf(spot.category).bg}`}
            >
              <Ionicons name={categoryOf(spot.category).icon} size={56} color={categoryOf(spot.category).fg} />
            </View>
          )}
          <View className="gap-2 p-5">
            <Text className="self-start rounded-full border-2 border-ink bg-sun px-3 py-0.5 text-sm font-bold text-ink">
              {solo ? "今日はここに行く！" : "ここに決定！"}
            </Text>
            <Text className="text-[32px] font-bold leading-[42px] text-ink" accessibilityRole="header">
              {spot.name}
            </Text>
            <Text className="text-sm text-ink-soft">{spot.municipality}</Text>
            {spot.description ? <Text className="text-sm leading-5 text-ink-soft">{spot.description}</Text> : null}
            {!solo && voterNames.length > 0 ? (
              <Text className="text-xs text-ink-soft">
                {voterNames.length}票（{voterNames.join("・")}）
              </Text>
            ) : null}
          </View>
        </Sticker>
      </Animated.View>

      <Button label="Googleマップで開く" onPress={() => openMaps(spot)} />
      {solo && !feedback ? (
        <Text className="text-center text-xs text-ink-soft">
          あとで「実際に行った？」を聞くね
        </Text>
      ) : null}
    </View>
  );
}
