import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// アプリに入れてよいのは publishable キーだけ（秘密キーは絶対に置かない）
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を .env.local に設定してください",
  );
}

// 匿名ログインはステップ4で入れる。今はログインなしで読むだけ。
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
