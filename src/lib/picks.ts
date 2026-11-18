import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { toPickArgs, type Conditions } from "./conditions";
import { supabase } from "./supabase";

async function pickCandidates(conditions: Conditions, excludeIds: string[]) {
  const { data, error } = await supabase.rpc("pick_candidates", toPickArgs(conditions, excludeIds));
  if (error) throw new Error(error.message);
  return data;
}

/**
 * 条件に合う3候補。redraw() で、これまでに出した候補を除いて引き直す
 * （同じ場所がすぐ戻ってこないように、除外は足していく）。
 * key は条件を表す文字列（URL のパラメータなど）。
 */
export function usePicks(conditions: Conditions | null, key: string) {
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ["picks", key, excludeIds],
    queryFn: () => pickCandidates(conditions!, excludeIds),
    enabled: conditions !== null,
    staleTime: Infinity,
  });
  const redraw = () => setExcludeIds((prev) => [...new Set([...prev, ...(query.data ?? []).map((s) => s.id)])]);
  return { query, excludeIds, redraw };
}
