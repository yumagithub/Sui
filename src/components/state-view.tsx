import { ActivityIndicator, View } from "react-native";

import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";

import { Button } from "./button";

/** 画面の真ん中に出す読み込み中 */
export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-sand px-6 py-24" accessibilityLabel={label ?? "読み込み中"}>
      <ActivityIndicator size="large" color={COLORS.sea} />
      {label ? <Text className="text-sm text-ink-soft">{label}</Text> : null}
    </View>
  );
}

type ProblemProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** エラーや「見つからない」のときの表示。ひとこと＋次にできること */
export function Problem({ title, message, actionLabel, onAction }: ProblemProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-sand px-6 py-24">
      <Text className="text-4xl" accessibilityElementsHidden importantForAccessibility="no">
        🌀
      </Text>
      <Text className="text-center text-lg font-bold text-ink">{title}</Text>
      {message ? <Text className="text-center text-sm leading-5 text-ink-soft">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-4 w-full max-w-xs">
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
