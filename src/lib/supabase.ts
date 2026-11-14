import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import type { Database } from "./database.types";
import { isServer } from "./platform";

// アプリに入れてよいのは publishable キーだけ（秘密キーは絶対に置かない）
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// サーバー側描画では Supabase を呼ばない（データの取得はブラウザで行う）。
// 公開先（EAS Hosting）のサーバーには環境変数がないので、そこでは止めずに仮の値で作っておく。
if ((!url || !publishableKey) && !isServer) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を .env.local に設定してください",
  );
}

export const supabase = createClient<Database>(url ?? "http://localhost", publishableKey ?? "server-render", {
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
