import { Platform, Text as RNText, type TextProps } from "react-native";

// 丸いフォント（M PLUS Rounded 1c）。アプリはファイルを同梱、Web は Google Fonts から読み込む。
// アプリでは太さごとに別のフォント名を使う（Android は fontWeight を付けるとカスタムフォントが外れることがあるため）。
const WEB_FAMILY = "'M PLUS Rounded 1c', system-ui, sans-serif";
const BOLD = /\bfont-(bold|semibold|extrabold|black)\b/;

/**
 * アプリ全体で使う Text。className に font-bold などがあれば太字（800）、なければ本文（500）にする。
 */
export function Text({ className, style, ...props }: TextProps & { className?: string }) {
  const bold = BOLD.test(className ?? "");
  const cleaned = (className ?? "").replace(/\bfont-(bold|semibold|extrabold|black|medium|normal)\b/g, "").trim();
  const font =
    Platform.OS === "web"
      ? { fontFamily: WEB_FAMILY, fontWeight: bold ? ("800" as const) : ("500" as const) }
      : { fontFamily: bold ? "MPLUSRounded1c_800ExtraBold" : "MPLUSRounded1c_500Medium" };
  return <RNText {...props} className={cleaned} style={[font, style]} />;
}
