import { Text, View } from "react-native";

import { PressableScale } from "./pressable-scale";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 複数選択なら checkbox、1つだけなら radio として読み上げる */
  role?: "radio" | "checkbox";
  disabled?: boolean;
};

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
        className={`min-h-11 justify-center rounded-full border px-4 ${
          selected ? "border-teal-600 bg-teal-600" : "border-slate-200 bg-white"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <Text className={`text-[15px] font-semibold ${selected ? "text-white" : "text-slate-700"}`}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
