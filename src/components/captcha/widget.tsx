import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { WIDGET_HEIGHT, WIDGET_WIDTH, type CaptchaWidgetProps } from "./types";

// Turnstile はアプリの中では直接動かないので、Web 版と一緒に公開している確認ページを WebView で開く
// （Cloudflare のおすすめのやり方。ページの中身は public/captcha.html）。
// Turnstile は許可したホスト名でしか動かないので、開発中も公開先のページを使う。
const CAPTCHA_PAGE_URL = "https://sui-okinawa.expo.app/captcha.html";

type Message =
  | { type: "token"; token: string }
  | { type: "error"; code: string }
  | { type: "expired" }
  | { type: "interactive" };

export function CaptchaWidget({ siteKey, onToken, onError, onInteractive }: CaptchaWidgetProps) {
  function handleMessage(event: WebViewMessageEvent) {
    let message: Message;
    try {
      message = JSON.parse(event.nativeEvent.data) as Message;
    } catch {
      return;
    }
    if (message.type === "token") onToken(message.token);
    else if (message.type === "error") onError(message.code);
    else if (message.type === "expired") onError("expired");
    else if (message.type === "interactive") onInteractive();
  }

  return (
    <WebView
      source={{ uri: `${CAPTCHA_PAGE_URL}?sitekey=${encodeURIComponent(siteKey)}` }}
      onMessage={handleMessage}
      onError={() => onError("load")}
      onHttpError={() => onError("load")}
      // Turnstile は about:srcdoc の枠を中で使うので、許可しないと動かない（Cloudflare のモバイル向けの説明より）
      originWhitelist={["https://*", "about:srcdoc"]}
      javaScriptEnabled
      domStorageEnabled
      // Cloudflare がすすめる設定：Cookie を保てるようにする
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      bounces={false}
      style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT, backgroundColor: "transparent" }}
    />
  );
}
