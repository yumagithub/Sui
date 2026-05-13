import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { supabase } from '@/services/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { session, loading } = useAuth();

  // メール確認リンク（sui://）をアプリで受け取ってセッションを確立する
  useEffect(() => {
    const handleUrl = async (url: string) => {
      // Supabase がリダイレクトする URL に access_token / refresh_token が含まれる
      if (url.includes('access_token') || url.includes('refresh_token')) {
        const parsed = Linking.parse(url);
        const params = parsed.queryParams ?? {};
        const accessToken = params['access_token'] as string | undefined;
        const refreshToken = params['refresh_token'] as string | undefined;
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    };

    // アプリ起動時に受け取った URL を処理
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // アプリが開いている間に受け取った URL を処理
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="spot/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
