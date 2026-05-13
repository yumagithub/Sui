import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/services/supabase';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('確認メールを送信しました', 'メールを確認してアカウントを有効化してください');
      }
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <ThemedText style={[styles.logo, { color: Brand.turquoise }]}>SUI</ThemedText>
            <ThemedText style={styles.title}>
              {mode === 'login' ? 'おかえりなさい' : 'はじめまして'}
            </ThemedText>
            <ThemedText style={[styles.sub, { color: colors.subText }]}>
              {mode === 'login'
                ? 'メールアドレスとパスワードでログイン'
                : 'アカウントを作成して訪問記録を保存'}
            </ThemedText>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.subText + '30' }]}
              placeholder="メールアドレス"
              placeholderTextColor={colors.subText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.subText + '30' }]}
              placeholder="パスワード"
              placeholderTextColor={colors.subText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: Brand.turquoise }, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <ThemedText style={styles.submitText}>
                    {mode === 'login' ? 'ログイン' : 'アカウント作成'}
                  </ThemedText>
              }
            </TouchableOpacity>
          </View>

          {/* モード切替 */}
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <ThemedText style={[styles.switchText, { color: colors.subText }]}>
              {mode === 'login' ? 'アカウントをお持ちでない方は ' : 'すでにアカウントをお持ちの方は '}
              <ThemedText style={{ color: Brand.turquoise, fontWeight: '600' }}>
                {mode === 'login' ? '新規登録' : 'ログイン'}
              </ThemedText>
            </ThemedText>
          </TouchableOpacity>

          {/* ゲストスキップ */}
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <ThemedText style={[styles.guestText, { color: colors.subText }]}>
              ゲストとして続ける
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, gap: 32 },
  header: { gap: 8 },
  logo: { fontSize: 18, fontWeight: '800', letterSpacing: 4 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  sub: { fontSize: 15, lineHeight: 22 },
  form: { gap: 12 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { fontSize: 14, textAlign: 'center' },
  guestText: { fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' },
});
