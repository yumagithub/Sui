import { useState, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { CSS_EASE_OUT, PRESS_DURATION_MS, PRESS_SCALE } from "@/constants/motion";

type Props = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** 押した瞬間に少しだけ縮むボタン（Reanimated の CSS transition。JS スレッドを使わない） */
export function PressableScale({ children, style, disabled, onPressIn, onPressOut, ...props }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...props}
      disabled={disabled}
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
    >
      <Animated.View
        style={[
          {
            transitionProperty: "transform",
            transitionDuration: PRESS_DURATION_MS,
            transitionTimingFunction: CSS_EASE_OUT,
            transform: [{ scale: pressed && !disabled ? PRESS_SCALE : 1 }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
