import "../global.css";

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="outing/[code]" options={{ title: "投票" }} />
    </Stack>
  );
}
