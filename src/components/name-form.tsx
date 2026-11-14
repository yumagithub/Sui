import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

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
        <Text className="text-xl font-bold text-slate-900">{title}</Text>
        {description ? <Text className="text-sm text-slate-500">{description}</Text> : null}
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
        className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900"
        placeholderTextColor="#94a3b8"
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      <Button label={submitLabel} onPress={submit} disabled={!valid} loading={loading} />
      <Text className="text-center text-xs text-slate-400">
        進むと
        <Link href="/terms" onPress={onLeave} className="text-slate-500 underline">
          利用規約
        </Link>
        と
        <Link href="/privacy" onPress={onLeave} className="text-slate-500 underline">
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
