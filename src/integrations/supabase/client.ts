// This file sets up the Supabase client for your app
// Do not edit the automatically generated types in ./types

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Vite injects env vars prefixed with VITE_ automatically
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
