import { Text, View } from "react-native";

import { PressableScale } from "./pressable-scale";

type Props = {
  emoji: string;
  label: string;
  selected?: boolean;
  /** 雨のときの「中でまったり」など、そっとすすめたいとき */
  hint?: string;
  onPress: () => void;
};

/** 診断の選択肢（大きなカード） */
export function QuizOption({ emoji, label, selected, hint, onPress }: Props) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={hint ? `${label}（${hint}）` : label}>
      <View
        className={`min-h-16 flex-row items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 ${
          selected ? "border-teal-600" : "border-transparent"
        }`}
      >
        <Text className="text-3xl">{emoji}</Text>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-bold text-slate-800">{label}</Text>
          {hint ? <Text className="text-xs font-semibold text-teal-700">{hint}</Text> : null}
        </View>
      </View>
    </PressableScale>
  );
}
