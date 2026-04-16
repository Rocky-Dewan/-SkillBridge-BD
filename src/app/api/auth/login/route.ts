import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validation/schemas'
import { createServerSupabase, supabaseAdmin } from '@/lib/db/supabase'
import { authRateLimit, getClientIP, sanitizeObject, auditLog } from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const limit = authRateLimit(`login:${ip}`)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many login attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const parse = loginSchema.safeParse(sanitized)
    if (!parse.success) return NextResponse.json({ error: 'Invalid credentials format' }, { status: 400 })

    const { email, password } = parse.data
    const supabase = createServerSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Check if email not confirmed
      if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
        return NextResponse.json({
          error: 'Email not verified. Please check your inbox.',
          requiresVerification: true,
        }, { status: 401 })
      }
      auditLog({ action: 'user.login.failed', ipAddress: ip, metadata: { email: email.substring(0, 5) + '***' } }).catch(() => {})
      // Use generic message to avoid user enumeration
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Double-check email_confirmed_at
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      return NextResponse.json({
        error: 'Please verify your email before logging in.',
        requiresVerification: true,
      }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single()

    // Update last active
    supabaseAdmin.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', data.user.id).then(() => {})

    auditLog({ userId: data.user.id, action: 'user.login', ipAddress: ip, userAgent: req.headers.get('user-agent') || '' }).catch(() => {})

    return NextResponse.json({ success: true, user: profile, session: data.session })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
