import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/db/supabase'
import { authRateLimit, getClientIP, sanitizeObject } from '@/lib/security'
import { sendVerificationEmail } from '@/lib/email'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const limit = authRateLimit(`resend:${ip}`)
  if (!limit.success) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 })

  try {
    const body = sanitizeObject(await req.json())
    const parse = schema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

    const { email } = parse.data
    const { data: user } = await supabaseAdmin.from('profiles').select('id, full_name').eq('email', email).single()

    if (user) {
      sendVerificationEmail(email, user.full_name, user.id).catch(console.error)
    }

    return NextResponse.json({ success: true, message: 'Verification email resent if account exists.' })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
