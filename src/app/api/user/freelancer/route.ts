import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, rateLimit } from '@/lib/security'
import { generateFreelancerProfile } from '@/lib/ai'

export async function GET(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user!.id).single()
    const { data: assessments } = await supabaseAdmin.from('assessments').select('skill_name, level, percentage').eq('user_id', user!.id).eq('status', 'completed').order('percentage', { ascending: false })
    const { data: freelancerProfile } = await supabaseAdmin.from('freelancer_profiles').select('*').eq('id', user!.id).single()

    return NextResponse.json({ profile, assessments, freelancer_profile: freelancerProfile })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch freelancer profile' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const limit = rateLimit(`gen_profile:${user!.id}`, 5, 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Profile generation limit (5/hour)' }, { status: 429 })

  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user!.id).single()
    const { data: assessments } = await supabaseAdmin.from('assessments').select('skill_name, level, percentage').eq('user_id', user!.id).eq('status', 'completed').order('percentage', { ascending: false }).limit(8)

    if (!assessments || assessments.length === 0) {
      return NextResponse.json({ error: 'You need at least 1 completed assessment to generate a freelancer profile.' }, { status: 400 })
    }

    const aiProfile = await generateFreelancerProfile({
      name: profile?.full_name || 'Professional',
      skills: assessments.map(a => ({ name: a.skill_name, level: a.level, score: a.percentage })),
      bio: profile?.bio || '',
    })

    // Upsert freelancer profile
    await supabaseAdmin.from('freelancer_profiles').upsert({
      id: user!.id,
      skills_summary: assessments,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, ai_profile: aiProfile })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to generate profile' }, { status: 500 })
  }
}
