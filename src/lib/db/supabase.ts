import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client (for API routes and Server Components)
export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options: CookieOptions) {
        try { (await cookieStore).set({ name, value, ...options }) } catch {}
      },
      async remove(name: string, options: CookieOptions) {
        try { (await cookieStore).set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}

// Admin client (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
