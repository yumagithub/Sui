import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AskFriendsButton } from "@/components/ask-friends";
import { Button } from "@/components/button";
import { SpotCard } from "@/components/spot-card";
import { Loading, Problem } from "@/components/state-view";
import { fromParams } from "@/lib/conditions";
import { usePicks } from "@/lib/picks";

export default function Picks() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- params は描画ごとに新しいオブジェクトになるので文字列で比べる
  const conditions = useMemo(() => fromParams(params), [paramsKey]);

  const { query: picks, excludeIds, redraw } = usePicks(conditions, paramsKey);

  if (!conditions) {
    return (
      <Problem
        title="条件がわからなかった"
        message="もう一回えらびなおしてね"
        actionLabel="条件をえらぶ"
        onAction={() => router.replace("/new")}
      />
    );
  }

  const spots = picks.data ?? [];
  const relaxed = spots.some((s) => s.relaxed);

  return (
    <View className="flex-1 bg-slate-50">
      {/* iOS 26 以降はヘッダーが半透明で中身の上に重なるので、ヘッダーの高さ分を自動でずらす */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-4 px-5 pb-8 pt-4">
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
            message="エリアや車の条件を変えてみてね"
            actionLabel="条件を変える"
            onAction={() => (router.canGoBack() ? router.back() : router.replace("/new"))}
          />
        ) : (
          <>
            {relaxed ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text className="text-sm text-amber-700">
                  ぴったりが少なかったので、条件をちょっとゆるめたよ
                </Text>
              </Animated.View>
            ) : null}
            {spots.map((spot, i) => (
              <SpotCard
                // 引き直すたびに key が変わるので、同じ場所でも登場アニメーションがやり直される
                key={`${excludeIds.length}-${spot.id}`}
                spot={spot}
                index={i}
                showDistance={conditions.area.kind === "current"}
              />
            ))}
          </>
        )}
      </ScrollView>

      <View className="gap-3 border-t border-slate-100 bg-white px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <AskFriendsButton spotIds={spots.map((s) => s.id)} conditions={conditions} disabled={picks.isFetching} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="条件を変える"
              variant="secondary"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/new"))}
            />
          </View>
          <View className="flex-1">
            <Button
              label="引き直す"
              variant="secondary"
              onPress={redraw}
              loading={picks.isFetching}
              disabled={spots.length === 0}
            />
          </View>
        </View>
      </View>

    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
