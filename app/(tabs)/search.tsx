import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSpots } from '@/hooks/use-spots';

const GENRES = [
  { label: 'すべて', slug: 'all' },
  { label: '自然', slug: 'nature' },
  { label: 'ビーチ', slug: 'beach' },
  { label: 'カフェ', slug: 'cafe' },
  { label: '歴史', slug: 'history' },
  { label: '穴場', slug: 'local' },
  { label: 'ドライブ', slug: 'drive' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedGenre, setSelectedGenre] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [inputValue, setInputValue] = useState('');

  const { spots, loading, error } = useSpots(selectedGenre, keyword);

  return (
    <ThemedView style={styles.container}>
      {/* 検索バー */}
      <View style={[styles.searchHeader, { paddingTop: insets.top + 16 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.subText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="スポットを探す"
            placeholderTextColor={colors.subText}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={() => setKeyword(inputValue)}
            returnKeyType="search"
          />
          {inputValue.length > 0 && (
            <TouchableOpacity onPress={() => { setInputValue(''); setKeyword(''); }}>
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* ジャンルフィルター */}
        <FlatList
          horizontal
          data={GENRES}
          keyExtractor={(item) => item.slug}
          showsHorizontalScrollIndicator={false}
          style={styles.genreRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.genreChip,
                { borderColor: colors.tint },
                selectedGenre === item.slug && { backgroundColor: colors.tint },
              ]}
              onPress={() => setSelectedGenre(item.slug)}>
              <ThemedText
                style={[
                  styles.genreLabel,
                  selectedGenre === item.slug ? { color: '#fff' } : { color: colors.text },
                ]}>
                {item.label}
              </ThemedText>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ローディング */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
        </View>
      )}

      {/* エラー */}
      {error && (
        <View style={styles.center}>
          <ThemedText style={{ color: colors.subText }}>{error}</ThemedText>
        </View>
      )}

      {/* スポット一覧 */}
      {!loading && !error && (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            spots.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText style={{ color: colors.subText }}>スポットが見つかりませんでした</ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.spotCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/spot/${item.id}` as any)}>
              <View style={styles.spotCardInner}>
                <View style={styles.spotMeta}>
                  {item.genres.map((g) => (
                    <ThemedText key={g.slug} style={[styles.genreTag, { color: colors.tint }]}>
                      {g.name}
                    </ThemedText>
                  ))}
                  <ThemedText style={[styles.areaTag, { color: colors.subText }]}>{item.area}</ThemedText>
                </View>
                <ThemedText style={styles.spotName}>{item.name}</ThemedText>
                {item.description && (
                  <ThemedText style={[styles.spotDesc, { color: colors.subText }]} numberOfLines={2}>
                    {item.description}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  genreRow: { marginHorizontal: -4 },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  genreLabel: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 12 },
  listEmpty: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  spotCard: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  spotCardInner: { padding: 16, gap: 4 },
  spotMeta: { flexDirection: 'row', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  genreTag: { fontSize: 12, fontWeight: '600' },
  areaTag: { fontSize: 12 },
  spotName: { fontSize: 17, fontWeight: '700' },
  spotDesc: { fontSize: 14, lineHeight: 20, marginTop: 2 },
});
