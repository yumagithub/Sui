import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { NameForm } from "@/components/name-form";
import { PressableScale } from "@/components/pressable-scale";
import { SpotCard, type SpotSummary } from "@/components/spot-card";
import { CSS_EASE_OUT } from "@/constants/motion";
import { useEnsureSession, useMe } from "@/lib/auth";
import {
  useCastVote,
  useJoinOuting,
  useMembers,
  useOuting,
  useOutingRealtime,
  useVotes,
  type Member,
  type Vote,
} from "@/lib/outings";
import { saveDisplayName } from "@/lib/prefs";
import { outingUrl, shareOuting, type ShareResult } from "@/lib/share";

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-4 bg-slate-50 px-6">{children}</View>;
}

/** 票数のバーと、投票した人の名前 */
function Tally({ votes, members, me, total }: { votes: Vote[]; members: Member[]; me: string; total: number }) {
  const names = votes.map((v) =>
    v.user_id === me ? "あなた" : (members.find((m) => m.user_id === v.user_id)?.display_name ?? "だれか"),
  );
  const ratio = total === 0 ? 0 : votes.length / total;

  return (
    <View className="mt-1 gap-1.5">
      <View className="flex-row items-center gap-3">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          {/* 中身のない絶対配置の要素なので width を CSS transition で動かす（expo-animation スキルの例外）。
              Animated.View には NativeWind の className が効かないので style で書く */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 999,
              backgroundColor: "#14b8a6",
              width: `${Math.round(ratio * 100)}%`,
              transitionProperty: "width",
              transitionDuration: 200,
              transitionTimingFunction: CSS_EASE_OUT,
            }}
          />
        </View>
        <Text className="w-10 text-right text-sm font-bold text-slate-700">{votes.length}票</Text>
      </View>
      {names.length > 0 ? (
        <Text className="text-xs text-slate-500" numberOfLines={2}>
          {names.join("・")}
        </Text>
      ) : null}
    </View>
  );
}

export default function OutingVote() {
  const insets = useSafeAreaInsets();
  const { code: rawCode, share } = useLocalSearchParams<{ code: string; share?: string }>();
  const code = (rawCode ?? "").toLowerCase();

  // 投票ページを開いた人は参加するので、まだなら匿名でログインしておく
  const me = useMe();
  const ensureSession = useEnsureSession();
  const [authError, setAuthError] = useState(false);
  // 「もう一回」で数字を進めて、ログインをやり直す
  const [authAttempt, setAuthAttempt] = useState(0);
  useEffect(() => {
    if (me.data === null) ensureSession().catch(() => setAuthError(true));
  }, [me.data, ensureSession, authAttempt]);

  const outing = useOuting(code, me.data);
  const outingId = outing.data?.id;
  const join = useJoinOuting(code);
  const votes = useVotes(outingId);
  const members = useMembers(outingId);
  const castVote = useCastVote(outingId, me.data);
  useOutingRealtime(outingId);

  // 送る
  const [shareNote, setShareNote] = useState<string | null>(null);
  async function share_() {
    let result: ShareResult;
    try {
      result = await shareOuting(code);
    } catch {
      // コピーもできなかったときは、リンクをそのまま見せる
      setShareNote(`このリンクを送ってね：${outingUrl(code)}`);
      return;
    }
    if (result === "copied") {
      setShareNote("リンクをコピーしたよ。LINEなどに貼ってね");
      setTimeout(() => setShareNote(null), 3000);
    }
  }
  // 作った直後は共有シートを自動で開く（Web は操作なしに開けないのでボタンで）
  const autoShared = useRef(false);
  useEffect(() => {
    if (share === "1" && outing.data && !autoShared.current && Platform.OS !== "web") {
      autoShared.current = true;
      share_();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 作った直後に1回だけ
  }, [share, outing.data]);

  if (authError) {
    return (
      <Centered>
        <Text className="text-base text-slate-600">うまく開けなかった…</Text>
        <Button
          label="もう一回"
          variant="secondary"
          onPress={() => {
            setAuthError(false);
            setAuthAttempt((n) => n + 1);
          }}
        />
      </Centered>
    );
  }

  if (me.isPending || me.data === null || outing.isPending) {
    return (
      <Centered>
        <ActivityIndicator size="large" color="#0d9488" />
      </Centered>
    );
  }

  if (outing.isError) {
    return (
      <Centered>
        <Text className="text-base text-slate-600">うまく読み込めなかった…</Text>
        <Button label="もう一回" variant="secondary" onPress={() => outing.refetch()} />
      </Centered>
    );
  }

  // まだ参加していない（またはコードが違う）
  if (!outing.data) {
    const notFound = (join.error as { code?: string } | null)?.code === "P0002";
    return (
      <ScrollView
        className="flex-1 bg-slate-50"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pt-8"
      >
        <NameForm
          title="どこ行く？ 投票に参加しよう"
          description="なまえを入れると、候補が見られるよ"
          submitLabel="参加する"
          loading={join.isPending}
          error={
            join.error
              ? notFound
                ? "このおでかけは見つからなかった。リンクを確かめてね"
                : "参加できなかった。もう一回試してね"
              : null
          }
          onSubmit={(name) => join.mutate(name, { onSuccess: () => saveDisplayName(name) })}
        />
      </ScrollView>
    );
  }

  const myId = me.data ?? "";
  const allVotes = votes.data ?? [];
  const myVote = allVotes.find((v) => v.user_id === myId)?.spot_id;
  const voting = outing.data.status === "voting";

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-4 px-5 pb-8 pt-4">
        <View className="gap-1">
          <Text className="text-xl font-bold text-slate-900">どこ行く？</Text>
          <Text className="text-sm text-slate-500">
            {voting
              ? myVote
                ? "投票したよ。ほかをタップすると変えられる"
                : "行きたいところをタップして投票してね"
              : "投票はおわりました"}
            {members.data ? `（参加 ${members.data.length}人）` : ""}
          </Text>
        </View>

        {outing.data.candidates.map((spot: SpotSummary, i) => {
          const spotVotes = allVotes.filter((v) => v.spot_id === spot.id);
          const selected = myVote === spot.id;
          return (
            <PressableScale
              key={spot.id}
              onPress={() => voting && !selected && castVote.mutate(spot.id)}
              disabled={!voting}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: !voting }}
              accessibilityLabel={`${spot.name}（${spotVotes.length}票）`}
            >
              <SpotCard spot={spot} index={i} selected={selected}>
                <Tally votes={spotVotes} members={members.data ?? []} me={myId} total={allVotes.length} />
              </SpotCard>
            </PressableScale>
          );
        })}

        {castVote.isError ? <Text className="text-sm text-red-600">投票できなかった。もう一回タップしてね</Text> : null}
      </ScrollView>

      <View className="gap-2 border-t border-slate-100 bg-white px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        {shareNote ? (
          <Text selectable className="text-center text-sm text-teal-700">
            {shareNote}
          </Text>
        ) : null}
        <Button label="友達に送る" variant={share === "1" ? "primary" : "secondary"} onPress={share_} />
      </View>
    </View>
  );
}
