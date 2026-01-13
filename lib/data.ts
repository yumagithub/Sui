import { LucideIcon } from "lucide-react";
import { Coffee, Landmark, ShoppingBag, Trees, Waves } from "lucide-react";

export interface Category {
  id: string;
  label: string;
}

export interface Spot {
  id: number;
  name: string;
  category: string;
  image: string;
  rating: number;
  review: number;
  distance: string;
  description: string;
  isFavorite: boolean;
}

export interface Action {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
}

export const categories: Category[] = [
  { id: "all", label: "すべて" },
  { id: "cafe", label: "カフェ" },
  { id: "beach", label: "ビーチ" },
  { id: "history_culture", label: "歴史/文化" },
  { id: "nature_park", label: "自然/公園" },
  { id: "shopping", label: "ショッピング" },
];

export const spots: Spot[] = [
  {
    id: 1,
    name: "美ら海水族館",
    category: "nature_park",
    image: "/spot/churaumi.jpg",
    rating: 4.8,
    review: 176,
    distance: "2.5km",
    description: "沖縄を代表する大型の水族館。ジンベエザメが泳ぐ大水槽が有名。",
    isFavorite: false,
  },
  {
    id: 2,
    name: "国際通り",
    category: "shopping",
    image: "/spot/kokusai-dori.jpg",
    rating: 4.5,
    review: 342,
    distance: "1.2km",
    description: "お土産店や飲食店が立ち並ぶ沖縄のメインストリート。",
    isFavorite: true,
  },
  {
    id: 3,
    name: "首里城",
    category: "history_culture",
    image: "/spot/shuri-castle.jpg",
    rating: 4.3,
    review: 215,
    distance: "3.8km",
    description: "琉球王国の象徴であった城。歴史的建造物と美しい庭園が魅力。",
    isFavorite: false,
  },
  {
    id: 4,
    name: "浜辺の茶屋",
    category: "cafe",
    image: "/spot/hamabe-no-chaya.jpg",
    rating: 4.6,
    review: 98,
    distance: "4.1km",
    description: "海を望む絶景カフェ。地元の食材を使った料理が人気。",
    isFavorite: false,
  },
  {
    id: 5,
    name: "石川ビーチ",
    category: "beach",
    image: "/spot/ishikawa-beach.jpg",
    rating: 5.0,
    review: 5900,
    distance: "3.5km",
    description: "地元民に愛される穴場ビーチ。",
    isFavorite: false,
  },
];

export const actions: Action[] = [
  {
    id: "cafe",
    label: "カフェ",
    icon: Coffee,
    color: "text-amber-600",
  },
  {
    id: "beach",
    label: "ビーチ",
    icon: Waves,
    color: "text-blue-500",
  },
  {
    id: "history_culture",
    label: "歴史/文化",
    icon: Landmark,
    color: "text-purple-600",
  },
  {
    id: "nature_park",
    label: "自然/公園",
    icon: Trees,
    color: "text-green-600",
  },
  {
    id: "shopping",
    label: "ショッピング",
    icon: ShoppingBag,
    color: "text-pink-500",
  },
];
