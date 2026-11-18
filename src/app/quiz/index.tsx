import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { QuizOption } from "@/components/quiz-option";
import { SwipeCard, type SwipeCardHandle } from "@/components/swipe-card";
import { Text } from "@/components/text";
import { MUNICIPALITIES } from "@/constants/areas";
import { COLORS } from "@/constants/colors";
import { originOf, toParams, type Area } from "@/lib/conditions";
import { getCurrentLocation, LocationDeniedError } from "@/lib/location";
import {
  answeredCount,
  nextQuestion,
  QUESTIONS,
  toConditions,
  typeFromAnswers,
  type QuestionId,
  type SwipeAnswers,
} from "@/lib/quiz";
import { fetchWeather } from "@/lib/weather";

/** 場所のあとに出るカードは多くて5枚 */
const MAX_CARDS = 5;

function Progress({ step }: { step: number }) {
  return (
    <View className="h-2.5 flex-row gap-1.5" accessibilityLabel={`${MAX_CARDS + 1}問中${step + 1}問目くらい`}>
      {Array.from({ length: MAX_CARDS + 1 }, (_, i) => (
        <View
          key={i}
          className="flex-1 rounded-full border-2 border-ink"
          style={{ backgroundColor: i <= step ? COLORS.sea : COLORS.white }}
        />
      ))}
    </View>
  );
}

export default function Quiz() {
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<Area | null>(null);
  const [pickMunicipality, setPickMunicipality] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SwipeAnswers>({});
  // 「ひとつ戻る」用に、答えた順を覚えておく
  const [history, setHistory] = useState<QuestionId[]>([]);
  const card = useRef<SwipeCardHandle>(null);

  // 場所が決まったら天気を見ておく（雨なら屋内を優先）
  const origin = area ? originOf(area) : null;
  const weather = useQuery({
    queryKey: ["weather", origin?.lat.toFixed(2), origin?.lng.toFixed(2)],
    queryFn: ({ signal }) => fetchWeather(origin!.lat, origin!.lng, signal),
    enabled: origin !== null,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const current = area ? nextQuestion(answers) : null;

  // 答え終わったら結果へ
  useEffect(() => {
    if (!area || current !== null) return;
    router.replace({
      pathname: "/quiz/result",
      params: { ...toParams(toConditions(area, answers, weather.data?.isRainy ?? false)), type: typeFromAnswers(answers) },
    });
  }, [area, current, answers, weather.data?.isRainy]);

  // Web では ← → キーでも答えられる
  useEffect(() => {
    if (Platform.OS !== "web" || !current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") card.current?.answer(true);
      if (e.key === "ArrowLeft") card.current?.answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  function answer(yes: boolean) {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current]: yes }));
    setHistory((h) => [...h, current]);
  }

  function undo() {
    if (history.length === 0) {
      setArea(null);
      return;
    }
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setAnswers((a) => {
      const next = { ...a };
      delete next[last];
      return next;
    });
  }

  async function chooseCurrentLocation() {
    setLocationMessage(null);
    setLocating(true);
    try {
      setArea({ kind: "current", ...(await getCurrentLocation()) });
    } catch (e) {
      setPickMunicipality(true);
      setLocationMessage(
        e instanceof LocationDeniedError
          ? "位置情報がオフみたい。市町村からえらんでね"
          : "現在地がわからなかった。市町村からえらんでね",
      );
    } finally {
      setLocating(false);
    }
  }

  // 1枚目：場所（ここだけはタップで答える）
  if (!area) {
    return (
      <ScrollView
        className="flex-1 bg-sand"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 px-5 pb-10 pt-4"
      >
        <Progress step={0} />
        <Text className="text-[28px] font-bold text-ink" accessibilityRole="header">
          今どのへん？
        </Text>
        <View className="gap-4">
          <QuizOption emoji="📍" label={locating ? "さがし中…" : "現在地の近く"} onPress={chooseCurrentLocation} />
          <QuizOption
            emoji="🗺️"
            label="市町村からえらぶ"
            selected={pickMunicipality}
            onPress={() => setPickMunicipality(true)}
          />
        </View>
        {locationMessage ? <Text className="text-sm font-bold text-coral-ink">{locationMessage}</Text> : null}
        {pickMunicipality ? (
          <View className="flex-row flex-wrap gap-2">
            {MUNICIPALITIES.map((m) => (
              <Chip
                key={m.name}
                label={m.name}
                selected={false}
                onPress={() => setArea({ kind: "municipality", name: m.name })}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  if (!current) return <View className="flex-1 bg-sand" />;

  return (
    <View className="flex-1 bg-sand" style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="gap-4 px-5 pt-4">
        <Progress step={answeredCount(answers) + 1} />
        <Text className="text-center text-sm font-bold text-ink-soft">右にはじくと Yes!、左で No!</Text>
      </View>

      <View className="flex-1 justify-center px-8">
        {/* 後ろに次のカードがあるように見せる */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            alignSelf: "center",
            width: "70%",
            maxWidth: 300,
            aspectRatio: 0.82,
            borderRadius: 32,
            borderWidth: 3,
            borderColor: COLORS.ink,
            backgroundColor: COLORS.white,
            transform: [{ rotate: "4deg" }, { translateY: 10 }],
          }}
        />
        <SwipeCard ref={card} question={QUESTIONS[current]} onAnswer={answer} />
      </View>

      <View className="gap-2 px-5">
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Button label="No!" variant="secondary" onPress={() => card.current?.answer(false)} />
          </View>
          <View className="flex-1">
            <Button label="Yes!" onPress={() => card.current?.answer(true)} />
          </View>
        </View>
        <Button label="ひとつ戻る" variant="quiet" onPress={undo} />
      </View>
    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
