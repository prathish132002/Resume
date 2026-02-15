import { createClient } from '@supabase/supabase-js';

// Using the provided credentials
const supabaseUrl = 'https://chzdepzphawiwrswwyeu.supabase.co';
const supabaseAnonKey = 'sb_publishable_twMs0y-tW1m5uvfkz0cJDw_uc-tCR4k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);