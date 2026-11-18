import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";

import { Sticker } from "./sticker";

type Props = {
  label: string;
  onPress: () => void;
  /** primary：夕日のステッカー（画面に1つ）／ secondary：白いステッカー／ quiet：文字だけ */
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = "primary", disabled, loading }: Props) {
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;

  if (variant === "quiet") {
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        className="min-h-11 items-center justify-center px-3"
      >
        <Text className="text-[15px] font-bold" style={{ color: inactive ? COLORS.inkFaint : COLORS.seaInk }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  const face = disabled ? COLORS.sandDeep : variant === "primary" ? COLORS.sunset : COLORS.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      pressRetentionOffset={16}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      <Sticker color={face} radius={18} offset={variant === "primary" ? 5 : 4} pressed={pressed && !inactive}>
        <View className="min-h-14 flex-row items-center justify-center gap-2 px-5">
          {loading ? <ActivityIndicator color={COLORS.ink} /> : null}
          {/* 状態で変わる色は style で指定する（Web で className を切り替えると古いクラスが残ることがあったため） */}
          <Text className="text-[17px] font-bold" style={{ color: disabled ? COLORS.inkFaint : COLORS.ink }}>
            {label}
          </Text>
        </View>
      </Sticker>
    </Pressable>
  );
}
