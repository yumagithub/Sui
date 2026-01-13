"use client";

import { useRouter } from "next/navigation";
import ActionSearchBar from "@/components/kokonutui/action-search-bar";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header";
import { CategoryTabs } from "@/components/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { categories, spots, actions as actionsData } from "@/lib/data";

export default function Page() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // actionsをレンダリング形式に変換
  const actions = actionsData.map((action) => ({
    ...action,
    icon: <action.icon className={`h-4 w-4 ${action.color || ""}`} />,
  }));

  const toggleFavorite = (spotId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(spotId)) {
      newFavorites.delete(spotId);
    } else {
      newFavorites.add(spotId);
    }
    setFavorites(newFavorites);
  };

  const filteredSpots =
    selectedCategory === "all"
      ? spots
      : spots.filter((spot) => spot.category === selectedCategory);

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-sky-50 dark:from-black dark:to-zinc-900 pb-24">
      {/* Header */}
      <Header />

      {/* Search Bar */}
      <ActionSearchBar
        placeholder="スポット名・カテゴリで検索"
        actions={actions}
        onSubmit={(query) =>
          router.push(`/search?q=${encodeURIComponent(query)}`)
        }
        onActionSelect={(a) => setSelectedCategory(a.id)}
      />

      {/* Categories */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      >
        {/* Spots List */}
        <div className="px-6 py-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {selectedCategory === "all"
              ? "おすすめスポット"
              : `${
                  categories.find((c) => c.id === selectedCategory)?.label || ""
                }のスポット`}
          </h2>

          <div className="space-y-4">
            {filteredSpots.map((spot) => (
              <Card
                key={spot.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white/80 dark:bg-zinc-900/80"
                onClick={() => router.push(`/spot/${spot.id}`)}
              >
                {/* Image Area */}
                <div className="relative h-48 w-full bg-zinc-200 dark:bg-zinc-700">
                  <Image
                    src={spot.image}
                    alt={spot.name}
                    className="object-cover"
                    fill
                  />
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(spot.id);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        favorites.has(spot.id)
                          ? "fill-red-500 text-red-500"
                          : "text-zinc-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Info Area */}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {spot.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {categories.find((c) => c.id === spot.category)
                            ?.label || spot.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{spot.rating}</span>
                          <span className="text-zinc-500">
                            ({spot.review}件)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {spot.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <MapPin className="h-4 w-4" />
                      <span>{spot.distance}</span>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/spot/${spot.id}`);
                      }}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CategoryTabs>
    </div>
  );
}
