import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { PressableScale } from "@/components/pressable-scale";
import { Sticker } from "@/components/sticker";
import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";
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
      accessibilityLabel={`${formatDate(outing.created_at)}の${outing.solo ? "ひとりの" : ""}おでかけ：${
        outing.decidedName ? `${outing.decidedName}に決定` : outing.spotNames.join("、")
      }${outing.needsFeedback ? "（実際に行ったか、まだ答えていません）" : ""}`}
    >
      <View className="gap-1.5 rounded-2xl border-2 border-ink bg-white px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Text
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              voting ? "bg-coral-tint text-coral-ink" : "bg-sand-deep text-ink-soft"
            }`}
          >
            {voting ? "投票中" : outing.solo ? "ひとりで" : "決定"}
          </Text>
          <Text className="text-xs text-ink-soft">{formatDate(outing.created_at)}</Text>
          {outing.needsFeedback ? (
            <Text className="ml-auto rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-ink">行った？</Text>
          ) : null}
        </View>
        <Text className="text-[15px] font-bold text-ink" numberOfLines={2}>
          {outing.decidedName
            ? `${outing.solo ? "行き先" : "決定"}：${outing.decidedName}`
            : outing.spotNames.join(" ／ ")}
        </Text>
      </View>
    </PressableScale>
  );
}

/** ホームの主役：診断のカード。押せるのは中の「診断スタート」だけで、そこだけが沈む */
function QuizHero() {
  return (
    <Sticker color={COLORS.seaInk} radius={28} offset={6}>
      <View className="gap-3 px-5 pb-5 pt-5">
        <Text className="self-start rounded-full border-2 border-ink bg-sun px-3 py-0.5 text-[13px] font-bold text-ink">
          スワイプで30秒
        </Text>
        <Text className="text-[30px] font-bold leading-[40px] text-white">{"今日どこ行く？\n診断してみる"}</Text>
        <Text className="text-sm text-white">Yes! か No! で答えると、行き先が3つ出てくるよ</Text>
        <View className="mt-2">
          <Button label="診断スタート" onPress={() => router.push("/quiz")} />
        </View>
      </View>
    </Sticker>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const myOutings = useMyOutings(me.data);
  const outings = myOutings.data ?? [];

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerClassName="grow gap-7 px-5 pb-6 pt-6">
        <View className="flex-row items-end gap-3">
          <Image
            source={require("@/assets/images/logo-ink.png")}
            style={{ width: 96, height: 89 }}
            contentFit="contain"
            accessibilityLabel="Sui"
          />
          <Text className="pb-3 text-[15px] font-bold text-ink-soft">行き先が、すっと決まる。</Text>
        </View>

        <QuizHero />

        {outings.length > 0 ? (
          <View className="gap-3">
            <Text className="text-[15px] font-bold text-ink" accessibilityRole="header">
              これまでのおでかけ
            </Text>
            {outings.map((o) => (
              <OutingRow key={o.id} outing={o} />
            ))}
          </View>
        ) : (
          // はじめての人向けに、流れを3つだけ（順番があるので番号つき）
          <View className="gap-3">
            {["スワイプで答えると、行き先が3つ出る", "リンクを送って、友達と投票", "決まったら Googleマップで出発"].map(
              (step, i) => (
                <View key={step} className="flex-row items-center gap-3">
                  <View className="size-8 items-center justify-center rounded-full border-2 border-ink bg-white">
                    <Text className="text-sm font-bold text-ink">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-[15px] text-ink">{step}</Text>
                </View>
              ),
            )}
          </View>
        )}
      </ScrollView>

      <View className="items-center gap-1 px-5 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <Button label="自分で条件を決める" variant="quiet" onPress={() => router.push("/new")} />
        <View className="flex-row justify-center gap-4">
          <Link href="/terms" className="py-2 text-xs text-ink-soft">
            利用規約
          </Link>
          <Link href="/privacy" className="py-2 text-xs text-ink-soft">
            プライバシーポリシー
          </Link>
        </View>
      </View>
    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
