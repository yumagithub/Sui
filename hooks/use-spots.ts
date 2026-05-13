import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Database } from '@/types/database';

type Spot = Database['public']['Tables']['spots']['Row'] & {
  genres: { slug: string; name: string }[];
};

export function useSpots(genreSlug?: string | null, keyword?: string) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('spots')
          .select('*, spot_genres(genres(slug, name))')
          .order('created_at', { ascending: false });

        if (keyword) {
          query = query.ilike('name', `%${keyword}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (cancelled) return;

        const normalized = (data ?? []).map((spot: any) => ({
          ...spot,
          genres: (spot.spot_genres ?? []).map((sg: any) => sg.genres).filter(Boolean),
        }));

        const filtered =
          genreSlug && genreSlug !== 'all'
            ? normalized.filter((s) => s.genres.some((g: any) => g.slug === genreSlug))
            : normalized;

        setSpots(filtered);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'データの取得に失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [genreSlug, keyword]);

  return { spots, loading, error };
}
