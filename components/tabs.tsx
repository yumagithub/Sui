"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: { id: string; label: string }[];
  children: ReactNode;
}

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
  categories,
  children,
}: CategoryTabsProps) {
  return (
    <div className="px-6 py-4 sticky top-20 z-10 bg-white/80 backdrop-blur-lg dark:bg-zinc-900/80 overflow-x-auto">
      <Tabs
        value={selectedCategory}
        onValueChange={onCategoryChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {children}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
