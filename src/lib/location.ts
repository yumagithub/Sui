import * as Location from "expo-location";

export class LocationDeniedError extends Error {}

/** 位置情報の許可をもらって、今いる場所を返す（許可されなければ LocationDeniedError） */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new LocationDeniedError("位置情報が許可されていません");

  // 5分以内に取った位置があればそれを使う（速い）
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
  } catch {
    // Web などで使えないときは下へ
  }

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}
