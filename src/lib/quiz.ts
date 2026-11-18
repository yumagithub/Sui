import type { Area, Budget, Conditions, Mood } from "./conditions";

// ---- 質問 ----

export type Hunger = "starving" | "sweet" | "fine";
export type Vibe = "chill" | "lively" | "scenery" | "explore";
export type Place = "outside" | "inside" | "either";

export type QuizAnswers = {
  area: Area;
  hunger: Hunger;
  vibe: Vibe;
  place: Place;
  budget: Budget;
};

type Option<T> = { value: T; emoji: string; label: string };

export const HUNGER_OPTIONS: Option<Hunger>[] = [
  { value: "starving", emoji: "🍜", label: "ペコペコ！がっつり食べたい" },
  { value: "sweet", emoji: "🍰", label: "甘いものならいける" },
  { value: "fine", emoji: "🙆", label: "まだ平気" },
];

export const VIBE_OPTIONS: Option<Vibe>[] = [
  { value: "chill", emoji: "🛋️", label: "のんびりしたい" },
  { value: "lively", emoji: "🎉", label: "みんなでわいわい" },
  { value: "scenery", emoji: "🌅", label: "いい景色が見たい" },
  { value: "explore", emoji: "🧭", label: "行ったことないとこ開拓" },
];

export const PLACE_OPTIONS: Option<Place>[] = [
  { value: "outside", emoji: "🌬️", label: "外で風を感じたい" },
  { value: "inside", emoji: "🏠", label: "中でまったり" },
  { value: "either", emoji: "🤷", label: "どっちでも" },
];

export const BUDGET_QUIZ_OPTIONS: Option<Budget>[] = [
  { value: "1000", emoji: "🪙", label: "〜1,000円" },
  { value: "3000", emoji: "💴", label: "〜3,000円" },
  { value: "5000", emoji: "💰", label: "〜5,000円" },
  { value: "any", emoji: "✨", label: "気にしない" },
];

// ---- タイプ ----

export type QuizTypeId =
  | "hungry-explorer"
  | "sweets-hopper"
  | "cafe-chiller"
  | "party-player"
  | "sunset-hunter"
  | "nature-reset"
  | "photo-seeker"
  | "new-frontier";

export type QuizType = {
  id: QuizTypeId;
  emoji: string;
  name: string;
  description: string;
  /** 結果の見出しの背景（NativeWind のクラス） */
  bg: string;
  /** 候補を出すときの気分 */
  moods: Mood[];
};

export const QUIZ_TYPES: Record<QuizTypeId, QuizType> = {
  "hungry-explorer": {
    id: "hungry-explorer",
    emoji: "🍜",
    name: "腹ペコ探検家",
    description: "まずはお腹から。うまい店を見つけたら、その日はもう勝ち。",
    bg: "bg-orange-100",
    moods: ["food"],
  },
  "sweets-hopper": {
    id: "sweets-hopper",
    emoji: "🍰",
    name: "甘いもの巡り",
    description: "甘いものは別腹。おしゃべりしながら、はしごしよう。",
    bg: "bg-pink-100",
    moods: ["cafe"],
  },
  "cafe-chiller": {
    id: "cafe-chiller",
    emoji: "☕",
    name: "カフェでまったり派",
    description: "急がない、焦らない。いい席でゆっくり話すのがいちばん。",
    bg: "bg-amber-100",
    moods: ["cafe"],
  },
  "party-player": {
    id: "party-player",
    emoji: "🎳",
    name: "わいわい遊び人",
    description: "体を動かして、笑って、気づいたら夕方。",
    bg: "bg-violet-100",
    moods: ["play"],
  },
  "sunset-hunter": {
    id: "sunset-hunter",
    emoji: "🌅",
    name: "夕日ハンター",
    description: "空の色が変わる時間を、いちばんいい場所で。",
    bg: "bg-rose-100",
    moods: ["nature"],
  },
  "nature-reset": {
    id: "nature-reset",
    emoji: "🌿",
    name: "自然でリセット派",
    description: "海と緑で深呼吸。スマホは少しおやすみ。",
    bg: "bg-emerald-100",
    moods: ["nature"],
  },
  "photo-seeker": {
    id: "photo-seeker",
    emoji: "📸",
    name: "映えスポット狙い",
    description: "今日の一枚を撮りにいこう。景色もカフェも全部素材。",
    bg: "bg-sky-100",
    moods: ["nature", "cafe"],
  },
  "new-frontier": {
    id: "new-frontier",
    emoji: "🧭",
    name: "新しいとこ開拓者",
    description: "いつもの場所はおやすみ。まだ知らない中部へ。",
    bg: "bg-teal-100",
    moods: [],
  },
};

export function isQuizTypeId(value: string | undefined): value is QuizTypeId {
  return !!value && value in QUIZ_TYPES;
}

/** お腹の空き具合と気分（と外か中か）からタイプを決める */
export function typeOf(answers: Pick<QuizAnswers, "hunger" | "vibe" | "place">): QuizTypeId {
  if (answers.hunger === "starving") return "hungry-explorer";
  if (answers.hunger === "sweet") return answers.vibe === "chill" ? "cafe-chiller" : "sweets-hopper";
  switch (answers.vibe) {
    case "chill":
      return "nature-reset";
    case "lively":
      return "party-player";
    case "scenery":
      return answers.place === "outside" ? "sunset-hunter" : "photo-seeker";
    case "explore":
      return "new-frontier";
  }
}

/**
 * 答えを、候補を出すときの条件に置き換える。
 * 沖縄は車社会なので、診断では車ありとして出す（駐車場ありを優先）。
 */
export function toConditions(answers: QuizAnswers, isRainy: boolean): Conditions {
  const type = QUIZ_TYPES[typeOf(answers)];
  return {
    area: answers.area,
    hasCar: true,
    budget: answers.budget,
    moods: type.moods,
    preferIndoor: answers.place === "inside" || (answers.place === "either" && isRainy),
  };
}
