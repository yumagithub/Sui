import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { CaptchaCancelledError, useEnsureSession } from "@/lib/auth";
import { toStoredConditions, type Conditions } from "@/lib/conditions";
import { myOutingsQueryKey } from "@/lib/outings";
import { saveDisplayName } from "@/lib/prefs";
import { supabase } from "@/lib/supabase";

import { Button } from "./button";
import { NameSheet } from "./name-form";

type Props = {
  spotIds: string[];
  conditions: Conditions;
  disabled?: boolean;
  /** 診断から作ったときのタイプなど、おでかけの条件に一緒に残したいもの */
  extraConditions?: Record<string, string>;
};

/** 「この3つで友達に聞く」：名前を聞いて、おでかけを作って投票ページへ */
export function AskFriendsButton({ spotIds, conditions, disabled, extraConditions }: Props) {
  const queryClient = useQueryClient();
  const ensureSession = useEnsureSession();
  const [nameOpen, setNameOpen] = useState(false);
  const [sessionFailed, setSessionFailed] = useState(false);

  const createOuting = useMutation({
    mutationFn: async (displayName: string) => {
      await ensureSession();
      const { data, error } = await supabase.rpc("create_outing", {
        spot_ids: spotIds,
        display_name: displayName,
        conditions: { ...toStoredConditions(conditions), ...extraConditions },
      });
      if (error || !data?.[0]) throw new Error(error?.message ?? "作れませんでした");
      await saveDisplayName(displayName);
      return data[0];
    },
    onSuccess: (outing) => {
      setNameOpen(false);
      queryClient.invalidateQueries({ queryKey: myOutingsQueryKey });
      router.push({ pathname: "/o/[code]", params: { code: outing.share_code, share: "1" } });
    },
  });

  return (
    <>
      {sessionFailed ? (
        <Text className="text-center text-sm text-red-600">うまくつながらなかった。もう一回試してね</Text>
      ) : null}
      <Button
        label="この3つで友達に聞く"
        onPress={async () => {
          createOuting.reset();
          setSessionFailed(false);
          // 名前の入力より先にログインしておく（CAPTCHA の画面と名前の画面が重ならないように）
          try {
            await ensureSession();
          } catch (e) {
            if (!(e instanceof CaptchaCancelledError)) setSessionFailed(true);
            return;
          }
          setNameOpen(true);
        }}
        disabled={disabled || spotIds.length !== 3}
      />
      <NameSheet
        visible={nameOpen}
        onClose={() => setNameOpen(false)}
        title="あなたのなまえは？"
        description="投票ページで、みんなに表示されます"
        submitLabel="投票ページを作る"
        loading={createOuting.isPending}
        error={
          createOuting.error
            ? createOuting.error.message.startsWith("ちょっと作りすぎかも")
              ? createOuting.error.message
              : "うまく作れなかった。もう一回試してね"
            : null
        }
        onSubmit={(name) => createOuting.mutate(name)}
      />
    </>
  );
}
