import { createClient } from '@supabase/supabase-js'

// Environment variables loaded from GitHub Secrets or .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID // optional

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export project ID if needed for logging or multi-project scenarios
export { supabaseProjectId }
