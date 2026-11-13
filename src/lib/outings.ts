import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { SpotSummary } from "@/components/spot-card";

import { supabase } from "./supabase";

export const myOutingsQueryKey = ["my-outings"] as const;
const outingKey = (code: string, me: string | null | undefined) => ["outing", code, me] as const;
const votesKey = (outingId: string) => ["votes", outingId] as const;
const membersKey = (outingId: string) => ["members", outingId] as const;

const SPOT_COLUMNS =
  "id, name, description, category, municipality, is_indoor, has_parking, car_free_ok, budget_yen, photo_url";

// outings と outing_candidates は外部キーが2本ある（候補→おでかけ / 決定→候補）ので、どちらを辿るか指定する
const CANDIDATES = "outing_candidates!outing_candidates_outing_id_fkey";

export type Outing = {
  id: string;
  share_code: string;
  status: string;
  created_by: string;
  created_at: string;
  candidates: SpotSummary[];
};

/**
 * 共有コードでおでかけを読む。参加していなければ RLS で見えないので null。
 * （「存在しない」と「まだ参加していない」は、参加するまで区別できない）
 */
export function useOuting(code: string, me: string | null | undefined) {
  return useQuery({
    queryKey: outingKey(code, me),
    enabled: !!me,
    queryFn: async (): Promise<Outing | null> => {
      const { data, error } = await supabase
        .from("outings")
        .select(`id, share_code, status, created_by, created_at, ${CANDIDATES}(position, spot:spots(${SPOT_COLUMNS}))`)
        .eq("share_code", code)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const candidates = [...data.outing_candidates]
        .sort((a, b) => a.position - b.position)
        .map((c) => c.spot)
        .filter((s): s is NonNullable<typeof s> => s !== null);
      return { ...data, candidates };
    },
  });
}

export function useJoinOuting(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      const { data, error } = await supabase.rpc("join_outing", { share_code: code, display_name: displayName });
      if (error) throw Object.assign(new Error(error.message), { code: error.code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outing", code] });
      queryClient.invalidateQueries({ queryKey: myOutingsQueryKey });
    },
  });
}

export type Vote = { user_id: string; spot_id: string };
export type Member = { user_id: string; display_name: string };

export function useVotes(outingId: string | undefined) {
  return useQuery({
    queryKey: votesKey(outingId ?? ""),
    enabled: !!outingId,
    queryFn: async (): Promise<Vote[]> => {
      const { data, error } = await supabase.from("votes").select("user_id, spot_id").eq("outing_id", outingId!);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useMembers(outingId: string | undefined) {
  return useQuery({
    queryKey: membersKey(outingId ?? ""),
    enabled: !!outingId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("outing_members")
        .select("user_id, display_name")
        .eq("outing_id", outingId!)
        .order("joined_at");
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/** 投票する（変更もこれ）。押した瞬間に画面へ反映し、失敗したら戻す */
export function useCastVote(outingId: string | undefined, me: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (spotId: string) => {
      const { error } = await supabase
        .from("votes")
        .upsert({ outing_id: outingId!, user_id: me!, spot_id: spotId }, { onConflict: "outing_id,user_id" });
      if (error) throw new Error(error.message);
    },
    onMutate: async (spotId) => {
      const key = votesKey(outingId!);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Vote[]>(key);
      queryClient.setQueryData<Vote[]>(key, (votes = []) => [
        ...votes.filter((v) => v.user_id !== me),
        { user_id: me!, spot_id: spotId },
      ]);
      return { previous };
    },
    onError: (_e, _spotId, context) => {
      if (context?.previous) queryClient.setQueryData(votesKey(outingId!), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: votesKey(outingId!) }),
  });
}

/**
 * 票の変更をリアルタイムで受け取って、票と参加者を読み直す。
 * 購読が整う前の変更を取りこぼさないよう、整った時点でも一度読み直す。
 */
export function useOutingRealtime(outingId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!outingId) return;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: votesKey(outingId) });
      // 新しく参加した人の票が届いたときに名前を出せるよう、参加者も読み直す
      queryClient.invalidateQueries({ queryKey: membersKey(outingId) });
    };
    const channel = supabase
      .channel(`outing-votes-${outingId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `outing_id=eq.${outingId}` }, refresh)
      .on("system", {}, (message: { extension?: string; status?: string }) => {
        if (message.extension === "postgres_changes" && message.status === "ok") refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [outingId, queryClient]);
}

export type MyOuting = {
  id: string;
  share_code: string;
  status: string;
  created_at: string;
  spotNames: string[];
};

/** 自分が参加したおでかけ（新しい順） */
export function useMyOutings(me: string | null | undefined) {
  return useQuery({
    queryKey: [...myOutingsQueryKey, me],
    enabled: !!me,
    queryFn: async (): Promise<MyOuting[]> => {
      const { data, error } = await supabase
        .from("outing_members")
        .select(`joined_at, outing:outings!inner(id, share_code, status, created_at, ${CANDIDATES}(position, spot:spots(name)))`)
        .eq("user_id", me!)
        .order("joined_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data.map(({ outing }) => ({
        id: outing.id,
        share_code: outing.share_code,
        status: outing.status,
        created_at: outing.created_at,
        spotNames: [...outing.outing_candidates]
          .sort((a, b) => a.position - b.position)
          .map((c) => c.spot?.name ?? "（非公開のスポット）"),
      }));
    },
  });
}
