import { Text, View } from "react-native";
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
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          {/* 中身のない絶対配置の要素なので width を CSS transition で動かす（expo-animation スキルの例外）。
              Animated.View には NativeWind の className が効かないので style で書く */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 999,
              backgroundColor: "#14b8a6",
              width: `${Math.round(ratio * 100)}%`,
              transitionProperty: "width",
              transitionDuration: 200,
              transitionTimingFunction: CSS_EASE_OUT,
            }}
          />
        </View>
        <Text className="w-10 text-right text-sm font-bold text-slate-700">{votes.length}票</Text>
      </View>
      {isTop ? (
        <Text className="self-start rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          いちばん人気
        </Text>
      ) : null}
      {names.length > 0 ? (
        <Text className="text-xs text-slate-500" numberOfLines={2}>
          {names.join("・")}
        </Text>
      ) : null}
    </View>
  );
}
