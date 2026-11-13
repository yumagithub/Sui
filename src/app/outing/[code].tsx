import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function OutingVote() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <View className="flex-1 items-center justify-center gap-2 bg-white px-6">
      <Text className="text-xl font-bold text-slate-900">どこ行く？</Text>
      <Text className="text-sm text-slate-500">共有コード: {code}</Text>
    </View>
  );
}
