import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "@/components/text";

import type { SpotSummary } from "./spot-card";

import { BottomSheet } from "./bottom-sheet";
import { Button } from "./button";
import { PressableScale } from "./pressable-scale";

type Props = {
  visible: boolean;
  candidates: SpotSummary[];
  /** スポットごとの票数 */
  counts: Record<string, number>;
  loading?: boolean;
  error?: string | null;
  onConfirm: (spotId: string) => void;
  onClose: () => void;
};

/** 作った人が行き先を決めるシート。票がいちばん多い候補を最初から選んでおく */
export function DecideSheet({ visible, candidates, counts, loading, error, onConfirm, onClose }: Props) {
  const max = Math.max(0, ...candidates.map((c) => counts[c.id] ?? 0));
  // 同じ票数なら上に並んでいる方（候補の順）をおすすめにする
  const recommended = max > 0 ? candidates.find((c) => (counts[c.id] ?? 0) === max)?.id : undefined;
  // 自分で選び直していなければ、その時点のおすすめを選んでいることにする
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const selected = picked ?? recommended;
  const close = () => {
    setPicked(undefined);
    onClose();
  };

  const selectedName = candidates.find((c) => c.id === selected)?.name;

  return (
    <BottomSheet visible={visible} onClose={close}>
      <Text className="text-xl font-bold text-ink">どこに決める？</Text>
      <Text className="mt-1 text-sm text-ink-soft">
        決めると、みんなの画面が切り替わるよ（あとから変えられません）
      </Text>

      <ScrollView className="mt-4" contentContainerClassName="gap-3">
        {candidates.map((spot) => {
          const count = counts[spot.id] ?? 0;
          const isTop = max > 0 && count === max;
          const isSelected = selected === spot.id;
          return (
            <PressableScale
              key={spot.id}
              onPress={() => setPicked(spot.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${spot.name}（${count}票）${isTop ? "いちばん人気" : ""}`}
            >
              <View
                className={`flex-row items-center gap-3 rounded-2xl border-2.5 border-ink p-4 ${
                  isSelected ? "bg-sea-tint" : "bg-white"
                }`}
              >
                <View className="flex-1 gap-1">
                  {isTop ? (
                    <Text className="self-start rounded-full border-2 border-ink bg-coral px-2 py-0.5 text-xs font-bold text-ink">
                      いちばん人気
                    </Text>
                  ) : null}
                  <Text className="text-base font-bold text-ink" numberOfLines={2}>
                    {spot.name}
                  </Text>
                </View>
                <Text className="text-base font-bold text-ink">{count}票</Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {error ? <Text className="mt-3 text-sm text-coral-ink">{error}</Text> : null}
      <View className="mt-4">
        <Button
          label={selectedName ? `${selectedName}に決定！` : "場所をえらんでね"}
          onPress={() => selected && onConfirm(selected)}
          disabled={!selected}
          loading={loading}
        />
      </View>
    </BottomSheet>
  );
}
