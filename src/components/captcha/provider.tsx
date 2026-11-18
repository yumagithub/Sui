import { createContext, use, useCallback, useRef, useState, type PropsWithChildren } from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { Text } from "@/components/text";
import { COLORS } from "@/constants/colors";

import { Button } from "../button";
import { WIDGET_HEIGHT, WIDGET_WIDTH } from "./types";
import { CaptchaWidget } from "./widget";

// サイトキーは公開してよい値（秘密の値は Supabase のダッシュボードにだけ置く）
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

/** 「ちょっと確認」をやめたとき */
export class CaptchaCancelledError extends Error {
  constructor() {
    super("確認をやめました");
    this.name = "CaptchaCancelledError";
  }
}

type GetToken = () => Promise<string>;

const CaptchaContext = createContext<GetToken | null>(null);

type Request = { id: number; resolve: (token: string) => void; reject: (error: Error) => void };

/**
 * 匿名ログインの前の CAPTCHA（Cloudflare Turnstile）。
 * useCaptcha() で受け取った関数を呼ぶと確認の画面が出て、通ったらトークンが返る。
 */
export function CaptchaProvider({ children }: PropsWithChildren) {
  const [request, setRequest] = useState<Request | null>(null);
  const inFlight = useRef<Promise<string> | null>(null);
  const nextId = useRef(0);

  const getToken = useCallback<GetToken>(() => {
    if (!SITE_KEY) {
      return Promise.reject(new Error("EXPO_PUBLIC_TURNSTILE_SITE_KEY を .env.local に設定してください"));
    }
    // 同時に何回呼ばれても、確認の画面は1つだけ
    if (inFlight.current) return inFlight.current;
    const promise = new Promise<string>((resolve, reject) => {
      nextId.current += 1;
      setRequest({ id: nextId.current, resolve, reject });
    }).finally(() => {
      inFlight.current = null;
      setRequest(null);
    });
    inFlight.current = promise;
    return promise;
  }, []);

  return (
    <CaptchaContext value={getToken}>
      {children}
      {request && SITE_KEY ? (
        <CaptchaSheet
          key={request.id}
          siteKey={SITE_KEY}
          onToken={request.resolve}
          onCancel={() => request.reject(new CaptchaCancelledError())}
        />
      ) : null}
    </CaptchaContext>
  );
}

export function useCaptcha() {
  const getToken = use(CaptchaContext);
  if (!getToken) throw new Error("CaptchaProvider の中で使ってください");
  return getToken;
}

type SheetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  onCancel: () => void;
};

function CaptchaSheet({ siteKey, onToken, onCancel }: SheetProps) {
  const [interactive, setInteractive] = useState(false);
  // うまくいかなかったときのコード（問い合わせのときに分かるよう小さく出す）
  const [failed, setFailed] = useState<string | null>(null);
  // 「もう一回」で Turnstile を最初から出し直す
  const [attempt, setAttempt] = useState(0);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/30 px-6">
        <View className="w-full max-w-sm items-center gap-4 rounded-3xl bg-white px-5 pb-5 pt-6">
          <View className="items-center gap-1">
            <Text className="text-lg font-bold text-ink">ちょっと確認するね</Text>
            <Text className="text-center text-sm text-ink-soft">
              {failed !== null
                ? "うまく確認できなかった…"
                : interactive
                  ? "チェックを入れてね"
                  : "ロボットじゃないか、自動でチェックしてるよ"}
            </Text>
            {failed !== null ? <Text className="text-xs text-ink-faint">コード {failed}</Text> : null}
          </View>

          {failed !== null ? (
            <View className="w-full">
              <Button
                label="もう一回"
                variant="secondary"
                onPress={() => {
                  setFailed(null);
                  setInteractive(false);
                  setAttempt((n) => n + 1);
                }}
              />
            </View>
          ) : (
            <View style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT }} className="items-center justify-center">
              <CaptchaWidget
                key={attempt}
                siteKey={siteKey}
                onToken={onToken}
                onError={(code) => {
                  if (__DEV__) console.warn(`Turnstile のエラー: ${code}`);
                  setFailed(code);
                }}
                onInteractive={() => setInteractive(true)}
              />
              {interactive ? null : (
                // 自動で通るあいだは、透明なウィジェットの上にくるくるを重ねておく
                <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-white">
                  <ActivityIndicator color={COLORS.sea} />
                </View>
              )}
            </View>
          )}

          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="やめる" hitSlop={12}>
            <Text className="text-sm font-semibold text-ink-soft">やめる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
