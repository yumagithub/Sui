import { findMunicipality, type Municipality } from "@/constants/areas";

import type { Database } from "./database.types";

export type Budget = "1000" | "3000" | "5000" | "any";
export type Mood = "food" | "cafe" | "play" | "nature";

export type Area =
  | { kind: "current"; lat: number; lng: number }
  | { kind: "municipality"; name: Municipality };

export type Conditions = {
  area: Area;
  hasCar: boolean;
  budget: Budget;
  /** 空ならおまかせ */
  moods: Mood[];
  preferIndoor: boolean;
};

export const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: "1000", label: "〜1,000円" },
  { value: "3000", label: "〜3,000円" },
  { value: "5000", label: "〜5,000円" },
  { value: "any", label: "気にしない" },
];

export const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "food", label: "ごはん" },
  { value: "cafe", label: "カフェ" },
  { value: "play", label: "遊ぶ" },
  { value: "nature", label: "自然・景色" },
];

const MOOD_CATEGORIES: Record<Mood, string[]> = {
  food: ["food"],
  cafe: ["cafe"],
  play: ["play"],
  nature: ["nature", "view"],
};

export function originOf(area: Area): { lat: number; lng: number } {
  if (area.kind === "current") return { lat: area.lat, lng: area.lng };
  const m = findMunicipality(area.name);
  if (!m) throw new Error(`知らない市町村: ${area.name}`);
  return { lat: m.lat, lng: m.lng };
}

type PickArgs = Database["public"]["Functions"]["pick_candidates"]["Args"];

export function toPickArgs(c: Conditions, excludeIds: string[]): PickArgs {
  const origin = originOf(c.area);
  const categories = [...new Set(c.moods.flatMap((m) => MOOD_CATEGORIES[m]))];
  return {
    origin_lat: origin.lat,
    origin_lng: origin.lng,
    has_car: c.hasCar,
    municipality: c.area.kind === "municipality" ? c.area.name : undefined,
    max_budget_yen: c.budget === "any" ? undefined : Number(c.budget),
    categories: categories.length > 0 ? categories : undefined,
    prefer_indoor: c.preferIndoor,
    exclude_ids: excludeIds,
  };
}

// ---- URL（/picks?...）との変換。Web で再読み込みしても同じ条件で出せるように ----

export type ConditionParams = {
  area: string;
  lat?: string;
  lng?: string;
  car: "1" | "0";
  budget: Budget;
  moods: string;
  indoor: "1" | "0";
};

export function toParams(c: Conditions): ConditionParams {
  return {
    area: c.area.kind === "current" ? "current" : c.area.name,
    ...(c.area.kind === "current"
      ? { lat: c.area.lat.toFixed(4), lng: c.area.lng.toFixed(4) }
      : {}),
    car: c.hasCar ? "1" : "0",
    budget: c.budget,
    moods: c.moods.join(","),
    indoor: c.preferIndoor ? "1" : "0",
  };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function fromParams(params: Record<string, string | string[] | undefined>): Conditions | null {
  const areaParam = first(params.area);
  let area: Area | null = null;
  if (areaParam === "current") {
    const lat = Number(first(params.lat));
    const lng = Number(first(params.lng));
    if (Number.isFinite(lat) && Number.isFinite(lng)) area = { kind: "current", lat, lng };
  } else if (areaParam) {
    const m = findMunicipality(areaParam);
    if (m) area = { kind: "municipality", name: m.name };
  }
  if (!area) return null;

  const budgetParam = first(params.budget);
  const budget = BUDGET_OPTIONS.some((b) => b.value === budgetParam) ? (budgetParam as Budget) : "any";
  const moods = (first(params.moods) ?? "")
    .split(",")
    .filter((m): m is Mood => MOOD_OPTIONS.some((o) => o.value === m));

  return {
    area,
    hasCar: first(params.car) === "1",
    budget,
    moods,
    preferIndoor: first(params.indoor) === "1",
  };
}
