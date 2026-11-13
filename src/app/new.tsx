import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { MUNICIPALITIES, type Municipality } from "@/constants/areas";
import {
  BUDGET_OPTIONS,
  MOOD_OPTIONS,
  originOf,
  toParams,
  type Area,
  type Budget,
  type Mood,
} from "@/lib/conditions";
import { getCurrentLocation, LocationDeniedError } from "@/lib/location";
import { fetchWeather } from "@/lib/weather";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-sm font-bold text-slate-500">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

export default function NewOuting() {
  const insets = useSafeAreaInsets();

  const [area, setArea] = useState<Area | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [hasCar, setHasCar] = useState(false);
  const [budget, setBudget] = useState<Budget>("any");
  const [moods, setMoods] = useState<Mood[]>([]);
  // null のあいだは天気にまかせる。スイッチを触ったら手動の値を使う
  const [indoorOverride, setIndoorOverride] = useState<boolean | null>(null);

  const origin = area ? originOf(area) : null;
  const weather = useQuery({
    queryKey: ["weather", origin?.lat.toFixed(2), origin?.lng.toFixed(2)],
    queryFn: ({ signal }) => fetchWeather(origin!.lat, origin!.lng, signal),
    enabled: origin !== null,
    staleTime: 10 * 60 * 1000,
    // 天気はおまけ。取れなければすぐ「わからなかった」にして先へ進める
    retry: false,
  });
  const preferIndoor = indoorOverride ?? weather.data?.isRainy ?? false;

  async function chooseCurrentLocation() {
    setLocationMessage(null);
    setLocating(true);
    try {
      const pos = await getCurrentLocation();
      setArea({ kind: "current", ...pos });
    } catch (e) {
      setArea(null);
      setLocationMessage(
        e instanceof LocationDeniedError
          ? "位置情報がオフみたい。市町村から選んでね"
          : "現在地がわからなかった。市町村から選んでね",
      );
    } finally {
      setLocating(false);
    }
  }

  function chooseMunicipality(name: Municipality) {
    setLocationMessage(null);
    setArea({ kind: "municipality", name });
  }

  function toggleMood(mood: Mood) {
    setMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));
  }

  function submit() {
    if (!area) return;
    router.push({ pathname: "/picks", params: toParams({ area, hasCar, budget, moods, preferIndoor }) });
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="gap-7 px-5 pb-8 pt-4">
        <View className="gap-3">
          <Section title="どのへん？">
            <Chip
              label={locating ? "さがし中…" : "📍 現在地の近く"}
              selected={area?.kind === "current"}
              onPress={chooseCurrentLocation}
              disabled={locating}
            />
            {MUNICIPALITIES.map((m) => (
              <Chip
                key={m.name}
                label={m.name}
                selected={area?.kind === "municipality" && area.name === m.name}
                onPress={() => chooseMunicipality(m.name)}
              />
            ))}
          </Section>
          {locationMessage ? <Text className="text-sm text-amber-700">{locationMessage}</Text> : null}
        </View>

        <Section title="車は？">
          <Chip label="なし" selected={!hasCar} onPress={() => setHasCar(false)} />
          <Chip label="あり" selected={hasCar} onPress={() => setHasCar(true)} />
        </Section>

        <Section title="予算（1人）">
          {BUDGET_OPTIONS.map((b) => (
            <Chip key={b.value} label={b.label} selected={budget === b.value} onPress={() => setBudget(b.value)} />
          ))}
        </Section>

        <Section title="気分は？（いくつでも）">
          <Chip label="おまかせ" selected={moods.length === 0} onPress={() => setMoods([])} />
          {MOOD_OPTIONS.map((m) => (
            <Chip
              key={m.value}
              label={m.label}
              role="checkbox"
              selected={moods.includes(m.value)}
              onPress={() => toggleMood(m.value)}
            />
          ))}
        </Section>

        <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4">
          <View className="flex-1 gap-0.5">
            {!origin ? (
              <Text className="text-sm text-slate-500">場所を選ぶと天気を見ます</Text>
            ) : weather.isPending ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-slate-500">天気を確認中…</Text>
              </View>
            ) : weather.data ? (
              <Text className="text-sm text-slate-700">
                {weather.data.emoji} {weather.data.label}
                {weather.data.temperature !== null ? ` ${Math.round(weather.data.temperature)}℃` : ""}
                {weather.data.isRainy ? "・雨っぽい" : ""}
              </Text>
            ) : (
              <Text className="text-sm text-slate-500">天気はわからなかった</Text>
            )}
            <Text className="text-base font-semibold text-slate-900">屋内を優先</Text>
          </View>
          <Switch
            value={preferIndoor}
            onValueChange={setIndoorOverride}
            trackColor={{ true: "#0d9488" }}
            accessibilityLabel="屋内を優先"
          />
        </View>
      </ScrollView>

      <View className="border-t border-slate-100 bg-white px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label={area ? "3つ出す" : "まず場所を選んでね"} onPress={submit} disabled={!area} />
      </View>
    </View>
  );
}
