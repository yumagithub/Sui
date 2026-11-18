import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInRight, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { QuizOption } from "@/components/quiz-option";
import { MUNICIPALITIES } from "@/constants/areas";
import { EASE_OUT } from "@/constants/motion";
import { originOf, toParams, type Area, type Budget } from "@/lib/conditions";
import { getCurrentLocation, LocationDeniedError } from "@/lib/location";
import {
  BUDGET_QUIZ_OPTIONS,
  HUNGER_OPTIONS,
  PLACE_OPTIONS,
  toConditions,
  typeOf,
  VIBE_OPTIONS,
  type Hunger,
  type Place,
  type Vibe,
} from "@/lib/quiz";
import { fetchWeather } from "@/lib/weather";

const TOTAL = 5;

function Question({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  // 次の質問は右からすっと入ってくる（視差効果を減らす設定ならフェードだけ）
  const entering = useMemo(
    () => (reduceMotion ? FadeIn.duration(200) : FadeInRight.duration(250).easing(EASE_OUT)),
    [reduceMotion],
  );
  return (
    <Animated.View key={step} entering={entering} style={{ gap: 16 }}>
      <Text className="text-2xl font-bold text-slate-900" accessibilityRole="header">
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </Animated.View>
  );
}

export default function Quiz() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const [area, setArea] = useState<Area | null>(null);
  const [pickMunicipality, setPickMunicipality] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [hunger, setHunger] = useState<Hunger | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [place, setPlace] = useState<Place | null>(null);

  // 場所が決まったら天気を見ておく（雨なら「中でまったり」をすすめる）
  const origin = area ? originOf(area) : null;
  const weather = useQuery({
    queryKey: ["weather", origin?.lat.toFixed(2), origin?.lng.toFixed(2)],
    queryFn: ({ signal }) => fetchWeather(origin!.lat, origin!.lng, signal),
    enabled: origin !== null,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const isRainy = weather.data?.isRainy ?? false;

  function chooseArea(next: Area) {
    setArea(next);
    setLocationMessage(null);
    setStep(1);
  }

  async function chooseCurrentLocation() {
    setLocationMessage(null);
    setLocating(true);
    try {
      chooseArea({ kind: "current", ...(await getCurrentLocation()) });
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

  function finish(budget: Budget) {
    if (!area || !hunger || !vibe || !place) return;
    const answers = { area, hunger, vibe, place, budget };
    router.push({
      pathname: "/quiz/result",
      params: { ...toParams(toConditions(answers, isRainy)), type: typeOf(answers) },
    });
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-6 px-5 pb-8 pt-4">
        {/* 進み具合 */}
        <View className="gap-2" accessibilityLabel={`${TOTAL}問中${step + 1}問目`}>
          <Text className="text-sm font-bold text-teal-700">
            {step + 1} / {TOTAL}
          </Text>
          <View className="h-1.5 flex-row gap-1">
            {Array.from({ length: TOTAL }, (_, i) => (
              <View key={i} className={`flex-1 rounded-full ${i <= step ? "bg-teal-500" : "bg-slate-200"}`} />
            ))}
          </View>
        </View>

        {step === 0 ? (
          <Question step={0} title="今どのへん？">
            <QuizOption
              emoji="📍"
              label={locating ? "さがし中…" : "現在地の近く"}
              selected={area?.kind === "current"}
              onPress={chooseCurrentLocation}
            />
            <QuizOption
              emoji="🗺️"
              label="市町村からえらぶ"
              selected={pickMunicipality}
              onPress={() => setPickMunicipality(true)}
            />
            {locationMessage ? <Text className="text-sm text-amber-700">{locationMessage}</Text> : null}
            {pickMunicipality ? (
              <View className="flex-row flex-wrap gap-2 pt-1">
                {MUNICIPALITIES.map((m) => (
                  <Chip
                    key={m.name}
                    label={m.name}
                    selected={area?.kind === "municipality" && area.name === m.name}
                    onPress={() => chooseArea({ kind: "municipality", name: m.name })}
                  />
                ))}
              </View>
            ) : null}
          </Question>
        ) : step === 1 ? (
          <Question step={1} title="お腹の空き具合は？">
            {HUNGER_OPTIONS.map((o) => (
              <QuizOption
                key={o.value}
                {...o}
                selected={hunger === o.value}
                onPress={() => {
                  setHunger(o.value);
                  setStep(2);
                }}
              />
            ))}
          </Question>
        ) : step === 2 ? (
          <Question step={2} title="今日の気分は？">
            {VIBE_OPTIONS.map((o) => (
              <QuizOption
                key={o.value}
                {...o}
                selected={vibe === o.value}
                onPress={() => {
                  setVibe(o.value);
                  setStep(3);
                }}
              />
            ))}
          </Question>
        ) : step === 3 ? (
          <Question step={3} title="外と中、どっち？">
            {PLACE_OPTIONS.map((o) => (
              <QuizOption
                key={o.value}
                {...o}
                selected={place === o.value}
                hint={o.value === "inside" && isRainy ? "☔ 雨っぽいから、こっちがおすすめ" : undefined}
                onPress={() => {
                  setPlace(o.value);
                  setStep(4);
                }}
              />
            ))}
          </Question>
        ) : (
          <Question step={4} title="お財布は？（1人）">
            {BUDGET_QUIZ_OPTIONS.map((o) => (
              <QuizOption key={o.value} {...o} onPress={() => finish(o.value)} />
            ))}
          </Question>
        )}
      </ScrollView>

      {step > 0 ? (
        <View className="px-5 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
          <Text
            className="py-2 text-center text-sm font-semibold text-slate-500"
            onPress={() => setStep((s) => s - 1)}
            accessibilityRole="button"
          >
            ← 前の質問にもどる
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
