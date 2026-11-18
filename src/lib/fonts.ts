import { MPLUSRounded1c_500Medium } from "@expo-google-fonts/m-plus-rounded-1c/500Medium";
import { MPLUSRounded1c_800ExtraBold } from "@expo-google-fonts/m-plus-rounded-1c/800ExtraBold";
import { useFonts } from "expo-font";

/** アプリに同梱した丸いフォントを読み込む（読み終わるか失敗したら true） */
export function useAppFonts() {
  const [loaded, error] = useFonts({ MPLUSRounded1c_500Medium, MPLUSRounded1c_800ExtraBold });
  return loaded || error != null;
}
