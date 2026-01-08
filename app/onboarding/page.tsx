"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    title: "気分からスポット提案",
    description:
      "行きたい雰囲気やカテゴリーを選ぶと、沖縄のおすすめスポットを提案します。",
    badge: "Step 1",
    image: "/onboarding/step-1.svg",
    accent: "from-emerald-200 to-emerald-500",
  },
  {
    title: "ルートをワンタップ作成",
    description:
      "現在地から最適な周遊ルートを自動生成。移動時間もまとめて確認できます。",
    badge: "Step 2",
    image: "/onboarding/step-2.svg",
    accent: "from-sky-200 to-sky-500",
  },
  {
    title: "お気に入りを同期",
    description: "気に入ったスポットは保存して、次の旅行計画に役立てよう！",
    badge: "Step 3",
    image: "/onboarding/step-3.svg",
    accent: "from-amber-200 to-amber-500",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setCurrentIndex(api.selectedScrollSnap());

    handleSelect(); // Initialize on mount

    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-white to-sky-50 px-6 dark:from-black dark:to-zinc-900">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
          今日はどこ行く？
        </h1>
        <Carousel
          className="w-full h-[75svh] sm:h-140"
          opts={{ align: "start" }}
          setApi={setApi}
        >
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.title} className="h-full">
                <Card className="h-full border-0 bg-white/80 shadow-lg backdrop-blur dark:bg-zinc-900/80 sm:rounded-xl flex flex-col min-h-140">
                  <CardContent className="flex-1 flex flex-col gap-6 p-6 text-center">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {slide.badge} / {slides.length}
                      </span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                        旅の準備
                      </span>
                    </div>

                    <div className="relative w-full h-64 flex items-center justify-center">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        width={300}
                        height={300}
                        className="object-contain"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                          {slide.title}
                        </h2>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {slide.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2 justify-between">
                      <Button
                        variant="ghost"
                        className="text-sm"
                        onClick={() => router.push("/")}
                      >
                        スキップ
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => api?.scrollPrev()}
                          disabled={currentIndex === 0}
                        >
                          戻る
                        </Button>
                        <Button
                          onClick={() => {
                            if (currentIndex === slides.length - 1) {
                              router.push("/");
                              return;
                            }
                            api?.scrollNext();
                          }}
                        >
                          {currentIndex === slides.length - 1
                            ? "はじめる"
                            : "次へ"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="-left-10 hidden sm:flex" />
          <CarouselNext className="-right-10 hidden sm:flex" />
        </Carousel>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            {slides.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  dotIndex === currentIndex
                    ? "w-6 bg-emerald-500"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
