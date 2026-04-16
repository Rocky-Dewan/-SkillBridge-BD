import { NextRequest, NextResponse } from 'next/server'
import { profileUpdateSchema } from '@/lib/validation/schemas'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, sanitizeObject, auditLog } from '@/lib/security'

export async function GET(req: NextRequest) {
  const { user, response: authErr } = await requireAuth(req)
  if (authErr) return authErr
  try {
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('*').eq('id', user!.id).single()
    if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    return NextResponse.json({ profile })
  } catch { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const { user, response: authErr } = await requireAuth(req)
  if (authErr) return authErr
  try {
    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const parse = profileUpdateSchema.safeParse(sanitized)
    if (!parse.success) return NextResponse.json({ error: 'Validation failed', details: parse.error.flatten() }, { status: 400 })

    const updates = Object.fromEntries(Object.entries(parse.data).filter(([, v]) => v !== undefined))

    // Calculate profile completeness
    const { data: existing } = await supabaseAdmin.from('profiles').select('*').eq('id', user!.id).single()
    const merged = { ...existing, ...updates }
    const completeness = [merged.full_name, merged.bio, merged.phone, merged.location, merged.linkedin_url].filter(Boolean).length * 20

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, profile_completeness: completeness, updated_at: new Date().toISOString() })
      .eq('id', user!.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ profile: data })
  } catch { return NextResponse.json({ error: 'Update failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const { user, response: authErr } = await requireAuth(req)
  if (authErr) return authErr
  try {
    auditLog({ userId: user!.id, action: 'user.account.deleted' }).catch(() => {})
    // Delete auth user (cascade deletes profile via FK)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user!.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
