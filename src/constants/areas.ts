// 対象の7市町村。位置は役所・役場のだいたいの座標（天気の取得と、候補の距離の基準に使う）
export const MUNICIPALITIES = [
  { name: "うるま市", lat: 26.3794, lng: 127.8572 },
  { name: "沖縄市", lat: 26.3342, lng: 127.8056 },
  { name: "北谷町", lat: 26.3196, lng: 127.7637 },
  { name: "宜野湾市", lat: 26.2815, lng: 127.7784 },
  { name: "北中城村", lat: 26.3011, lng: 127.793 },
  { name: "中城村", lat: 26.2675, lng: 127.7911 },
  { name: "西原町", lat: 26.2167, lng: 127.759 },
] as const;

export type Municipality = (typeof MUNICIPALITIES)[number]["name"];

export function findMunicipality(name: string) {
  return MUNICIPALITIES.find((m) => m.name === name);
}
