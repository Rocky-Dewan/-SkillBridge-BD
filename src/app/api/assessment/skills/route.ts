import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth } from '@/lib/security'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userAssessments = searchParams.get('user_assessments') === 'true'

    if (userAssessments) {
      const { user, response: authErr } = await requireAuth(req)
      if (authErr) return authErr
      const { data } = await supabaseAdmin
        .from('assessments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
      return NextResponse.json({ assessments: data || [] })
    }

    const { data: skills, error } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return NextResponse.json({ skills: skills || [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ skills: [], assessments: [] })
  }
}
