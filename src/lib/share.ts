import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";

const SHARE_TEXT = "どこ行く？ Suiで投票してね";

/** 友達に送る投票ページのURL */
export function outingUrl(code: string) {
  // 公開後は https://<名前>.expo.app、開発中は Mac の LAN アドレスを .env.local で指定する
  const base = process.env.EXPO_PUBLIC_WEB_URL;
  if (base) return `${base.replace(/\/$/, "")}/o/${code}`;
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/o/${code}`;
  // 指定がないときはアプリ内のリンク（Expo Go では exp://…）
  return Linking.createURL(`/o/${code}`);
}

export type ShareResult = "shared" | "copied" | "dismissed";

/** 共有シートで送る。Web で共有シートが使えなければリンクをコピーする */
export async function shareOuting(code: string): Promise<ShareResult> {
  const url = outingUrl(code);

  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text: SHARE_TEXT, url });
        return "shared";
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return "dismissed";
      }
    }
    await Clipboard.setStringAsync(url);
    return "copied";
  }

  // iOS は url を別に渡すとリンクのプレビューが付く。Android は message にまとめる
  const result = await Share.share(
    Platform.OS === "ios" ? { message: SHARE_TEXT, url } : { message: `${SHARE_TEXT}\n${url}` },
  );
  return result.action === Share.dismissedAction ? "dismissed" : "shared";
}
