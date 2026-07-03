import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://dummy-placeholder.supabase.co'
const safeAnonKey = supabaseAnonKey || 'dummy-placeholder-anon-key'
const safeServiceKey = supabaseServiceKey || safeAnonKey

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Operating in local mock mode.')
}

// Standard client - for auth operations (login, logout)
export const supabase = createClient(safeUrl, safeAnonKey)

// Admin client using service role - bypasses RLS to read all users
export const supabaseAdmin = createClient(safeUrl, safeServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
