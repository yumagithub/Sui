import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';
import { GENRE_PREFS_KEY } from '@/app/onboarding';

type Spot = Database['public']['Tables']['spots']['Row'] & {
  genres: { slug: string; name: string }[];
};

type SuggestParams = {
  mood: string;
  time_of_day: string;
  genre_slugs?: string[];
  area?: string;
};

async function loadGenrePrefs(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(GENRE_PREFS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRouteSuggestion() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = async (params: SuggestParams) => {
    setLoading(true);
    setError(null);
    try {
      const savedGenres = await loadGenrePrefs();
      const genre_slugs = params.genre_slugs ?? (savedGenres.length > 0 ? savedGenres : undefined);

      const { data, error } = await supabase.functions.invoke('suggest-route', {
        body: { ...params, genre_slugs },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSpots(data.spots ?? []);
    } catch (e: any) {
      setError(e.message ?? 'ルート提案に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return { spots, loading, error, suggest };
}
