import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth';
import { useVisits } from '@/hooks/use-visits';
import { supabase } from '@/services/supabase';

type SpotDetail = {
  id: string;
  name: string;
  description: string | null;
  area: string;
  latitude: number;
  longitude: number;
  genres: { slug: string; name: string }[];
};

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { visits, addVisit } = useVisits();

  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('spots')
      .select('*, spot_genres(genres(slug, name))')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setSpot({
            ...data,
            genres: (data.spot_genres ?? []).map((sg: any) => sg.genres).filter(Boolean),
          });
        }
        setLoading(false);
      });
  }, [id]);

  const isVisited = visits.some((v) => v.spot_id === id);

  const handleMarkVisited = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (isVisited || !id) return;

    const doAdd = async (memo?: string) => {
      setAdding(true);
      try {
        await addVisit(id, memo);
      } catch {
        Alert.alert('エラー', '記録できませんでした');
      } finally {
        setAdding(false);
      }
    };

    if (Platform.OS === 'ios') {
      Alert.prompt(
        '訪問済みにする',
        `「${spot?.name}」へのメモ（任意）`,
        (memo) => doAdd(memo || undefined),
        'plain-text',
        '',
      );
    } else {
      Alert.alert('訪問済みにする', `「${spot?.name}」を記録しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        { text: '記録する', onPress: () => doAdd() },
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: spot?.name ?? 'スポット詳細',
          headerBackTitle: '戻る',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.tint,
          headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' },
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : spot ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}>

          {/* ジャンル・エリア */}
          <View style={styles.metaRow}>
            {spot.genres.map((g) => (
              <View key={g.slug} style={[styles.genreBadge, { backgroundColor: colors.tint + '20' }]}>
                <ThemedText style={[styles.genreBadgeText, { color: colors.tint }]}>{g.name}</ThemedText>
              </View>
            ))}
            <ThemedText style={[styles.areaText, { color: colors.subText }]}>{spot.area}</ThemedText>
          </View>

          {/* スポット名 */}
          <ThemedText style={styles.name}>{spot.name}</ThemedText>

          {/* 説明文 */}
          {spot.description ? (
            <ThemedText style={[styles.description, { color: colors.text }]}>
              {spot.description}
            </ThemedText>
          ) : null}

          {/* 地図プレースホルダー */}
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.mapLabel, { color: colors.subText }]}>📍 地図</ThemedText>
            <ThemedText style={[styles.mapCoords, { color: colors.subText }]}>
              {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
            </ThemedText>
          </View>

          {/* 訪問済みにするボタン */}
          <TouchableOpacity
            style={[
              styles.visitBtn,
              { backgroundColor: isVisited ? colors.tint + '20' : colors.tint },
            ]}
            onPress={handleMarkVisited}
            disabled={adding || isVisited}>
            {adding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={[styles.visitBtnText, isVisited && { color: colors.tint }]}>
                {isVisited ? '✓ 訪問済み' : '訪問済みにする'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <ThemedText style={{ color: colors.subText }}>スポットが見つかりませんでした</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  genreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  genreBadgeText: { fontSize: 12, fontWeight: '600' },
  areaText: { fontSize: 13 },
  name: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, lineHeight: 34 },
  description: { fontSize: 15, lineHeight: 24 },
  mapPlaceholder: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  mapLabel: { fontSize: 15, fontWeight: '600' },
  mapCoords: { fontSize: 12 },
  visitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  visitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
