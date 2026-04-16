import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url))
}
