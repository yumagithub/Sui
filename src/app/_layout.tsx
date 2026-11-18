import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { CaptchaProvider } from "@/components/captcha/provider";
import { OfflineBanner } from "@/components/offline-banner";
import { COLORS, FONT_DISPLAY_NATIVE, FONT_WEB } from "@/constants/colors";
import { setupConnectivity } from "@/lib/connectivity";
import { useAppFonts } from "@/lib/fonts";

setupConnectivity();
// 丸いフォントを読み終わるまでスプラッシュを出しておく（文字がちらつかないように）
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {/* 匿名ログインの前の「ちょっと確認」。どの画面からでも出せるように一番外に置く */}
      <CaptchaProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.sand }}>
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: "minimal",
              headerShadowVisible: false,
              headerTintColor: COLORS.ink,
              headerStyle: { backgroundColor: COLORS.sand },
              headerTitleStyle:
                Platform.OS === "web"
                  ? { fontFamily: FONT_WEB, fontWeight: "800", color: COLORS.ink }
                  : { fontFamily: FONT_DISPLAY_NATIVE, color: COLORS.ink },
              contentStyle: { backgroundColor: COLORS.sand },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="new" options={{ title: "自分で条件を決める" }} />
            <Stack.Screen name="picks" options={{ title: "この3つはどう？" }} />
            <Stack.Screen name="o/[code]" options={{ title: "みんなで投票" }} />
            <Stack.Screen name="quiz/index" options={{ title: "行き先診断" }} />
            <Stack.Screen name="quiz/result" options={{ title: "診断の結果" }} />
            <Stack.Screen name="t/[type]" options={{ title: "行き先診断" }} />
            <Stack.Screen name="terms" options={{ title: "利用規約" }} />
            <Stack.Screen name="privacy" options={{ title: "プライバシーポリシー" }} />
            <Stack.Screen name="+not-found" options={{ title: "見つからない" }} />
          </Stack>
          <OfflineBanner />
        </GestureHandlerRootView>
      </CaptchaProvider>
    </QueryClientProvider>
  );
}
