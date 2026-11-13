import { useEffect, useEffectEvent, useRef, type ComponentRef } from "react";
import { View } from "react-native";

import { WIDGET_HEIGHT, WIDGET_WIDTH, type CaptchaWidgetProps } from "./types";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type RenderOptions = {
  sitekey: string;
  appearance?: "always" | "execute" | "interaction-only";
  theme?: "auto" | "light" | "dark";
  language?: string;
  callback?: (token: string) => void;
  "error-callback"?: (code: string) => boolean | void;
  "expired-callback"?: () => void;
  "before-interactive-callback"?: () => void;
};

type Turnstile = {
  render: (container: HTMLElement, options: RenderOptions) => string | undefined;
  remove: (widgetId: string) => void;
};

type TurnstileWindow = Window & { turnstile?: Turnstile; onSuiTurnstileLoad?: () => void };

let loading: Promise<Turnstile> | null = null;

/** Turnstile のスクリプトを1回だけ読み込む */
function loadTurnstile() {
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const w = window as TurnstileWindow;
    if (w.turnstile) {
      resolve(w.turnstile);
      return;
    }
    w.onSuiTurnstileLoad = () => resolve(w.turnstile!);
    const script = document.createElement("script");
    script.src = `${SCRIPT_URL}?render=explicit&onload=onSuiTurnstileLoad`;
    script.async = true;
    script.onerror = () => {
      // 次に開いたときにもう一回読み込めるように
      loading = null;
      script.remove();
      reject(new Error("Turnstile を読み込めませんでした"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Web 版：ページの中に Turnstile をそのまま出す */
export function CaptchaWidget({ siteKey, onToken, onError, onInteractive }: CaptchaWidgetProps) {
  const container = useRef<ComponentRef<typeof View>>(null);
  const handleToken = useEffectEvent(onToken);
  const handleError = useEffectEvent(onError);
  const handleInteractive = useEffectEvent(onInteractive);

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | undefined;

    loadTurnstile()
      .then((turnstile) => {
        // react-native-web の View の ref は DOM の要素そのもの
        const element = container.current as unknown as HTMLElement | null;
        if (cancelled || !element) return;
        widgetId = turnstile.render(element, {
          sitekey: siteKey,
          appearance: "interaction-only",
          theme: "light",
          language: "ja",
          callback: (token) => handleToken(token),
          "error-callback": (code) => {
            handleError(String(code));
            return true;
          },
          "expired-callback": () => handleError("expired"),
          "before-interactive-callback": () => handleInteractive(),
        });
      })
      .catch(() => {
        if (!cancelled) handleError("script");
      });

    return () => {
      cancelled = true;
      if (widgetId) (window as TurnstileWindow).turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  return <View ref={container} style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT, alignItems: "center" }} />;
}
