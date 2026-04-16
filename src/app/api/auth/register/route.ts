import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validation/schemas'
import { supabaseAdmin } from '@/lib/db/supabase'
import { authRateLimit, getClientIP, sanitizeObject, auditLog } from '@/lib/security'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const limit = authRateLimit(ip)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const parse = registerSchema.safeParse(sanitized)
    if (!parse.success) {
      return NextResponse.json({ error: 'Validation failed', details: parse.error.flatten() }, { status: 400 })
    }

    const { email, password, full_name, role } = parse.data

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    // Create user — email_confirm: false means Supabase sends a confirmation email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name, role },
      email_confirm: false, // REQUIRE email verification
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update role (trigger creates profile on signup)
    await supabaseAdmin.from('profiles').update({ role }).eq('id', authData.user.id)

    // Send verification email via Supabase (generates secure token)
    const { error: otpErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?email=${encodeURIComponent(email)}`,
      },
    })

    // Also send our branded welcome+verify email
    sendVerificationEmail(email, full_name, authData.user.id).catch(console.error)

    auditLog({ userId: authData.user.id, action: 'user.register', ipAddress: ip, metadata: { role } }).catch(console.error)

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: 'Account created! Please check your email and click the verification link before logging in.',
      email,
    }, { status: 201 })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
