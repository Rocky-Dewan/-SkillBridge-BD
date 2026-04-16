import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth } from '@/lib/security'

export async function GET(req: NextRequest) {
  const { user, response: authErr } = await requireAuth(req)
  if (authErr) return authErr
  try {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ notifications: data || [] })
  } catch (e) {
    return NextResponse.json({ notifications: [] })
  }
}

export async function PATCH(req: NextRequest) {
  const { user, response: authErr } = await requireAuth(req)
  if (authErr) return authErr
  try {
    const body = await req.json()
    if (body.all) {
      await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false)
    } else if (body.id) {
      await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', body.id).eq('user_id', user!.id)
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
