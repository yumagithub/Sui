import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useCaptcha } from "@/components/captcha/provider";

import { supabase } from "./supabase";

export { CaptchaCancelledError } from "@/components/captcha/provider";

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

// 同時に呼ばれても、匿名ユーザーを2人作らないように
let signingIn: Promise<string> | null = null;

/**
 * ログインしていなければ、CAPTCHA を通ってから匿名でログインして、ユーザーIDを返す。
 * CAPTCHA をやめたときは CaptchaCancelledError になる。
 */
export function useEnsureSession() {
  const queryClient = useQueryClient();
  const getCaptchaToken = useCaptcha();
  return useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user.id;

    signingIn ??= (async () => {
      const captchaToken = await getCaptchaToken();
      const { data: signedIn, error } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
      if (error || !signedIn.user) throw new Error(error?.message ?? "ログインできませんでした");
      queryClient.setQueryData(meQueryKey, signedIn.user.id);
      return signedIn.user.id;
    })().finally(() => {
      signingIn = null;
    });
    return signingIn;
  }, [queryClient, getCaptchaToken]);
}
