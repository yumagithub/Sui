import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";

import { CaptchaProvider } from "@/components/captcha/provider";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* 匿名ログインの前の「ちょっと確認」。どの画面からでも出せるように一番外に置く */}
      <CaptchaProvider>
        <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal", headerShadowVisible: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="new" options={{ title: "条件をえらぶ" }} />
          <Stack.Screen name="picks" options={{ title: "この3つから" }} />
          <Stack.Screen name="o/[code]" options={{ title: "投票" }} />
        </Stack>
      </CaptchaProvider>
    </QueryClientProvider>
  );
}
