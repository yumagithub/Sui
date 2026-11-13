import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
      <Text className="text-3xl font-bold text-slate-900">Sui</Text>
      <Text className="text-base text-slate-500">行き先が、すっと決まる。</Text>
      {/* 条件えらびはこの画面に作る。今は投票ページへの仮リンク */}
      <Link href="/outing/demo" className="mt-6 text-sky-600">
        投票ページ（仮）を開く
      </Link>
    </View>
  );
}
