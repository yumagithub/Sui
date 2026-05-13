import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth';
import { GENRE_PREFS_KEY } from '@/app/onboarding';
import type { ComponentProps } from 'react';

type SFSymbol = ComponentProps<typeof IconSymbol>['name'];

const MENU_ITEMS: { label: string; icon: SFSymbol; danger?: boolean }[] = [
  { label: 'プロフィール編集', icon: 'person.crop.circle' },
  { label: '好み・エリア設定', icon: 'slider.horizontal.3' },
  { label: '通知設定', icon: 'bell' },
  { label: 'ログアウト', icon: 'rectangle.portrait.and.arrow.right', danger: true },
];

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();

  const handleMenuPress = async (label: string) => {
    if (label === 'ログアウト') {
      await signOut();
      router.replace('/auth');
    }
  };

  const handleDevReset = () => {
    Alert.alert('初回状態にリセット', 'オンボーディング・ジャンル設定をリセットしてオンボーディング画面に戻ります。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('sui_onboarding_done');
          await SecureStore.deleteItemAsync(GENRE_PREFS_KEY);
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const avatarLetter = user?.email?.[0].toUpperCase() ?? 'S';
  const displayName = user?.email ?? 'ゲスト';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* プロフィール */}
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.avatarText}>{avatarLetter}</ThemedText>
          </View>
          <ThemedText style={styles.nickname}>{displayName}</ThemedText>
          {!user && (
            <TouchableOpacity onPress={() => router.push('/auth')}>
              <ThemedText style={[styles.loginPrompt, { color: colors.tint }]}>
                ログイン / 新規登録
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* 統計 */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNum, { color: colors.tint }]}>3</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subText }]}>訪問スポット</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.subText + '30' }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNum, { color: colors.tint }]}>2</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subText }]}>エリア</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.subText + '30' }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNum, { color: colors.tint }]}>5</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subText }]}>AIルート利用</ThemedText>
          </View>
        </View>

        {/* メニュー */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          {MENU_ITEMS.map((item, i) => {
            if (item.danger && !user) return null;
            return (
              <View key={item.label}>
                <TouchableOpacity style={styles.menuRow} onPress={() => handleMenuPress(item.label)}>
                  <IconSymbol
                    name={item.icon}
                    size={20}
                    color={item.danger ? '#E05555' : colors.subText}
                  />
                  <ThemedText
                    style={[
                      styles.menuLabel,
                      item.danger && { color: '#E05555' },
                    ]}>
                    {item.label}
                  </ThemedText>
                  {!item.danger && (
                    <IconSymbol name="chevron.right" size={14} color={colors.subText} />
                  )}
                </TouchableOpacity>
                {i < MENU_ITEMS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.subText + '20' }]} />
                )}
              </View>
            );
          })}
        </View>

        <ThemedText style={[styles.version, { color: colors.subText }]}>Sui v1.0.0</ThemedText>

        {/* 開発用リセット */}
        <TouchableOpacity onPress={handleDevReset} style={styles.devBtn}>
          <ThemedText style={[styles.devBtnText, { color: colors.subText }]}>
            🛠 初回状態にリセット（開発用）
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  profile: { alignItems: 'center', marginBottom: 28, gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nickname: { fontSize: 20, fontWeight: '700' },
  loginPrompt: { fontSize: 14, fontWeight: '500' },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  statDivider: { width: 1, marginVertical: 4 },
  menuCard: {
    borderRadius: 16,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuLabel: { flex: 1, fontSize: 15 },
  divider: { height: 1, marginHorizontal: 16 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 24 },
  devBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  devBtnText: { fontSize: 12 },
});
