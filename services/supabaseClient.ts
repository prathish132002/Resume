import { createClient } from '@supabase/supabase-js';

// Using Vite environment variables with fallback to provided credentials
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://chzdepzphawiwrswwyeu.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_twMs0y-tW1m5uvfkz0cJDw_uc-tCR4k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);