import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";

/** Web版の先頭。公開後は https://<名前>.expo.app、開発中に LAN で試すときは .env.local で変える */
function webBase(): string | null {
  const base = process.env.EXPO_PUBLIC_WEB_URL;
  if (base) return base.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.origin;
  return null;
}

/** 友達に送る投票ページのURL */
export function outingUrl(code: string) {
  const base = webBase();
  // 指定がないときはアプリ内のリンク（Expo Go では exp://…）
  return base ? `${base}/o/${code}` : Linking.createURL(`/o/${code}`);
}

/** 診断のタイプのページのURL（リンクのプレビューにタイプの画像が出る） */
export function quizTypeUrl(typeId: string) {
  const base = webBase();
  return base ? `${base}/t/${typeId}` : Linking.createURL(`/t/${typeId}`);
}

export type ShareResult = "shared" | "copied" | "dismissed";

/** 共有シートで送る。Web で共有シートが使えなければリンクをコピーする */
export async function shareLink(text: string, url: string): Promise<ShareResult> {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url });
        return "shared";
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return "dismissed";
      }
    }
    await Clipboard.setStringAsync(`${text}\n${url}`);
    return "copied";
  }

  // iOS は url を別に渡すとリンクのプレビューが付く。Android は message にまとめる
  const result = await Share.share(Platform.OS === "ios" ? { message: text, url } : { message: `${text}\n${url}` });
  return result.action === Share.dismissedAction ? "dismissed" : "shared";
}

export function shareOuting(code: string) {
  return shareLink("どこ行く？ Suiで投票してね", outingUrl(code));
}
