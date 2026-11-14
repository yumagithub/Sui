import AsyncStorage from "@react-native-async-storage/async-storage";
import { isServer } from "./platform";

const DISPLAY_NAME_KEY = "sui.displayName";

/** 前に入れた表示名（なければ空文字） */
export async function loadDisplayName(): Promise<string> {
  if (isServer) return "";
  try {
    return (await AsyncStorage.getItem(DISPLAY_NAME_KEY)) ?? "";
  } catch {
    return "";
  }
}

export async function saveDisplayName(name: string) {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
  } catch {
    // 覚えられなくても次に入れ直せばよい
  }
}
