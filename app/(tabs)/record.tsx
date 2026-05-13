import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth';
import { useVisits } from '@/hooks/use-visits';

function EmptyState({ isGuest, colors }: { isGuest: boolean; colors: typeof Colors.light }) {
  return (
    <View style={styles.empty}>
      <IconSymbol name="clock" size={48} color={colors.subText} />
      {isGuest ? (
        <>
          <ThemedText style={[styles.emptyTitle, { color: colors.subText }]}>
            ログインして記録を残そう
          </ThemedText>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/auth')}>
            <ThemedText style={styles.loginBtnText}>ログイン / 新規登録</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ThemedText style={[styles.emptyTitle, { color: colors.subText }]}>
            まだ記録がありません
          </ThemedText>
          <ThemedText style={[styles.emptyDesc, { color: colors.subText }]}>
            ホーム画面のスポットから「訪問済みにする」で記録を残せます
          </ThemedText>
        </>
      )}
    </View>
  );
}

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { visits, loading, error, deleteVisit } = useVisits();

  const handleDelete = (visitId: string, spotName: string) => {
    Alert.alert(
      '記録を削除',
      `「${spotName}」の記録を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteVisit(visitId),
        },
      ],
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText style={{ color: colors.subText }}>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState isGuest={!user} colors={colors} />}
          contentContainerStyle={[
            styles.list,
            { paddingTop: insets.top + 16 },
            visits.length === 0 && styles.listEmpty,
          ]}
          ListHeaderComponent={
            visits.length > 0 ? (
              <View style={styles.header}>
                <ThemedText style={styles.title}>記録</ThemedText>
                <View style={[styles.statBadge, { backgroundColor: colors.tint + '20' }]}>
                  <ThemedText style={[styles.statText, { color: colors.tint }]}>
                    {visits.length}スポット訪問
                  </ThemedText>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardTop}>
                <View style={styles.cardMain}>
                  <ThemedText style={styles.spotName}>{item.spots?.name ?? '不明'}</ThemedText>
                  <ThemedText style={[styles.area, { color: colors.subText }]}>
                    {item.spots?.area}
                  </ThemedText>
                </View>
                <View style={styles.cardRight}>
                  <ThemedText style={[styles.date, { color: colors.subText }]}>
                    {formatDate(item.visited_at)}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.spots?.name ?? '')}
                    hitSlop={8}>
                    <IconSymbol name="trash" size={16} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              </View>
              {item.memo ? (
                <ThemedText style={[styles.memo, { color: colors.subText }]} numberOfLines={2}>
                  {item.memo}
                </ThemedText>
              ) : null}
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  listEmpty: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  statBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statText: { fontSize: 13, fontWeight: '600' },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardMain: { gap: 2, flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  spotName: { fontSize: 17, fontWeight: '700' },
  area: { fontSize: 13 },
  date: { fontSize: 12 },
  memo: { fontSize: 14, lineHeight: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 },
  loginBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
