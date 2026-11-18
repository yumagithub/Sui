import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { Text } from "@/components/text";
import { COLORS, FONT_BODY_NATIVE, FONT_WEB } from "@/constants/colors";

import { loadDisplayName } from "@/lib/prefs";

import { BottomSheet } from "./bottom-sheet";
import { Button } from "./button";

const MAX = 20;

type FormProps = {
  title: string;
  description?: string;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (name: string) => void;
  /** 規約のリンクを押したとき（シートの中なら閉じてから移る） */
  onLeave?: () => void;
};

/** 表示名を入れるフォーム。前に入れた名前があれば最初から入れておく */
export function NameForm({ title, description, submitLabel, loading, error, onSubmit, onLeave }: FormProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    loadDisplayName().then((saved) => {
      if (alive && saved) setName((current) => current || saved);
    });
    return () => {
      alive = false;
    };
  }, []);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && [...trimmed].length <= MAX;
  const submit = () => valid && !loading && onSubmit(trimmed);

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-[24px] font-bold text-ink" accessibilityRole="header">
          {title}
        </Text>
        {description ? <Text className="text-sm text-ink-soft">{description}</Text> : null}
      </View>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="なまえ（みんなに見えます）"
        maxLength={MAX}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
        accessibilityLabel="なまえ"
        className="min-h-14 rounded-2xl border-2.5 border-ink bg-white px-4 text-[17px] text-ink"
        style={Platform.OS === "web" ? { fontFamily: FONT_WEB, fontWeight: "500" } : { fontFamily: FONT_BODY_NATIVE }}
        placeholderTextColor={COLORS.inkFaint}
      />
      {error ? <Text className="text-sm font-bold text-coral-ink">{error}</Text> : null}
      <Button label={submitLabel} onPress={submit} disabled={!valid} loading={loading} />
      <Text className="text-center text-xs leading-5 text-ink-soft">
        進むと
        <Link href="/terms" onPress={onLeave} className="text-ink-soft underline">
          利用規約
        </Link>
        と
        <Link href="/privacy" onPress={onLeave} className="text-ink-soft underline">
          プライバシーポリシー
        </Link>
        に同意したことになります
      </Text>
    </View>
  );
}

type SheetProps = FormProps & {
  visible: boolean;
  onClose: () => void;
};

/** 下から出てくる名前入力（結果画面の「友達に聞く」で使う） */
export function NameSheet({ visible, onClose, ...form }: SheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <NameForm {...form} onLeave={onClose} />
    </BottomSheet>
  );
}
