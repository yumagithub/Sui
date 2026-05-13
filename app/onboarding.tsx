import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ONBOARDING_KEY = 'sui_onboarding_done';
export const GENRE_PREFS_KEY = 'sui_genre_prefs';

const { width, height } = Dimensions.get('window');
const PRIMARY = Brand.turquoise;

type Page = {
  id: string;
  title: string;
  description: string;
  backgroundUri: string;
  theme: 'dark' | 'light';
  gradientColors: readonly [string, string, string];
  gradientLocations: readonly [number, number, number];
  buttonLabel: string;
  textAlign: 'left' | 'center';
};

const PAGES: Page[] = [
  {
    id: '1',
    title: 'まだ知らない沖縄に\n出会う',
    description: 'あなたにぴったりのスポット、グルメ、アクティビティを見つけましょう。',
    backgroundUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6lD5Ad0DBrztcy-aYQMRxmannSGjuU59Dy8vcnYVjlUn46a5NlHBCpGv5PH4tNYKx2MmTHjgdQEcjAjclWX8oKGLp8sn3QGr-nhj5s7SxVh9SJDC9tLzSCrvdK3at8vv_ydACptiGw1Hyt49QRPHR_prjO4urXf_DaUd95l7cr3VNwscrHrlS-hKbnhNvyKj5ve1EdAMppqvqmthL1qMCfpm2IPu8orOB-_4rqzP0J7qSsQI8rvcudsjDzKkvd6A6ydtxwQUOfxM',
    theme: 'dark',
    gradientColors: ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.25)', 'transparent'],
    gradientLocations: [0, 0.45, 1],
    buttonLabel: 'はじめる',
    textAlign: 'left',
  },
  {
    id: '2',
    title: '特別な体験を、\n日常に',
    description: '地元の人しか知らない隠れた名所や、\n伝統文化に触れる旅を。',
    backgroundUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgm1ZBdfvQipicn3FSSk8ZpVC1YQAf7w7v3tXpX6DWkrLq_e288fuvb6A9qj2bBSAyqtQgB6b22_jIGxm-P9yuXMoZ0Qxr7EoJPe4801mHsLH1g5IYcwH_F-x0EEdvw3l4a5n5sNRR5IAoePqAxBALw7ItGkfRmw9xs-QgwLCZp57xHoCsM69mwwvfC4wMmKtL5CrGks7vYJcmhCkkFyAj4HmlHl050UQdvZcCWkRdPhGSEFdYq47HOnA7ITaOpMTi88oX57dVgy8',
    theme: 'light',
    gradientColors: ['rgba(245,248,248,1)', 'rgba(245,248,248,0.88)', 'rgba(245,248,248,0)'],
    gradientLocations: [0, 0.55, 1],
    buttonLabel: '次へ',
    textAlign: 'center',
  },
  {
    id: '3',
    title: 'あなただけの\n沖縄を',
    description: '好みに合わせた最適なプランを提案。\n最高の思い出作りをお手伝いします。',
    backgroundUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACAbJ9FDHewBQJV58DfZBzXsFP-TtwfUZm-6FLHLio8TI4F9Cgiweg6SKpqC0HLlmd1DTQx2LkDTXCSqc7ncdHExJVXLW2bf5XX3x7sw4Vmn-TZey-BqMMRZlqH_jA4By1cXbsNRR5IAoePqAxBALw7ItGkfRmw9xs-QgwLCZp57xHoCsM69mwwvfC4wMmKtL5CrGks7vYJcmhCkkFyAj4HmlHl050UQdvZcCWkRdPhGSEFdYq47HOnA7ITaOpMTi88oX57dVgy8',
    theme: 'dark',
    gradientColors: ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.25)', 'transparent'],
    gradientLocations: [0, 0.45, 1],
    buttonLabel: '好みを選ぶ',
    textAlign: 'center',
  },
];

const GENRES = [
  { slug: 'nature', label: '自然・絶景', emoji: '🌿' },
  { slug: 'beach', label: 'ビーチ・海', emoji: '🏖️' },
  { slug: 'cafe', label: 'カフェ・グルメ', emoji: '☕' },
  { slug: 'history', label: '歴史・文化', emoji: '🏯' },
  { slug: 'local', label: '穴場・ローカル', emoji: '🗺️' },
  { slug: 'drive', label: 'ドライブ途中', emoji: '🚗' },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<Page>>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [step, setStep] = useState<'slides' | 'genres'>('slides');
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGenre = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/auth');
  };

  const handleFinish = async () => {
    await SecureStore.setItemAsync(GENRE_PREFS_KEY, JSON.stringify(selected));
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace('/auth');
  };

  const renderSlide = ({ item, index }: ListRenderItemInfo<Page>) => {
    const isLast = index === PAGES.length - 1;
    const isDark = item.theme === 'dark';
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const subtextColor = isDark ? 'rgba(255,255,255,0.85)' : '#475569';
    const dotInactive = isDark ? 'rgba(255,255,255,0.35)' : `${PRIMARY}55`;

    const handlePress = () => {
      if (!isLast) {
        flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
      } else {
        setStep('genres');
      }
    };

    return (
      <ImageBackground
        source={{ uri: item.backgroundUri }}
        style={{ width, height }}
        resizeMode="cover">
        <LinearGradient
          colors={item.gradientColors}
          locations={item.gradientLocations}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.pageLayout,
            { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}>
          <View style={styles.slideHeader}>
            <Text style={styles.logo}>SUI</Text>
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={styles.skipText}>スキップ</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.footer}>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: textColor, textAlign: item.textAlign }]}>
                {item.title}
              </Text>
              <Text style={[styles.description, { color: subtextColor, textAlign: item.textAlign }]}>
                {item.description}
              </Text>
            </View>

            <View style={[styles.dotsRow, item.textAlign === 'center' && styles.dotsCenter]}>
              {PAGES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === index ? PRIMARY : dotInactive, width: i === index ? 28 : 8 },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={handlePress}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>{item.buttonLabel}</Text>
              <MaterialIcons name="arrow-forward" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    );
  };

  if (step === 'genres') {
    return (
      <View style={[styles.genreScreen, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View
          style={[
            styles.genreInner,
            { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}>
          {/* ヘッダー */}
          <View style={styles.genreHeader}>
            <Text style={[styles.logo, { color: Brand.deepSea }]}>SUI</Text>
          </View>

          <View style={styles.genreBody}>
            <Text style={[styles.genreTitle, { color: colors.text }]}>
              好みのジャンルを選ぼう
            </Text>
            <Text style={[styles.genreSubtitle, { color: colors.subText }]}>
              AIルート提案に反映されます。後から変更できます。
            </Text>

            {/* ジャンルチップ */}
            <View style={styles.chipsGrid}>
              {GENRES.map((genre) => {
                const isActive = selected.includes(genre.slug);
                return (
                  <TouchableOpacity
                    key={genre.slug}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? PRIMARY : colors.card,
                        borderColor: isActive ? PRIMARY : colors.subText + '40',
                      },
                    ]}
                    onPress={() => toggleGenre(genre.slug)}
                    activeOpacity={0.75}>
                    <Text style={styles.chipEmoji}>{genre.emoji}</Text>
                    <Text style={[styles.chipLabel, { color: isActive ? '#fff' : colors.text }]}>
                      {genre.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ボタン */}
          <View style={styles.genreFooter}>
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>
                {selected.length > 0 ? `${selected.length}件選択してはじめる` : 'スキップしてはじめる'}
              </Text>
              <MaterialIcons name="arrow-forward" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  pageLayout: { flex: 1, paddingHorizontal: 28 },
  slideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 20, fontWeight: '800', letterSpacing: 4, color: '#fff' },
  skipText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },
  footer: { gap: 24 },
  textBlock: { gap: 12 },
  title: { fontSize: 32, fontWeight: '700', lineHeight: 42, letterSpacing: -0.5 },
  description: { fontSize: 16, lineHeight: 26 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotsCenter: { justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 18,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  // ジャンル選択画面
  genreScreen: { flex: 1 },
  genreInner: { flex: 1, paddingHorizontal: 28 },
  genreHeader: { marginBottom: 8 },
  genreBody: { flex: 1, justifyContent: 'center', gap: 16 },
  genreTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, lineHeight: 36 },
  genreSubtitle: { fontSize: 15, lineHeight: 22 },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
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
  genreFooter: { paddingTop: 16 },
});
