import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";

import { EASE_OUT } from "@/constants/motion";
import { openMaps } from "@/lib/maps";

import type { SpotSummary } from "./spot-card";

import { Button } from "./button";

const CATEGORY_BG: Record<string, string> = {
  food: "bg-orange-100",
  cafe: "bg-amber-100",
  play: "bg-violet-100",
  nature: "bg-emerald-100",
  view: "bg-sky-100",
};

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
      <View className="flex-row items-center gap-2 rounded-2xl bg-teal-50 p-4">
        <Text className="flex-1 text-sm text-teal-800">
          ありがとう！（{answer ? "行った" : "行かなかった"}）
        </Text>
        <Text
          className="text-sm font-semibold text-teal-700 underline"
          onPress={() => setEditing(true)}
          accessibilityRole="button"
        >
          変える
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl bg-white p-4">
      <Text className="text-base font-bold text-slate-900">実際に行った？</Text>
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
      {error ? <Text className="text-sm text-red-600">送れなかった。もう一回押してね</Text> : null}
    </View>
  );
}

type Props = {
  spot: SpotSummary;
  /** 決定した場所に入っていた票の名前 */
  voterNames: string[];
  feedback: FeedbackProps | null;
};

/** 決定画面：決まった場所を大きく出して、Googleマップに渡す */
export function DecidedView({ spot, voterNames, feedback }: Props) {
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
        <View className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {spot.photo_url ? (
            <Image
              source={{ uri: spot.photo_url }}
              style={{ width: "100%", aspectRatio: 4 / 3 }}
              contentFit="cover"
              transition={200}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View className={`aspect-[4/3] items-center justify-center ${CATEGORY_BG[spot.category] ?? "bg-teal-50"}`}>
              <Ionicons name="flag" size={56} color="#0d9488" />
            </View>
          )}
          <View className="gap-2 p-5">
            <Text className="text-sm font-bold text-teal-700">ここに決定！</Text>
            <Text className="text-3xl font-bold text-slate-900">{spot.name}</Text>
            <Text className="text-sm text-slate-500">{spot.municipality}</Text>
            {spot.description ? <Text className="text-sm leading-5 text-slate-600">{spot.description}</Text> : null}
            {voterNames.length > 0 ? (
              <Text className="text-xs text-slate-500">
                {voterNames.length}票（{voterNames.join("・")}）
              </Text>
            ) : null}
          </View>
        </View>
      </Animated.View>

      <Button label="Googleマップで開く" onPress={() => openMaps(spot)} />
    </View>
  );
}
