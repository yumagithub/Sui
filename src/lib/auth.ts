import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { supabase } from "./supabase";

export const meQueryKey = ["me"] as const;

/** 今ログインしているユーザーのID（まだなら null）。新しくユーザーは作らない */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.id ?? null;
    },
    staleTime: Infinity,
  });
}

/** ログインしていなければ匿名でログインして、ユーザーIDを返す */
export function useEnsureSession() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: signedIn, error } = await supabase.auth.signInAnonymously();
    if (error || !signedIn.user) throw new Error(error?.message ?? "ログインできませんでした");
    queryClient.setQueryData(meQueryKey, signedIn.user.id);
    return signedIn.user.id;
  }, [queryClient]);
}
