import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { CaptchaProvider } from "@/components/captcha/provider";
import { OfflineBanner } from "@/components/offline-banner";
import { setupConnectivity } from "@/lib/connectivity";

setupConnectivity();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));

  return (
    <QueryClientProvider client={queryClient}>
      {/* 匿名ログインの前の「ちょっと確認」。どの画面からでも出せるように一番外に置く */}
      <CaptchaProvider>
        <View className="flex-1">
          <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="new" options={{ title: "条件をえらぶ" }} />
            <Stack.Screen name="picks" options={{ title: "この3つはどう？" }} />
            <Stack.Screen name="o/[code]" options={{ title: "どこ行く？" }} />
            <Stack.Screen name="terms" options={{ title: "利用規約" }} />
            <Stack.Screen name="privacy" options={{ title: "プライバシーポリシー" }} />
            <Stack.Screen name="+not-found" options={{ title: "見つからない" }} />
          </Stack>
          <OfflineBanner />
        </View>
      </CaptchaProvider>
    </QueryClientProvider>
  );
}
