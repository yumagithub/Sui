import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { SpotCard } from "@/components/spot-card";
import { fromParams, toPickArgs, type Conditions } from "@/lib/conditions";
import { supabase } from "@/lib/supabase";

async function pickCandidates(conditions: Conditions, excludeIds: string[]) {
  const { data, error } = await supabase.rpc("pick_candidates", toPickArgs(conditions, excludeIds));
  if (error) throw new Error(error.message);
  return data;
}

export default function Picks() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- params は描画ごとに新しいオブジェクトになるので文字列で比べる
  const conditions = useMemo(() => fromParams(params), [paramsKey]);

  // これまでに出した候補。引き直すたびに足していく（同じ場所がすぐ戻ってこないように）
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  const picks = useQuery({
    queryKey: ["picks", paramsKey, excludeIds],
    queryFn: () => pickCandidates(conditions!, excludeIds),
    enabled: conditions !== null,
    staleTime: Infinity,
    retry: 1,
  });

  if (!conditions) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-slate-50 px-6">
        <Text className="text-base text-slate-600">条件が見つからなかった</Text>
        <Button label="条件をえらぶ" onPress={() => router.replace("/new")} />
      </View>
    );
  }

  const spots = picks.data ?? [];
  const relaxed = spots.some((s) => s.relaxed);

  function redraw() {
    setExcludeIds((prev) => [...new Set([...prev, ...spots.map((s) => s.id)])]);
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-4">
        {picks.isPending ? (
          <View className="items-center py-24">
            <ActivityIndicator size="large" color="#0d9488" />
          </View>
        ) : picks.isError ? (
          <View className="items-center gap-4 py-24">
            <Text className="text-base text-slate-600">うまく取れなかった…</Text>
            <Button label="もう一回" variant="secondary" onPress={() => picks.refetch()} />
          </View>
        ) : spots.length === 0 ? (
          <View className="items-center gap-2 py-24">
            <Text className="text-base font-semibold text-slate-700">合う場所が見つからなかった</Text>
            <Text className="text-sm text-slate-500">条件を変えてみてね</Text>
          </View>
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

      <View
        className="flex-row gap-3 border-t border-slate-100 bg-white px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-1">
          <Button label="条件を変える" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace("/new"))}
          />
        </View>
        <View className="flex-1">
          <Button label="引き直す" onPress={redraw} loading={picks.isFetching} disabled={spots.length === 0} />
        </View>
      </View>
    </View>
  );
}
