import { createClient } from '@supabase/supabase-js'
import { VITE_SUPABASE_URL as url, VITE_SUPABASE_ANON_KEY as anonKey } from './env'

// Trim whitespace (common copy/paste issue)
const key = typeof anonKey === 'string' ? anonKey.trim() : undefined

let supabase: ReturnType<typeof createClient> | null = null
if (url && key) {
  try {
    supabase = createClient(url, key)
  } catch (e) {
    console.error('[Supabase] createClient failed:', e)
  }
}

export { supabase }
export const isSupabaseConfigured = Boolean(supabase)
