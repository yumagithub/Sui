import { useNetworkState } from "expo-network";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isServer } from "@/lib/platform";

/** オフラインのあいだだけ、画面の上に小さく出す（サーバー側描画では出さない） */
export function OfflineBanner() {
  return isServer ? null : <Banner />;
}

function Banner() {
  const insets = useSafeAreaInsets();
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  if (!offline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(150)}
      style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16, zIndex: 10 }}
      pointerEvents="none"
    >
      <View className="rounded-2xl bg-slate-800 px-4 py-3" accessibilityRole="alert">
        <Text className="text-center text-sm font-semibold text-white">
          オフラインみたい。つながったら自動で読み直すよ
        </Text>
      </View>
    </Animated.View>
  );
}
