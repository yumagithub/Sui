import { ScrollView, View } from "react-native";
import { Text } from "@/components/text";

import { CONTACT, EFFECTIVE_DATE, OPERATOR } from "@/constants/legal";

export type LegalSection = { title: string; body: string[] };

/** 利用規約・プライバシーポリシーの共通の見た目 */
export function LegalPage({ intro, sections }: { intro: string; sections: LegalSection[] }) {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-5 pb-12 pt-4"
    >
      <Text className="text-sm leading-6 text-ink-soft">{intro}</Text>
      {sections.map((section, i) => (
        <View key={section.title} className="gap-2">
          <Text className="text-base font-bold text-ink" accessibilityRole="header">
            {i + 1}. {section.title}
          </Text>
          {section.body.map((line) => (
            <Text key={line} className="text-sm leading-6 text-ink">
              {line}
            </Text>
          ))}
        </View>
      ))}
      <View className="gap-1 border-t border-ink/10 pt-4">
        <Text className="text-xs text-ink-soft">運営：{OPERATOR}</Text>
        <Text className="text-xs text-ink-soft">お問い合わせ：{CONTACT}</Text>
        <Text className="text-xs text-ink-soft">制定日：{EFFECTIVE_DATE}</Text>
      </View>
    </ScrollView>
  );
}
