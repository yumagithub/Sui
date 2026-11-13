// Open-Meteo（APIキー不要）で今の天気を取る
// https://open-meteo.com/en/docs

// 霧雨・雨・着氷性の雨・にわか雨・雷雨
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
// この先3時間で、降水確率がこれ以上の時間があれば「雨っぽい」
const RAIN_PROBABILITY = 50;
const TIMEOUT_MS = 5000;

export type Weather = {
  isRainy: boolean;
  label: string;
  emoji: string;
  temperature: number | null;
  maxRainProbability: number | null;
};

function describe(code: number): { label: string; emoji: string } {
  if (code === 0 || code === 1) return { label: "晴れ", emoji: "☀️" };
  if (code === 2) return { label: "晴れときどきくもり", emoji: "🌤️" };
  if (code === 3) return { label: "くもり", emoji: "☁️" };
  if (code === 45 || code === 48) return { label: "きり", emoji: "🌫️" };
  if (code >= 95) return { label: "雷雨", emoji: "⛈️" };
  if (RAIN_CODES.has(code)) return { label: "雨", emoji: "☔" };
  return { label: "天気", emoji: "🌡️" };
}

export async function fetchWeather(lat: number, lng: number, signal?: AbortSignal): Promise<Weather> {
  // 外部に送る位置は 0.01度（約1km）に丸める
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}` +
    "&current=weather_code,temperature_2m" +
    "&hourly=precipitation_probability&forecast_hours=3" +
    "&timezone=Asia%2FTokyo";

  // 応答がないまま待ち続けないよう、5秒で打ち切る（天気がわからなくても先に進めるように）
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!res.ok) throw new Error(`天気を取れませんでした（${res.status}）`);
  const json = (await res.json()) as {
    current?: { weather_code?: number; temperature_2m?: number };
    hourly?: { precipitation_probability?: (number | null)[] };
  };

  const code = json.current?.weather_code ?? -1;
  const probabilities = (json.hourly?.precipitation_probability ?? []).filter(
    (p): p is number => typeof p === "number",
  );
  const maxRainProbability = probabilities.length > 0 ? Math.max(...probabilities) : null;

  return {
    ...describe(code),
    isRainy: RAIN_CODES.has(code) || (maxRainProbability ?? 0) >= RAIN_PROBABILITY,
    temperature: json.current?.temperature_2m ?? null,
    maxRainProbability,
  };
}
