import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const envKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
const extraUrl = (Constants?.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const extraKey = (Constants?.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const supabaseUrl = envUrl || extraUrl;
const supabaseAnonKey = envKey || extraKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Supabase URL or Anon Key is missing. Check .env variables.');
} else {
  const redact = (s: string) => (s.length > 8 ? `${s.slice(0, 6)}…${s.slice(-4)}` : '***');
  console.log('[Supabase] Using project URL:', supabaseUrl);
  console.log('[Supabase] Using anon key:', redact(supabaseAnonKey));
}

const isWeb = Platform.OS === 'web';
const options: Parameters<typeof createClient>[2] = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // allow url detection for web if needed
  },
};

if (!isWeb) {
  // Only use AsyncStorage on native; web uses localStorage by default
  (options.auth as any).storage = AsyncStorage as any;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);