import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";

import { focusRing } from "./button";
import { Sticker } from "./sticker";

type Props = {
  emoji: string;
  label: string;
  selected?: boolean;
  hint?: string;
  onPress: () => void;
};

/** 大きな選択肢（診断の「今どのへん？」など）。白いステッカーで、選ぶと海の色 */
export function QuizOption({ emoji, label, selected, hint, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      style={focusRing}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}（${hint}）` : label}
      accessibilityState={{ selected }}
    >
      <Sticker color={selected ? COLORS.seaTint : COLORS.white} radius={20} offset={4} pressed={pressed}>
        <View className="min-h-16 flex-row items-center gap-4 px-5 py-4">
          <Text className="text-3xl" accessibilityElementsHidden importantForAccessibility="no">
            {emoji}
          </Text>
          <View className="flex-1 gap-0.5">
            <Text className="text-[17px] font-bold text-ink">{label}</Text>
            {hint ? <Text className="text-xs font-bold text-sea-ink">{hint}</Text> : null}
          </View>
        </View>
      </Sticker>
    </Pressable>
  );
}
