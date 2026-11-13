/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Web で <html> の class が変わると "media" のままでは例外になるため
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
