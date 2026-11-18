import * as Haptics from "expo-haptics";
import { useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";
import { EASE_OUT } from "@/constants/motion";
import type { Question } from "@/lib/quiz";

/** これより大きく動かすか、速くはじいたら答えが決まる */
const COMMIT_DISTANCE = 110;
const COMMIT_VELOCITY = 800;
const FLY_MS = 220;

export type SwipeCardHandle = { answer: (yes: boolean) => void };

type Props = {
  question: Question;
  onAnswer: (yes: boolean) => void;
  ref?: Ref<SwipeCardHandle>;
};

function buzz() {
  if (Platform.OS !== "web") Haptics.selectionAsync();
}

/**
 * 診断のカード。右にはじくと Yes!、左にはじくと No!。
 * 指の動きに合わせて傾き、離したときの勢いで飛んでいくか戻るかが決まる（指を使う動きなので、戻りはばね）。
 * ボタンからは ref.answer(true/false) で同じ動きをさせる。
 */
export function SwipeCard({ question, onAnswer, ref }: Props) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const flyTo = Math.max(width, 420) * 1.2;

  // 新しい質問になったら真ん中に戻す
  // （React Compiler と相性がいいよう、ふつうの関数の中では .value への代入ではなく .set() を使う）
  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [question.id, x, y]);

  function commit(yes: boolean) {
    buzz();
    if (reduceMotion) {
      onAnswer(yes);
      return;
    }
    x.set(
      withTiming(yes ? flyTo : -flyTo, { duration: FLY_MS, easing: EASE_OUT }, (done) => {
        if (done) scheduleOnRN(onAnswer, yes);
      }),
    );
  }

  useImperativeHandle(ref, () => ({ answer: commit }));

  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    onUpdate: (e) => {
      "worklet";
      x.set(e.translationX);
      y.set(e.translationY * 0.25);
    },
    onDeactivate: (e) => {
      "worklet";
      const yes = e.translationX > COMMIT_DISTANCE || e.velocityX > COMMIT_VELOCITY;
      const no = e.translationX < -COMMIT_DISTANCE || e.velocityX < -COMMIT_VELOCITY;
      if (yes || no) {
        scheduleOnRN(buzz);
        x.set(
          withTiming(yes ? flyTo : -flyTo, { duration: FLY_MS, easing: EASE_OUT }, (done) => {
            if (done) scheduleOnRN(onAnswer, yes);
          }),
        );
      } else {
        x.set(withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: e.velocityX }));
      }
      y.set(withSpring(0, { duration: 400, dampingRatio: 0.8 }));
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-200, 0, 200], [-12, 0, 12])}deg` },
    ],
  }));
  const yesStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [20, COMMIT_DISTANCE], [0, 1], "clamp") }));
  const noStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-COMMIT_DISTANCE, -20], [1, 0], "clamp") }));

  const entering = useMemo(() => FadeIn.duration(reduceMotion ? 150 : 180), [reduceMotion]);
  const [line1, line2] = question.text.split("\n");

  return (
    <GestureDetector gesture={pan}>
      {/* 指で動かす transform（外側）と、登場のフェード（内側）は別の View に分ける。
          同じ View にすると、ネイティブでは登場アニメーションが transform を上書きすることがある */}
      <Animated.View
        style={[{ width: "100%", maxWidth: 360, aspectRatio: 0.82, alignSelf: "center" }, cardStyle]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={question.text.replace("\n", "")}
        accessibilityHint="右にはじくと Yes!、左にはじくと No!。下のボタンでも答えられます"
        accessibilityActions={[
          { name: "increment", label: "Yes!" },
          { name: "decrement", label: "No!" },
        ]}
        onAccessibilityAction={(e) => commit(e.nativeEvent.actionName === "increment")}
      >
        <Animated.View key={question.id} entering={entering} style={{ flex: 1 }}>
          {/* 影（ずらした紺の板） */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 7,
              left: 7,
              right: -7,
              bottom: -7,
              borderRadius: 32,
              backgroundColor: COLORS.ink,
            }}
          />
          <View
            style={{
              flex: 1,
              borderRadius: 32,
              borderWidth: 3,
              borderColor: COLORS.ink,
              backgroundColor: question.color,
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              gap: 20,
            }}
          >
            <Text className="text-7xl" accessibilityElementsHidden importantForAccessibility="no">
              {question.emoji}
            </Text>
            <View className="items-center">
              <Text className="text-center text-[30px] font-bold leading-[42px] text-ink">{line1}</Text>
              {line2 ? (
                <Text className="text-center text-[30px] font-bold leading-[42px] text-ink">{line2}</Text>
              ) : null}
            </View>
          </View>

          {/* カードが向かう側にスタンプが出る（左にはじけば左上に No!、右なら右上に Yes!）。
            下のボタンの並び（左 No! / 右 Yes!）ともそろえている */}
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", top: 28, right: 22, transform: [{ rotate: "12deg" }] }, yesStyle]}
          >
            <Stamp label="Yes!" color={COLORS.sea} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", top: 28, left: 22, transform: [{ rotate: "-12deg" }] }, noStyle]}
          >
            <Stamp label="No!" color={COLORS.coralInk} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function Stamp({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        borderWidth: 4,
        borderColor: color,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 4,
        backgroundColor: COLORS.white,
      }}
    >
      <Text className="text-[30px] font-bold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
