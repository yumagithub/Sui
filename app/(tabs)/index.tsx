import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth';
import { useRouteSuggestion } from '@/hooks/use-route-suggestion';
import { useVisits } from '@/hooks/use-visits';

const MOODS = ['のんびり', 'アクティブ', 'ドライブ', '食べ歩き', '歴史探訪'];

const TIME_OF_DAY = (() => {
  const h = new Date().getHours();
  if (h < 11) return '午前';
  if (h < 17) return '午後';
  return '夕方';
})();

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { visits, addVisit } = useVisits();

  const [selectedMood, setSelectedMood] = useState('のんびり');
  const [addingSpotId, setAddingSpotId] = useState<string | null>(null);
  const { spots, loading, error, suggest } = useRouteSuggestion();

  const isVisited = (spotId: string) => visits.some((v) => v.spot_id === spotId);

  const handleMarkVisited = (spotId: string, spotName: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (isVisited(spotId)) return;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        '訪問済みにする',
        `「${spotName}」へのメモ（任意）`,
        async (memo) => {
          setAddingSpotId(spotId);
          try {
            await addVisit(spotId, memo || undefined);
          } catch {
            Alert.alert('エラー', '記録できませんでした');
          } finally {
            setAddingSpotId(null);
          }
        },
        'plain-text',
        '',
      );
    } else {
      Alert.alert('訪問済みにする', `「${spotName}」を記録しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '記録する',
          onPress: async () => {
            setAddingSpotId(spotId);
            try {
              await addVisit(spotId);
            } catch {
              Alert.alert('エラー', '記録できませんでした');
            } finally {
              setAddingSpotId(null);
            }
          },
        },
      ]);
    }
  };

  const today = new Date().toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  // 初回・気分変更時に提案を取得
  useEffect(() => {
    suggest({ mood: selectedMood, time_of_day: TIME_OF_DAY });
  }, [selectedMood]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>

        {/* ヘッダー */}
        <View style={styles.header}>
          <ThemedText style={[styles.date, { color: colors.subText }]}>{today}</ThemedText>
          <ThemedText style={styles.headline}>今日、どこ行く？</ThemedText>
        </View>

        {/* 気分セレクター */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: colors.subText }]}>気分を選ぶ</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[
                  styles.moodChip,
                  { borderColor: colors.tint },
                  selectedMood === mood && { backgroundColor: colors.tint },
                ]}
                onPress={() => setSelectedMood(mood)}>
                <ThemedText
                  style={[
                    styles.moodLabel,
                    selectedMood === mood ? { color: '#fff' } : { color: colors.text },
                  ]}>
                  {mood}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AIルート提案 */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <ThemedText style={[styles.sectionLabel, { color: colors.subText }]}>
              AIが選んだルート
            </ThemedText>
            <TouchableOpacity
              onPress={() => suggest({ mood: selectedMood, time_of_day: TIME_OF_DAY })}
              disabled={loading}>
              <ThemedText style={[styles.regenText, { color: loading ? colors.subText : colors.tint }]}>
                再提案
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* ローディング */}
          {loading && (
            <View style={[styles.routeCard, { backgroundColor: colors.card }, styles.loadingCard]}>
              <ActivityIndicator color={colors.tint} />
              <ThemedText style={[styles.loadingText, { color: colors.subText }]}>
                AIがルートを考えています…
              </ThemedText>
            </View>
          )}

          {/* エラー */}
          {!loading && error && (
            <View style={[styles.routeCard, { backgroundColor: colors.card }, styles.loadingCard]}>
              <ThemedText style={{ color: colors.subText }}>{error}</ThemedText>
            </View>
          )}

          {/* スポット一覧 */}
          {!loading && !error && spots.length > 0 && (
            <View style={[styles.routeCard, { backgroundColor: colors.card }]}>
              <View style={[styles.routeTag, { backgroundColor: Brand.turquoise + '20' }]}>
                <ThemedText style={[styles.routeTagText, { color: Brand.turquoise }]}>
                  {spots.map((s) => s.area).filter((v, i, a) => a.indexOf(v) === i).join(' → ')}
                  　約{spots.length * 45}分
                </ThemedText>
              </View>

              {spots.map((spot, i) => (
                <View key={spot.id}>
                  <View style={styles.spotRow}>
                    <View style={[styles.stepBadge, { backgroundColor: colors.tint }]}>
                      <ThemedText style={styles.stepNum}>{i + 1}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.spotInfo}
                      onPress={() => router.push(`/spot/${spot.id}` as any)}>
                      <ThemedText style={styles.spotName}>{spot.name}</ThemedText>
                      <ThemedText style={[styles.spotMeta, { color: colors.subText }]}>
                        {spot.area}
                        {spot.genres.length > 0 && `・${spot.genres[0].name}`}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.visitBtn,
                        isVisited(spot.id)
                          ? { backgroundColor: colors.tint + '20' }
                          : { backgroundColor: colors.tint },
                      ]}
                      onPress={() => handleMarkVisited(spot.id, spot.name)}
                      disabled={addingSpotId === spot.id || isVisited(spot.id)}>
                      {addingSpotId === spot.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ThemedText
                          style={[
                            styles.visitBtnText,
                            isVisited(spot.id) && { color: colors.tint },
                          ]}>
                          {isVisited(spot.id) ? '訪問済み' : '訪問済みにする'}
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                  {i < spots.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: colors.tint + '40' }]} />
                  )}
                </View>
              ))}

              <TouchableOpacity style={[styles.startBtn, { backgroundColor: Brand.turquoise }]}>
                <ThemedText style={styles.startBtnText}>出発する</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { marginBottom: 28 },
  date: { fontSize: 13, marginBottom: 4 },
  headline: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  section: { marginBottom: 28 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  regenText: { fontSize: 14, fontWeight: '500' },
  moodRow: { marginHorizontal: -4 },
  moodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  moodLabel: { fontSize: 14, fontWeight: '500' },
  routeCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  loadingText: { fontSize: 14 },
  routeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeTagText: { fontSize: 12, fontWeight: '600' },
  spotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: '700' },
  spotInfo: { flex: 1 },
  spotName: { fontSize: 16, fontWeight: '600' },
  spotMeta: { fontSize: 13, marginTop: 2 },
  connector: { width: 2, height: 12, marginLeft: 11, borderRadius: 1 },
  startBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  visitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
