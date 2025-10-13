// This file sets up the Supabase client for your app
// Do not edit the automatically generated types in ./types

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use GitHub Actions / Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
