import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'smart_investor_supabase_url';
const STORAGE_KEY_ANON_KEY = 'smart_investor_supabase_anon_key';

// Credenciales por defecto (pueden ser configuradas dinámicamente desde la app o variables de entorno)
let currentSupabaseUrl = 'https://xyzcompany.supabase.co';
let currentSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

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
    }
  } catch (err) {
    console.warn('Error loading Supabase config from storage:', err);
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
