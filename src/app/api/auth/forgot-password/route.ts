import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/db/supabase'
import { authRateLimit, getClientIP, sanitizeObject } from '@/lib/security'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const limit = authRateLimit(`forgot:${ip}`)
  if (!limit.success) return NextResponse.json({ error: 'Too many attempts. Wait 15 minutes.' }, { status: 429 })

  try {
    const body = sanitizeObject(await req.json())
    const parse = schema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    const { email } = parse.data

    // Check if user exists (but ALWAYS return same message for security)
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('email', email)
      .single()

    if (user) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password` },
      })
      if (!error && data?.properties?.action_link) {
        const { sendPasswordResetEmail } = await import('@/lib/email')
        sendPasswordResetEmail(email, data.properties.action_link).catch(console.error)
      }
    }

    // Never reveal whether email exists
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
