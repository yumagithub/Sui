import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";

import { Text } from "@/components/text";
import { CaptchaCancelledError, useEnsureSession } from "@/lib/auth";
import { toStoredConditions, type Conditions } from "@/lib/conditions";
import { myOutingsQueryKey } from "@/lib/outings";
import { supabase } from "@/lib/supabase";

import { Button } from "./button";

type Props = {
  spotIds: string[];
  /** えらんだ場所（まだなら undefined） */
  chosenId: string | undefined;
  conditions: Conditions;
  extraConditions?: Record<string, string>;
};

/** ひとりのとき：えらんだ場所にすぐ決めて、決定画面へ（名前の入力はいらない） */
export function GoSoloButton({ spotIds, chosenId, conditions, extraConditions }: Props) {
  const queryClient = useQueryClient();
  const ensureSession = useEnsureSession();
  const [failed, setFailed] = useState<string | null>(null);

  const go = useMutation({
    mutationFn: async () => {
      await ensureSession();
      const { data, error } = await supabase.rpc("create_solo_outing", {
        spot_ids: spotIds,
        chosen_spot_id: chosenId!,
        conditions: { ...toStoredConditions(conditions), ...extraConditions, mode: "solo" },
      });
      if (error || !data?.[0]) throw new Error(error?.message ?? "決められませんでした");
      return data[0];
    },
    onSuccess: (outing) => {
      queryClient.invalidateQueries({ queryKey: myOutingsQueryKey });
      router.push({ pathname: "/o/[code]", params: { code: outing.share_code } });
    },
    onError: (e) => {
      if (e instanceof CaptchaCancelledError) return;
      setFailed(e.message.startsWith("ちょっと作りすぎかも") ? e.message : "うまく決められなかった。もう一回試してね");
    },
  });

  return (
    <>
      {failed ? (
        <Text className="text-center text-sm font-bold text-coral-ink" accessibilityRole="alert">
          {failed}
        </Text>
      ) : null}
      <Button
        label="ここに行く！"
        onPress={() => {
          setFailed(null);
          go.mutate();
        }}
        disabled={!chosenId || spotIds.length !== 3}
        loading={go.isPending}
      />
    </>
  );
}
