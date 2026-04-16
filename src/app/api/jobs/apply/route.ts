import { NextRequest, NextResponse } from 'next/server'
import { applicationSchema } from '@/lib/validation/schemas'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, rateLimit, sanitizeObject } from '@/lib/security'
import { scoreJobMatch } from '@/lib/ai'
import { sendJobApplicationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const limit = rateLimit(`apply:${user!.id}`, 20, 24 * 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Application limit: 20 per day' }, { status: 429 })

  try {
    const body = await req.json()
    const parse = applicationSchema.safeParse(sanitizeObject(body))
    if (!parse.success) return NextResponse.json({ error: 'Invalid application data' }, { status: 400 })

    const { job_id, cover_letter } = parse.data

    // Fetch job
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('*, companies(name)')
      .eq('id', job_id)
      .eq('status', 'active')
      .single()
    if (!job) return NextResponse.json({ error: 'Job not found or no longer active' }, { status: 404 })

    // Check skill score requirement
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user!.id).single()
    if (profile && job.min_skill_score > 0 && (profile.skill_score || 0) < job.min_skill_score) {
      return NextResponse.json({
        error: `This job requires a minimum skill score of ${job.min_skill_score}. Your current score is ${profile.skill_score || 0}. Take more assessments to qualify.`,
      }, { status: 403 })
    }

    // Check duplicate application
    const { data: existing } = await supabaseAdmin.from('applications').select('id').eq('job_id', job_id).eq('applicant_id', user!.id).single()
    if (existing) return NextResponse.json({ error: 'You have already applied for this job' }, { status: 409 })

    // AI match scoring (async)
    let matchScore = 0
    try {
      const { data: userAssessments } = await supabaseAdmin.from('assessments').select('skill_name, percentage, level').eq('user_id', user!.id).eq('status', 'completed')
      const matchResult = await scoreJobMatch({
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: job.required_skills || [],
        userSkills: userAssessments?.map(a => ({ name: a.skill_name, score: a.percentage, level: a.level })) || [],
        userBio: profile?.bio || '',
      })
      matchScore = matchResult.matchScore || 0
    } catch { matchScore = 50 }

    // Create application
    const { data: application, error } = await supabaseAdmin.from('applications').insert({
      job_id,
      applicant_id: user!.id,
      cover_letter,
      skill_match_score: matchScore,
    }).select().single()

    if (error) throw error

    // Increment job application count
    await supabaseAdmin.from('jobs').update({ applications_count: (job.applications_count || 0) + 1 }).eq('id', job_id)

    // Send confirmation email
    if (profile) sendJobApplicationEmail(profile.email, profile.full_name, job.title, job.companies?.name || '').catch(() => {})

    return NextResponse.json({ success: true, application, match_score: matchScore }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
