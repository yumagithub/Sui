import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/text";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AskFriendsButton } from "@/components/ask-friends";
import { Button } from "@/components/button";
import { GoSoloButton } from "@/components/go-solo";
import { PressableScale } from "@/components/pressable-scale";
import { SpotCard } from "@/components/spot-card";
import { Sticker } from "@/components/sticker";
import { Loading, Problem } from "@/components/state-view";
import { EASE_OUT } from "@/constants/motion";
import { fromParams } from "@/lib/conditions";
import { usePicks } from "@/lib/picks";
import { isQuizTypeId, QUIZ_TYPES } from "@/lib/quiz";
import { quizTypeUrl, shareLink } from "@/lib/share";

export default function QuizResult() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- params は描画ごとに新しいオブジェクトになるので文字列で比べる
  const conditions = useMemo(() => fromParams(params), [paramsKey]);
  const typeParam = typeof params.type === "string" ? params.type : undefined;
  const type = isQuizTypeId(typeParam) ? QUIZ_TYPES[typeParam] : null;
  // ひとりモード：3つから1つをタップして、そのまま決める
  const solo = params.mode === "solo";
  const [chosenId, setChosenId] = useState<string | undefined>(undefined);

  const { query: picks, excludeIds, redraw: redrawPicks } = usePicks(conditions, paramsKey);
  const redraw = () => {
    setChosenId(undefined);
    redrawPicks();
  };
  const reduceMotion = useReducedMotion();

  // 結果の発表は「ここぞ」の場面なので、少しだけ大きめに動かす＋スマホは1回だけ振動
  const reveal = useMemo(
    () => (reduceMotion ? FadeIn.duration(200) : FadeInDown.duration(300).easing(EASE_OUT)),
    [reduceMotion],
  );
  useEffect(() => {
    if (type && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [type]);

  const [shareNote, setShareNote] = useState<string | null>(null);

  if (!conditions || !type) {
    return (
      <Problem
        title="結果がわからなかった"
        message="もう一回診断してみてね"
        actionLabel="診断する"
        onAction={() => router.replace("/quiz")}
      />
    );
  }

  const spots = picks.data ?? [];

  async function shareResult() {
    if (!type) return;
    try {
      const result = await shareLink(
        `今日のわたしは${type.emoji}${type.name}！ あなたは何タイプ？`,
        quizTypeUrl(type.id),
      );
      if (result === "copied") {
        setShareNote("リンクをコピーしたよ");
        setTimeout(() => setShareNote(null), 3000);
      }
    } catch {
      setShareNote(`このリンクを送ってね：${quizTypeUrl(type.id)}`);
    }
  }

  return (
    <View className="flex-1 bg-sand">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-4 px-5 pb-8 pt-4">
        {/* タイプの発表：少し傾けたステッカー。1枚目の候補が最初の画面に見えるよう小さめに */}
        <Animated.View entering={reveal}>
          <Sticker color={type.color} radius={24} offset={5} tilt={-2}>
            <View className="flex-row items-center gap-4 px-5 py-4">
              <Text className="text-5xl" accessibilityElementsHidden importantForAccessibility="no">
                {type.emoji}
              </Text>
              <View className="flex-1 gap-0.5">
                <Text className="text-[13px] font-bold text-ink-soft">今日のあなたは…</Text>
                <Text className="text-[26px] font-bold leading-[34px] text-ink" accessibilityRole="header">
                  {type.name}
                </Text>
                <Text className="text-[13px] leading-5 text-ink">{type.description}</Text>
              </View>
            </View>
          </Sticker>
        </Animated.View>

        <View className="gap-0.5 pt-3">
          <Text className="text-lg font-bold text-ink">そんなあなたに、この3つ</Text>
          {solo ? <Text className="text-sm text-ink-soft">行きたい場所をタップしてね</Text> : null}
        </View>

        {picks.isPending ? (
          <Loading label="さがしてるよ…" />
        ) : picks.isError ? (
          <Problem
            title="候補を出せなかった"
            message="通信がうまくいかなかったみたい"
            actionLabel="もう一回"
            onAction={() => picks.refetch()}
          />
        ) : spots.length === 0 ? (
          <Problem
            title="合う場所が見つからなかった"
            message="ほかのエリアでもう一回診断してみてね"
            actionLabel="もう一回診断する"
            onAction={() => router.replace("/quiz")}
          />
        ) : (
          spots.map((spot, i) =>
            solo ? (
              <PressableScale
                key={`${excludeIds.length}-${spot.id}`}
                onPress={() => setChosenId(spot.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: chosenId === spot.id }}
                accessibilityLabel={spot.name}
              >
                <SpotCard
                  spot={spot}
                  index={i + 2}
                  selected={chosenId === spot.id}
                  selectedLabel="ここに行く"
                  showDistance={conditions.area.kind === "current"}
                />
              </PressableScale>
            ) : (
              <SpotCard
                key={`${excludeIds.length}-${spot.id}`}
                spot={spot}
                // タイプの発表のあとに、少し遅れて出てくる
                index={i + 2}
                showDistance={conditions.area.kind === "current"}
              />
            ),
          )
        )}

        <Button label="もう一回診断する" variant="quiet" onPress={() => router.replace("/quiz")} />
      </ScrollView>

      <View className="gap-1 border-t-2 border-ink bg-sand px-5 pt-4" style={{ paddingBottom: insets.bottom + 8 }}>
        {shareNote ? (
          <Text selectable className="text-center text-sm text-sea-ink">
            {shareNote}
          </Text>
        ) : null}
        {solo ? (
          <GoSoloButton
            spotIds={spots.map((s) => s.id)}
            chosenId={spots.some((s) => s.id === chosenId) ? chosenId : undefined}
            conditions={conditions}
            extraConditions={{ quizType: type.id }}
          />
        ) : (
          <AskFriendsButton
            spotIds={spots.map((s) => s.id)}
            conditions={conditions}
            disabled={picks.isFetching}
            extraConditions={{ quizType: type.id }}
          />
        )}
        <View className="flex-row justify-center gap-4">
          <Button label="引き直す" variant="quiet" onPress={redraw} disabled={spots.length === 0 || picks.isFetching} />
          {solo ? (
            <AskFriendsButton
              spotIds={spots.map((s) => s.id)}
              conditions={conditions}
              disabled={picks.isFetching}
              extraConditions={{ quizType: type.id }}
              variant="quiet"
            />
          ) : null}
          <Button label="結果をシェア" variant="quiet" onPress={shareResult} />
        </View>
      </View>
    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
