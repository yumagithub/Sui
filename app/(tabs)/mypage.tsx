import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth';
import { useVisits } from '@/hooks/use-visits';
import { GENRE_PREFS_KEY } from '@/app/onboarding';
import type { ComponentProps } from 'react';

type SFSymbol = ComponentProps<typeof IconSymbol>['name'];

const MENU_ITEMS: { label: string; icon: SFSymbol; action: string; danger?: boolean }[] = [
  { label: '好み・ジャンル設定', icon: 'slider.horizontal.3', action: 'genres' },
  { label: 'ログアウト', icon: 'rectangle.portrait.and.arrow.right', action: 'logout', danger: true },
];

const GENRES = [
  { slug: 'nature', label: '自然・絶景', emoji: '🌿' },
  { slug: 'beach', label: 'ビーチ・海', emoji: '🏖️' },
  { slug: 'cafe', label: 'カフェ・グルメ', emoji: '☕' },
  { slug: 'history', label: '歴史・文化', emoji: '🏯' },
  { slug: 'local', label: '穴場・ローカル', emoji: '🗺️' },
  { slug: 'drive', label: 'ドライブ途中', emoji: '🚗' },
];

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();
  const { visits } = useVisits();

  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const spotCount = visits.length;
  const areaCount = new Set(visits.map((v) => v.spots?.area).filter(Boolean)).size;

  const openGenreModal = async () => {
    try {
      const raw = await SecureStore.getItemAsync(GENRE_PREFS_KEY);
      setSelectedGenres(raw ? JSON.parse(raw) : []);
    } catch {
      setSelectedGenres([]);
    }
    setGenreModalVisible(true);
  };

  const saveGenres = async () => {
    await SecureStore.setItemAsync(GENRE_PREFS_KEY, JSON.stringify(selectedGenres));
    setGenreModalVisible(false);
  };

  const toggleGenre = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleMenuPress = async (action: string) => {
    if (action === 'logout') {
      await signOut();
      router.replace('/auth');
    } else if (action === 'genres') {
      openGenreModal();
    }
  };

  const handleDevReset = () => {
    Alert.alert('初回状態にリセット', 'オンボーディング・ジャンル設定をリセットして戻ります。', [
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

  const avatarLetter = user?.email?.[0].toUpperCase() ?? 'G';
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
            <ThemedText style={[styles.statNum, { color: colors.tint }]}>{spotCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subText }]}>訪問スポット</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.subText + '30' }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNum, { color: colors.tint }]}>{areaCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subText }]}>エリア</ThemedText>
          </View>
        </View>

        {/* メニュー */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          {MENU_ITEMS.map((item, i) => {
            if (item.danger && !user) return null;
            return (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => handleMenuPress(item.action)}>
                  <IconSymbol
                    name={item.icon}
                    size={20}
                    color={item.danger ? '#E05555' : colors.subText}
                  />
                  <ThemedText style={[styles.menuLabel, item.danger && { color: '#E05555' }]}>
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

      {/* ジャンル設定モーダル */}
      <Modal
        visible={genreModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGenreModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>好みのジャンル</ThemedText>
            <TouchableOpacity onPress={() => setGenreModalVisible(false)}>
              <ThemedText style={[styles.modalCancel, { color: colors.subText }]}>キャンセル</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.modalSubtitle, { color: colors.subText }]}>
            AIルート提案に反映されます
          </ThemedText>

          <View style={styles.chipsGrid}>
            {GENRES.map((genre) => {
              const isActive = selectedGenres.includes(genre.slug);
              return (
                <TouchableOpacity
                  key={genre.slug}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? colors.tint : colors.card,
                      borderColor: isActive ? colors.tint : colors.subText + '40',
                    },
                  ]}
                  onPress={() => toggleGenre(genre.slug)}
                  activeOpacity={0.75}>
                  <ThemedText style={styles.chipEmoji}>{genre.emoji}</ThemedText>
                  <ThemedText style={[styles.chipLabel, { color: isActive ? '#fff' : colors.text }]}>
                    {genre.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={saveGenres}>
            <ThemedText style={styles.saveBtnText}>
              {selectedGenres.length > 0 ? `${selectedGenres.length}件選択して保存` : '選択なしで保存'}
            </ThemedText>
          </Pressable>
        </View>
      </Modal>
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

  // モーダル
  modal: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalCancel: { fontSize: 15 },
  modalSubtitle: { fontSize: 14, marginBottom: 24 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: '45%',
  },
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
