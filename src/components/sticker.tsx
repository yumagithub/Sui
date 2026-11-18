import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { COLORS } from "@/constants/colors";
import { CSS_EASE_OUT } from "@/constants/motion";

type Props = {
  children: ReactNode;
  /** 面の色（style の backgroundColor） */
  color?: string;
  radius?: number;
  /** 影のずれ（px） */
  offset?: number;
  /** 押しているあいだ、面が影の位置まで沈む */
  pressed?: boolean;
  /** 少し傾ける（診断のタイプのカードなど） */
  tilt?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Sui の「ステッカー」：紺の太いふちと、ずらしたベタ塗りの影。
 * 影は box-shadow ではなく後ろに置いた紺の板なので、iOS / Android / Web で同じに見える。
 * Animated.View には NativeWind の className が効かないので、見た目は style で書く。
 */
export function Sticker({ children, color = COLORS.white, radius = 22, offset = 5, pressed = false, tilt, style }: Props) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, tilt ? { transform: [{ rotate: `${tilt}deg` }] } : null, style]}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: COLORS.ink,
        }}
      />
      <Animated.View
        style={{
          backgroundColor: color,
          borderRadius: radius,
          borderWidth: 2.5,
          borderColor: COLORS.ink,
          overflow: "hidden",
          transitionProperty: "transform",
          transitionDuration: 90,
          transitionTimingFunction: CSS_EASE_OUT,
          transform: [{ translateX: pressed ? offset : 0 }, { translateY: pressed ? offset : 0 }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
