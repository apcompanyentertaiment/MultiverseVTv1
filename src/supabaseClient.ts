import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

console.log('Supabase Config:', {
  url: supabaseUrl ? 'Configurada' : 'Faltante',
  key: supabaseAnonKey ? 'Configurada' : 'Faltante'
})
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Variables de entorno faltantes:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✓' : '✗ Faltante',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓' : '✗ Faltante'
  })
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null