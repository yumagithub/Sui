import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/auth';

export type Visit = {
  id: string;
  spot_id: string;
  visited_at: string;
  memo: string | null;
  photo_paths: string[];
  spots: { name: string; area: string } | null;
};

export function useVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) { setVisits([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('id, spot_id, visited_at, memo, photo_paths, spots(name, area)')
        .eq('user_id', user.id)
        .order('visited_at', { ascending: false });
      if (error) throw error;
      setVisits((data ?? []) as Visit[]);
    } catch (e: any) {
      setError(e.message ?? '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addVisit = async (spotId: string, memo?: string) => {
    if (!user) throw new Error('ログインが必要です');
    const { error } = await supabase.from('visits').insert({
      user_id: user.id,
      spot_id: spotId,
      visited_at: new Date().toISOString(),
      memo: memo ?? null,
    });
    if (error) throw error;
    await fetch();
  };

  const deleteVisit = async (visitId: string) => {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', visitId)
      .eq('user_id', user?.id ?? '');
    if (error) throw error;
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
  };

  return { visits, loading, error, addVisit, deleteVisit, refetch: fetch };
}
