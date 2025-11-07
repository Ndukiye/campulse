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