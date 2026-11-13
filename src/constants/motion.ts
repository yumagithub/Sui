import { cubicBezier, Easing } from "react-native-reanimated";

// expo-animation スキルの値。UI は ease-out、ease-in は使わない。
/** CSS transition 用 */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
/** withTiming / Keyframe 用 */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** 押したときの縮み（ボタン・選択肢） */
export const PRESS_SCALE = 0.97;
export const PRESS_DURATION_MS = 120;

/** カードの登場 */
export const CARD_ENTER_MS = 250;
export const CARD_STAGGER_MS = 60;
export const CARD_EXIT_MS = 150;
