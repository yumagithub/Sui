import { ActivityIndicator, Text, View } from "react-native";

import { PressableScale } from "./pressable-scale";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = "primary", disabled, loading }: Props) {
  const primary = variant === "primary";
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      <View
        className={`min-h-14 flex-row items-center justify-center gap-2 rounded-2xl px-6 ${
          primary ? "bg-teal-600" : "border border-slate-200 bg-white"
        } ${disabled ? "opacity-40" : ""}`}
      >
        {loading ? <ActivityIndicator color={primary ? "#fff" : "#0f766e"} /> : null}
        <Text className={`text-base font-bold ${primary ? "text-white" : "text-slate-700"}`}>{label}</Text>
      </View>
    </PressableScale>
  );
}
