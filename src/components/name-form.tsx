import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { loadDisplayName } from "@/lib/prefs";

import { Button } from "./button";

const MAX = 20;

type FormProps = {
  title: string;
  description?: string;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (name: string) => void;
};

/** 表示名を入れるフォーム。前に入れた名前があれば最初から入れておく */
export function NameForm({ title, description, submitLabel, loading, error, onSubmit }: FormProps) {
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
    </View>
  );
}

type SheetProps = FormProps & {
  visible: boolean;
  onClose: () => void;
};

/** 下から出てくる名前入力（結果画面の「友達に聞く」で使う） */
export function NameSheet({ visible, onClose, ...form }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/30"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        />
        <View className="rounded-t-3xl bg-slate-50 px-5 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <NameForm {...form} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
