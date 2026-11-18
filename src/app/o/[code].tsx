import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { DecideSheet } from "@/components/decide-sheet";
import { DecidedView } from "@/components/decided-view";
import { NameForm } from "@/components/name-form";
import { PressableScale } from "@/components/pressable-scale";
import { SpotCard, type SpotSummary } from "@/components/spot-card";
import { Loading, Problem } from "@/components/state-view";
import { Tally } from "@/components/tally";
import { useEnsureSession, useMe } from "@/lib/auth";
import {
  canAskFeedback,
  useAnswerFeedback,
  useCastVote,
  useDecideOuting,
  useJoinOuting,
  useMyFeedback,
  useMembers,
  useOuting,
  useOutingRealtime,
  useVotes,
} from "@/lib/outings";
import { saveDisplayName } from "@/lib/prefs";
import { outingUrl, shareOuting, type ShareResult } from "@/lib/share";

/** 作った人向けの進み具合：①送る ②待つ ③決定 */
function Steps({ current }: { current: number }) {
  const labels = ["友達に送る", "投票を待つ", "決定する"];
  return (
    <View className="flex-row items-center gap-2" accessibilityLabel={`3つのうち${current + 1}つ目：${labels[current]}`}>
      {labels.map((label, i) => (
        <View key={label} className="flex-1 flex-row items-center gap-1.5">
          <View
            className="h-7 w-7 items-center justify-center rounded-full border-2 border-ink"
            style={{ backgroundColor: i < current ? COLORS.sea : i === current ? COLORS.sun : COLORS.white }}
          >
            <Text className="text-xs font-bold" style={{ color: i < current ? COLORS.white : COLORS.ink }}>
              {i < current ? "✓" : i + 1}
            </Text>
          </View>
          <Text
            className="flex-1 text-xs font-bold"
            style={{ color: i === current ? COLORS.ink : COLORS.inkSoft }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      ))}
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

  // 決定（作った人だけ）
  const decide = useDecideOuting(code);
  const [decideOpen, setDecideOpen] = useState(false);
  const decided = outing.data?.status === "decided";

  // 「実際に行った？」は決定から3時間たってから
  const askFeedback = decided && canAskFeedback(outing.data?.decided_at);
  const myFeedback = useMyFeedback(outingId, me.data, askFeedback);
  const answerFeedback = useAnswerFeedback(outingId, me.data);

  // 開いている間に決定が届いたら、スマホを1回だけ振動させる（もともと決定済みなら鳴らさない）
  const previousStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = outing.data?.status;
    if (previousStatus.current === "voting" && status === "decided" && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    previousStatus.current = status;
  }, [outing.data?.status]);

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
      <Problem
        title="うまく開けなかった"
        message="確認がとちゅうで止まったみたい"
        actionLabel="もう一回"
        onAction={() => {
          setAuthError(false);
          setAuthAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (me.isPending || me.data === null || outing.isPending) {
    return <Loading />;
  }

  if (outing.isError) {
    return (
      <Problem
        title="読み込めなかった"
        message="通信がうまくいかなかったみたい"
        actionLabel="もう一回"
        onAction={() => outing.refetch()}
      />
    );
  }

  // まだ参加していない（またはコードが違う）
  if (!outing.data) {
    const notFound = (join.error as { code?: string } | null)?.code === "P0002";
    return (
      <ScrollView
        className="flex-1 bg-sand"
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
  const isCreator = outing.data.created_by === myId;
  const counts: Record<string, number> = {};
  for (const v of allVotes) counts[v.spot_id] = (counts[v.spot_id] ?? 0) + 1;
  const maxCount = Math.max(0, ...Object.values(counts));
  const nameOf = (userId: string) =>
    userId === myId ? "あなた" : (members.data?.find((m) => m.user_id === userId)?.display_name ?? "だれか");

  const decidedSpot = decided ? outing.data.candidates.find((c) => c.id === outing.data?.decided_spot_id) : undefined;
  // 決定した場所があとから非公開になったときは、候補として読めない
  if (decided && !decidedSpot) {
    return <Problem title="行き先は決まっています" message="ただ、その場所は今は表示できないみたい" />;
  }
  if (decidedSpot) {
    return (
      <View className="flex-1 bg-sand">
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="px-5 pb-8 pt-4">
          <DecidedView
            spot={decidedSpot}
            voterNames={allVotes.filter((v) => v.spot_id === decidedSpot.id).map((v) => nameOf(v.user_id))}
            feedback={
              askFeedback
                ? {
                    answer: myFeedback.data,
                    loading: answerFeedback.isPending,
                    error: answerFeedback.isError,
                    onAnswer: (went) => answerFeedback.mutate(went),
                  }
                : null
            }
          />
        </ScrollView>
      </View>
    );
  }

  // 作った人以外が参加・投票しているか（作った人の「次にすること」を決める）
  const othersJoined = (members.data?.length ?? 1) > 1;
  const othersVoted = allVotes.some((v) => v.user_id !== myId);
  const creatorStep = !othersJoined ? 0 : !othersVoted ? 1 : 2;
  const statusText = isCreator
    ? ["まずはリンクを友達に送ろう", "友達の投票を待ってるよ。自分も投票できるよ", "票が集まってきた！ 決まったら「ここに決定！」"][creatorStep]
    : myVote
      ? "投票したよ。決まったら、この画面が切り替わるよ"
      : "行きたいところをタップして投票してね";

  return (
    <View className="flex-1 bg-sand">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-5 px-5 pb-8 pt-4">
        <View className="gap-3">
          {isCreator ? <Steps current={creatorStep} /> : null}
          <View className="gap-1">
            <Text className="text-[26px] font-bold text-ink" accessibilityRole="header">
              どこ行く？
            </Text>
            <Text className="text-[15px] leading-6 text-ink-soft" accessibilityLiveRegion="polite">
              {statusText}
              {members.data ? `（参加 ${members.data.length}人）` : ""}
            </Text>
          </View>
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
                <Tally
                  votes={spotVotes}
                  members={members.data ?? []}
                  me={myId}
                  total={allVotes.length}
                  isTop={maxCount > 0 && spotVotes.length === maxCount}
                />
              </SpotCard>
            </PressableScale>
          );
        })}

        {castVote.isError ? (
          <Text className="text-sm font-bold text-coral-ink">投票できなかった。もう一回タップしてね</Text>
        ) : null}
      </ScrollView>

      <View className="gap-1 border-t-2 border-ink bg-sand px-5 pt-4" style={{ paddingBottom: insets.bottom + 8 }}>
        {shareNote ? (
          <Text selectable className="pb-1 text-center text-sm font-bold text-sea-ink">
            {shareNote}
          </Text>
        ) : null}
        {/* 主役のボタンは1つ。作った人は、友達が来るまでは「送る」、来たら「決定」 */}
        {isCreator && voting && othersJoined ? (
          <>
            <Button
              label="ここに決定！"
              onPress={() => {
                decide.reset();
                setDecideOpen(true);
              }}
            />
            <Button label="友達に送る" variant="quiet" onPress={share_} />
          </>
        ) : isCreator ? (
          <Button label="友達に送る" onPress={share_} />
        ) : (
          <Button label="ほかの友達にも送る" variant="quiet" onPress={share_} />
        )}
      </View>

      {isCreator && voting ? (
        <DecideSheet
          visible={decideOpen}
          candidates={outing.data.candidates}
          counts={counts}
          loading={decide.isPending}
          error={decide.error ? "決められなかった。もう一回試してね" : null}
          onConfirm={(spotId) => decide.mutate(spotId, { onSuccess: () => setDecideOpen(false) })}
          onClose={() => setDecideOpen(false)}
        />
      ) : null}
    </View>
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
