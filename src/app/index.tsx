import { router } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";

export default function Home() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white px-6" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      <View className="flex-1 items-center justify-center gap-3">
        <Text className="text-5xl font-bold text-teal-600">Sui</Text>
        <Text className="text-base text-slate-500">行き先が、すっと決まる。</Text>
      </View>
      <Button label="行き先を決める" onPress={() => router.push("/new")} />
    </View>
  );
}
