import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'smart_investor_supabase_url';
const STORAGE_KEY_ANON_KEY = 'smart_investor_supabase_anon_key';

// Credenciales por defecto configuradas para el proyecto de Supabase del usuario
export const DEFAULT_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://cbhkomvhgbxmvxhxgelu.supabase.co';

export const DEFAULT_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_-8UfSU0Z4gbodIbIhjyRlg_Mfkyeuw7';

let currentSupabaseUrl = DEFAULT_SUPABASE_URL;
let currentSupabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY;

export let supabase: SupabaseClient = createClient(currentSupabaseUrl, currentSupabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function initSupabaseClient(url: string, anonKey: string) {
  if (!url || !anonKey) return;
  currentSupabaseUrl = url.trim();
  currentSupabaseAnonKey = anonKey.trim();

  supabase = createClient(currentSupabaseUrl, currentSupabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export async function loadStoredSupabaseConfig() {
  try {
    const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_URL);
    const storedKey = await AsyncStorage.getItem(STORAGE_KEY_ANON_KEY);
    if (storedUrl && storedKey) {
      initSupabaseClient(storedUrl, storedKey);
    } else {
      initSupabaseClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    }
  } catch (err) {
    console.warn('Error loading Supabase config from storage:', err);
    initSupabaseClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
}

export async function saveSupabaseConfig(url: string, anonKey: string) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_URL, url);
    await AsyncStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey);
    initSupabaseClient(url, anonKey);
  } catch (err) {
    console.warn('Error saving Supabase config to storage:', err);
  }
}

export function getSupabaseConfig() {
  return {
    url: currentSupabaseUrl,
    anonKey: currentSupabaseAnonKey,
  };
}
