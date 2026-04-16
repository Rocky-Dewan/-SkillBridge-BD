import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db/supabase'
import { sanitizeObject, validatePassword } from '@/lib/security'

const schema = z.object({
  password: z.string().min(8),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: 'Passwords do not match' })

export async function POST(req: NextRequest) {
  try {
    const body = sanitizeObject(await req.json())
    const parse = schema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: parse.error.errors[0].message }, { status: 400 })

    const { password } = parse.data
    const { valid, errors } = validatePassword(password)
    if (!valid) return NextResponse.json({ error: errors[0] }, { status: 400 })

    const supabase = createServerSupabase()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, message: 'Password updated successfully.' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
