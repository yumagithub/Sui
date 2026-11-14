import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "./button";

/** 画面の真ん中に出す読み込み中 */
export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-slate-50 px-6 py-24" accessibilityLabel={label ?? "読み込み中"}>
      <ActivityIndicator size="large" color="#0d9488" />
      {label ? <Text className="text-sm text-slate-500">{label}</Text> : null}
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
    <View className="flex-1 items-center justify-center gap-2 bg-slate-50 px-6 py-24">
      <Text className="text-center text-base font-bold text-slate-800">{title}</Text>
      {message ? <Text className="text-center text-sm text-slate-500">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-3">
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
