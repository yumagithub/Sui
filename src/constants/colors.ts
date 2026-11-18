// tailwind.config.js と同じ色。style で直接使うとき（Animated.View・アイコン・ヘッダーなど）に使う
export const COLORS = {
  sand: "#FFF6E8",
  sandDeep: "#FFEBCC",
  sea: "#0C8CE9",
  seaInk: "#0C6FBF",
  seaTint: "#D9F0FF",
  sunset: "#FF7A30",
  ink: "#1D2433",
  inkSoft: "#5B6475",
  inkFaint: "#8A93A6",
  coral: "#FF5C8A",
  coralInk: "#B0234F",
  sun: "#FFD43B",
  white: "#FFFFFF",
} as const;

// アプリでは太さごとのフォント名、Web は Google Fonts のフォント名＋太さ
export const FONT_DISPLAY_NATIVE = "MPLUSRounded1c_800ExtraBold";
export const FONT_BODY_NATIVE = "MPLUSRounded1c_500Medium";
export const FONT_WEB = "'M PLUS Rounded 1c', system-ui, sans-serif";
