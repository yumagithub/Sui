import * as Linking from "expo-linking";

type Place = {
  name: string;
  municipality: string;
  google_maps_url?: string | null;
  lat?: number | null;
  lng?: number | null;
};

/** Googleマップで開くURL。登録したURLがなければ緯度経度から、それもなければ名前で検索する */
export function mapsUrl(place: Place) {
  if (place.google_maps_url) return place.google_maps_url;
  const query =
    place.lat != null && place.lng != null
      ? `${place.lat},${place.lng}`
      : `${place.name} ${place.municipality}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function openMaps(place: Place) {
  return Linking.openURL(mapsUrl(place));
}
