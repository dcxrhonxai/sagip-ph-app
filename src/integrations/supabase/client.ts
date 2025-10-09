import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Vite requires VITE_ prefix for env vars
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Optional default location fallback
export const DEFAULT_LAT = parseFloat(import.meta.env.VITE_DEFAULT_LAT || '14.5995');
export const DEFAULT_LNG = parseFloat(import.meta.env.VITE_DEFAULT_LNG || '120.9842');
