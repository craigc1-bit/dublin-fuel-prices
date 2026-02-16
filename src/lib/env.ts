// Injected at build time by Vite define (see vite.config.ts).
declare const __SUPABASE_URL__: string
declare const __SUPABASE_ANON_KEY__: string

const fromEnv = (v: string) => (typeof v === 'string' && v.trim() ? v.trim() : '')

export const VITE_SUPABASE_URL = fromEnv(__SUPABASE_URL__ ?? '')
export const VITE_SUPABASE_ANON_KEY = fromEnv(__SUPABASE_ANON_KEY__ ?? '')
