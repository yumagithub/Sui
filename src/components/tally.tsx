import { View } from "react-native";
import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";
import Animated from "react-native-reanimated";

import { CSS_EASE_OUT } from "@/constants/motion";
import type { Member, Vote } from "@/lib/outings";

/** 票数のバーと、投票した人の名前 */
export function Tally({
  votes,
  members,
  me,
  total,
  isTop,
}: {
  votes: Vote[];
  members: Member[];
  me: string;
  total: number;
  isTop: boolean;
}) {
  const names = votes.map((v) =>
    v.user_id === me ? "あなた" : (members.find((m) => m.user_id === v.user_id)?.display_name ?? "だれか"),
  );
  const ratio = total === 0 ? 0 : votes.length / total;

  return (
    <View className="mt-1 gap-1.5">
      <View className="flex-row items-center gap-3">
        <View className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
          {/* 幅（レイアウト）は動かさず、左端を起点に scaleX で伸び縮みさせる（GPU で描ける transform だけを動かす）。
              Animated.View には NativeWind の className が効かないので style で書く */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: COLORS.sea,
              transformOrigin: "left center",
              transform: [{ scaleX: ratio }],
              transitionProperty: "transform",
              transitionDuration: 200,
              transitionTimingFunction: CSS_EASE_OUT,
            }}
          />
        </View>
        <Text className="w-10 text-right text-sm font-bold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
          {votes.length}票
        </Text>
      </View>
      {isTop ? (
        <Text className="self-start rounded-full border-2 border-ink bg-coral px-2 py-0.5 text-xs font-bold text-ink">
          いちばん人気
        </Text>
      ) : null}
      {names.length > 0 ? (
        <Text className="text-xs text-ink-soft" numberOfLines={2}>
          {names.join("・")}
        </Text>
      ) : null}
    </View>
  );
}
