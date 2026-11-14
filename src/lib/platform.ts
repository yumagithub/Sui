import { Platform } from "react-native";

/** Web のサーバー側描画（SSR）中か。ブラウザの保存先などが使えない */
export const isServer = Platform.OS === "web" && typeof window === "undefined";
