/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Web で <html> の class が変わると "media" のままでは例外になるため
  darkMode: "class",
  theme: {
    extend: {
      // Sui のデザイン（.design/ui-refresh/DESIGN_BRIEF.md）：砂浜の地に、海の青・夕日のオレンジ・紺のインク
      colors: {
        sand: { DEFAULT: "#FFF6E8", deep: "#FFEBCC" },
        sea: { DEFAULT: "#0C8CE9", ink: "#0C6FBF", tint: "#D9F0FF", deep: "#0A5DA3" },
        sunset: { DEFAULT: "#FF7A30", tint: "#FFE3D3" },
        ink: { DEFAULT: "#1D2433", soft: "#5B6475", faint: "#8A93A6" },
        coral: { DEFAULT: "#FF5C8A", ink: "#B0234F", tint: "#FFE1EA" },
        sun: { DEFAULT: "#FFD43B", tint: "#FFF1D6" },
      },
      borderWidth: { 2.5: "2.5px" },
    },
  },
  plugins: [],
};
