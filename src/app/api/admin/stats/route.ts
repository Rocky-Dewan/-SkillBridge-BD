import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth } from '@/lib/security'

export async function GET(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  // Verify admin role
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [
      { count: totalUsers },
      { count: totalAssessments },
      { count: totalJobs },
      { count: totalApplications },
      { data: recentUsers },
      { data: topSkills },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('assessments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('id, email, full_name, role, created_at, skill_score').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('assessments').select('skill_name').eq('status', 'completed').limit(1000),
    ])

    // Count skill frequency
    const skillCount: Record<string, number> = {}
    topSkills?.forEach(a => { skillCount[a.skill_name] = (skillCount[a.skill_name] || 0) + 1 })
    const sortedSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      stats: { totalUsers, totalAssessments, totalJobs, totalApplications },
      recentUsers,
      topSkills: sortedSkills,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
