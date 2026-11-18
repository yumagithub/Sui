import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Problem } from "@/components/state-view";
import { buildMetadata, WEB_URL } from "@/lib/metadata";
import { isQuizTypeId, QUIZ_TYPES } from "@/lib/quiz";

/** リンクのプレビューに、タイプの画像を出す（サーバー側描画で <head> に入る） */
export function generateMetadata(_request: unknown, params: Record<string, string | string[]>) {
  const id = typeof params.type === "string" ? params.type : undefined;
  if (!isQuizTypeId(id)) return buildMetadata();
  const type = QUIZ_TYPES[id];
  return buildMetadata({
    title: `${type.emoji}${type.name}｜Sui の行き先診断`,
    description: `${type.description} あなたは何タイプ？`,
    image: `${WEB_URL}/og/${type.id}.png`,
    url: `${WEB_URL}/t/${type.id}`,
  });
}

/** 診断の結果をシェアしたときに開くページ。リンクのプレビューにタイプの画像が出る */
export default function QuizTypePage() {
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const type = isQuizTypeId(typeParam) ? QUIZ_TYPES[typeParam] : null;

  if (!type) {
    return (
      <Problem
        title="そのタイプは見つからなかった"
        actionLabel="診断してみる"
        onAction={() => router.replace("/quiz")}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-5 pb-10 pt-6"
    >
      <View className={`items-center gap-2 rounded-3xl px-5 py-8 ${type.bg}`}>
        <Text className="text-sm font-semibold text-slate-600">友達の今日のタイプは…</Text>
        <Text className="text-6xl">{type.emoji}</Text>
        <Text className="text-3xl font-bold text-slate-900" accessibilityRole="header">
          {type.name}
        </Text>
        <Text className="text-center text-sm leading-5 text-slate-700">{type.description}</Text>
      </View>

      <View className="gap-2">
        <Text className="text-center text-base font-bold text-slate-800">あなたは何タイプ？</Text>
        <Text className="text-center text-sm text-slate-500">5つの質問に答えると、行き先が3つ出てくるよ</Text>
      </View>
      <Button label="診断してみる" onPress={() => router.push("/quiz")} />
    </ScrollView>
  );
}
