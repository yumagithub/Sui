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
          className="absolute inset-0 bg-black/30"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        />
        <View className="max-h-[85%] rounded-t-3xl bg-slate-50 px-5 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
