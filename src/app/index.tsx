import { Link, router } from "expo-router";
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
        ) : (
          // はじめての人向けに、使い方を3つだけ
          <View className="gap-3 rounded-2xl bg-white p-5">
            {[
              "5つの質問に答えると、行き先の候補が3つ出る",
              "リンクを送って、友達と投票",
              "決まったら、Googleマップでそのまま出発",
            ].map((step, i) => (
              <View key={step} className="flex-row items-center gap-3">
                <Text className="h-7 w-7 rounded-full bg-teal-50 text-center text-sm font-bold leading-7 text-teal-700">
                  {i + 1}
                </Text>
                <Text className="flex-1 text-[15px] text-slate-700">{step}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="gap-3 px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label="診断で行き先を決める" onPress={() => router.push("/quiz")} />
        <Button label="条件でえらぶ" variant="secondary" onPress={() => router.push("/new")} />
        <View className="flex-row justify-center gap-4">
          <Link href="/terms" className="text-xs text-slate-400">
            利用規約
          </Link>
          <Link href="/privacy" className="text-xs text-slate-400">
            プライバシーポリシー
          </Link>
        </View>
      </View>
    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
