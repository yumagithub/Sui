import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { PressableScale } from "@/components/pressable-scale";
import { useMe } from "@/lib/auth";
import { useMyOutings, type MyOuting } from "@/lib/outings";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function OutingRow({ outing }: { outing: MyOuting }) {
  const voting = outing.status === "voting";
  return (
    <PressableScale
      onPress={() => router.push({ pathname: "/o/[code]", params: { code: outing.share_code } })}
      accessibilityRole="button"
      accessibilityLabel={`${formatDate(outing.created_at)}のおでかけ：${
        outing.decidedName ? `${outing.decidedName}に決定` : outing.spotNames.join("、")
      }${outing.needsFeedback ? "（実際に行ったか、まだ答えていません）" : ""}`}
    >
      <View className="gap-1.5 rounded-2xl bg-white p-4">
        <View className="flex-row items-center gap-2">
          <Text
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              voting ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {voting ? "投票中" : "決定"}
          </Text>
          <Text className="text-xs text-slate-400">{formatDate(outing.created_at)}</Text>
          {outing.needsFeedback ? (
            <Text className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              行った？
            </Text>
          ) : null}
        </View>
        <Text className="text-[15px] font-semibold text-slate-800" numberOfLines={2}>
          {outing.decidedName ? `決定：${outing.decidedName}` : outing.spotNames.join(" ／ ")}
        </Text>
      </View>
    </PressableScale>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const myOutings = useMyOutings(me.data);
  const outings = myOutings.data ?? [];

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerClassName="grow gap-6 px-5 pb-6">
        <View className={`items-center gap-3 ${outings.length > 0 ? "pt-10" : "flex-1 justify-center"}`}>
          <Text className="text-5xl font-bold text-teal-600">Sui</Text>
          <Text className="text-base text-slate-500">行き先が、すっと決まる。</Text>
        </View>

        {outings.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-bold text-slate-500">参加したおでかけ</Text>
            {outings.map((o) => (
              <OutingRow key={o.id} outing={o} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button label="行き先を決める" onPress={() => router.push("/new")} />
      </View>
    </View>
  );
}
