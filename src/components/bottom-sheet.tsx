import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** 下から出てくるシート（後ろを押すと閉じる）。名前入力や決定で使う */
export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-ink/40"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        />
        <View
          className="max-h-[85%] rounded-t-[28px] border-x-2.5 border-t-2.5 border-ink bg-sand px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ink/20" />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
