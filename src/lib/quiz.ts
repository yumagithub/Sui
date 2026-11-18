import type { Area, Budget, Conditions, Mood } from "./conditions";

// ---- 質問（Yes! / No! でスワイプ）----
// 前の答えで次の質問が変わる。場所のあとに3〜5枚（どの答え方でも5枚以内）。

export type QuestionId = "hungry" | "sweet" | "chill" | "party" | "scenery" | "explore" | "outside" | "wallet";
export type SwipeAnswers = Partial<Record<QuestionId, boolean>>;

export type Question = {
  id: QuestionId;
  emoji: string;
  text: string;
  /** カードの地の色 */
  color: string;
};

export const QUESTIONS: Record<QuestionId, Question> = {
  hungry: { id: "hungry", emoji: "🍜", text: "お腹すいてる？", color: "#FFD9C2" },
  sweet: { id: "sweet", emoji: "🍰", text: "甘いもの\n食べたい？", color: "#FFD6E2" },
  chill: { id: "chill", emoji: "🛋️", text: "のんびり\nしゃべりたい？", color: "#FFE9A8" },
  party: { id: "party", emoji: "🎉", text: "みんなで\nわいわいしたい？", color: "#E4DBFF" },
  scenery: { id: "scenery", emoji: "🌅", text: "いい景色が\n見たい？", color: "#C6E9FF" },
  explore: { id: "explore", emoji: "🧭", text: "行ったことない\nとこ行きたい？", color: "#C9F2DA" },
  outside: { id: "outside", emoji: "🌬️", text: "外に出たい\n気分？", color: "#D9F0FF" },
  wallet: { id: "wallet", emoji: "💰", text: "今日はお財布に\n余裕ある？", color: "#FFF1D6" },
};

/** 次に聞く質問（もう聞くことがなければ null） */
export function nextQuestion(a: SwipeAnswers): QuestionId | null {
  if (a.hungry === undefined) return "hungry";
  if (a.hungry === false) {
    if (a.sweet === undefined) return "sweet";
    if (a.sweet === true) {
      if (a.chill === undefined) return "chill";
    } else {
      if (a.party === undefined) return "party";
      if (a.party === false) {
        if (a.scenery === undefined) return "scenery";
        if (a.scenery === false && a.explore === undefined) return "explore";
      }
    }
  }
  // 「開拓」まで来た人には外か中かは聞かない（雨なら屋内を優先するだけ）
  const reachedExplore = a.scenery === false;
  if (!reachedExplore && a.outside === undefined) return "outside";
  // お財布は、お金がかかりやすい ごはん・カフェ・遊ぶ のときだけ聞く
  const spends = a.hungry === true || a.sweet === true || a.party === true;
  if (spends && a.wallet === undefined) return "wallet";
  return null;
}

/** いくつ答えたか（進み具合の表示用） */
export function answeredCount(a: SwipeAnswers) {
  return Object.keys(a).length;
}

/** 答えからタイプを決める（答え終わってから呼ぶ） */
export function typeFromAnswers(a: SwipeAnswers): QuizTypeId {
  if (a.hungry) return "hungry-explorer";
  if (a.sweet) return a.chill ? "cafe-chiller" : "sweets-hopper";
  if (a.party) return "party-player";
  if (a.scenery) return a.outside ? "sunset-hunter" : "photo-seeker";
  return a.explore ? "new-frontier" : "nature-reset";
}

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
  /** 結果のステッカーの色 */
  color: string;
  /** 候補を出すときの気分 */
  moods: Mood[];
};

export const QUIZ_TYPES: Record<QuizTypeId, QuizType> = {
  "hungry-explorer": {
    id: "hungry-explorer",
    color: "#FFB98A",
    emoji: "🍜",
    name: "腹ペコ探検家",
    description: "まずはお腹から。うまい店を見つけたら、その日はもう勝ち。",
    bg: "bg-orange-100",
    moods: ["food"],
  },
  "sweets-hopper": {
    id: "sweets-hopper",
    color: "#FFB8CC",
    emoji: "🍰",
    name: "甘いもの巡り",
    description: "甘いものは別腹。おしゃべりしながら、はしごしよう。",
    bg: "bg-pink-100",
    moods: ["cafe"],
  },
  "cafe-chiller": {
    id: "cafe-chiller",
    color: "#FFE07A",
    emoji: "☕",
    name: "カフェでまったり派",
    description: "急がない、焦らない。いい席でゆっくり話すのがいちばん。",
    bg: "bg-amber-100",
    moods: ["cafe"],
  },
  "party-player": {
    id: "party-player",
    color: "#C9B8FF",
    emoji: "🎳",
    name: "わいわい遊び人",
    description: "体を動かして、笑って、気づいたら夕方。",
    bg: "bg-violet-100",
    moods: ["play"],
  },
  "sunset-hunter": {
    id: "sunset-hunter",
    color: "#FFAE8F",
    emoji: "🌅",
    name: "夕日ハンター",
    description: "空の色が変わる時間を、いちばんいい場所で。",
    bg: "bg-rose-100",
    moods: ["nature"],
  },
  "nature-reset": {
    id: "nature-reset",
    color: "#9FE6BD",
    emoji: "🌿",
    name: "自然でリセット派",
    description: "海と緑で深呼吸。スマホは少しおやすみ。",
    bg: "bg-emerald-100",
    moods: ["nature"],
  },
  "photo-seeker": {
    id: "photo-seeker",
    color: "#9DD6FF",
    emoji: "📸",
    name: "映えスポット狙い",
    description: "今日の一枚を撮りにいこう。景色もカフェも全部素材。",
    bg: "bg-sky-100",
    moods: ["nature", "cafe"],
  },
  "new-frontier": {
    id: "new-frontier",
    color: "#8FE3D6",
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

/**
 * 答えを、候補を出すときの条件に置き換える。
 * 沖縄は車社会なので、診断では車ありとして出す（駐車場ありを優先）。
 * 外に出たくなければ屋内を優先。外に出たくても、雨なら屋内を優先する。
 */
export function toConditions(area: Area, answers: SwipeAnswers, isRainy: boolean): Conditions {
  const type = QUIZ_TYPES[typeFromAnswers(answers)];
  const budget: Budget = answers.wallet === false ? "1000" : "any";
  return {
    area,
    hasCar: true,
    budget,
    moods: type.moods,
    preferIndoor: answers.outside === false || isRainy,
  };
}
