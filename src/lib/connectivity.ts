import { focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState, Platform } from "react-native";

import { isServer } from "./platform";

let installed = false;

/**
 * TanStack Query に「オンラインか」「アプリが前面にあるか」を教える（1回だけ）。
 * - オフラインのあいだは通信を待ち、つながったら自動で読み直す
 * - アプリに戻ってきたら読み直す（バックグラウンド中に Realtime が切れることがあるため）
 */
export function setupConnectivity() {
  // Web のサーバー側描画では window がないので何もしない（ブラウザで動き出してから設定する）
  if (installed || isServer) return;
  installed = true;

  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => subscription.remove();
  });

  // Web はブラウザのタブの表示・非表示を TanStack Query がもともと見ている
  if (Platform.OS !== "web") {
    focusManager.setEventListener((setFocused) => {
      const subscription = AppState.addEventListener("change", (state) => setFocused(state === "active"));
      return () => subscription.remove();
    });
  }
}
