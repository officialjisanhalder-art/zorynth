import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Use fallback dummy values to prevent library crash when keys are missing
const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://dummy-placeholder.supabase.co'
const safeKey = supabaseAnonKey || 'dummy-placeholder-anon-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Operating in local mock mode.')
}

export const supabase = createClient(safeUrl, safeKey)

