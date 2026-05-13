import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const CHUNK_SIZE = 2000; // expo-secure-store の上限 2048 バイトより小さく設定

// 2KB を超えるセッション値を複数キーに分割して保存するアダプター
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const numChunks = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!numChunks) return SecureStore.getItemAsync(key);
    const parts: string[] = [];
    for (let i = 0; i < Number(numChunks); i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
      if (chunk == null) return null;
      parts.push(chunk);
    }
    return parts.join('');
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const numChunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_chunks`, String(numChunks));
    for (let i = 0; i < numChunks; i++) {
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const numChunks = await SecureStore.getItemAsync(`${key}_chunks`);
    if (numChunks) {
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      for (let i = 0; i < Number(numChunks); i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
