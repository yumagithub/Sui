import { View } from "react-native";

import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";

import { PressableScale } from "./pressable-scale";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 複数選択なら checkbox、1つだけなら radio として読み上げる */
  role?: "radio" | "checkbox";
  disabled?: boolean;
};

/** 選択肢の丸いタグ。選ぶと濃い海の色になる */
export function Chip({ label, selected, onPress, role = "radio", disabled }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      hitSlop={4}
    >
      <View
        className="min-h-11 justify-center rounded-full border-2 border-ink px-4"
        style={{ backgroundColor: selected ? COLORS.seaInk : COLORS.white, opacity: disabled ? 0.5 : 1 }}
      >
        <Text className="text-[15px] font-bold" style={{ color: selected ? COLORS.white : COLORS.ink }}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
