import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import type { Database } from "./database.types";

// アプリに入れてよいのは publishable キーだけ（秘密キーは絶対に置かない）
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を .env.local に設定してください",
  );
}

// Web のサーバー側描画（SSR）ではブラウザの保存先がないので、ログイン状態は持たない
const isServer = Platform.OS === "web" && typeof window === "undefined";

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    // 匿名ログインの状態を端末に残す（アプリは AsyncStorage、Web は localStorage）
    storage: isServer ? undefined : AsyncStorage,
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: false,
    ...(Platform.OS === "web" ? {} : { lock: processLock }),
  },
});

// アプリが前面にあるあいだだけトークンを自動更新する（Supabase の React Native 向けの推奨）
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
