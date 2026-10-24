import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonymousKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonymousKey);

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonymousKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    console.error(
      'Supabase is not configured. Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY in environment variables.',
    );
    throw new Error('Catalogue temporarily unavailable. Please try again shortly.');
  }
  return supabase;
}
