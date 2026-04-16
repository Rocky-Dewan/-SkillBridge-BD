import { NextRequest, NextResponse } from 'next/server'
import { assessmentStartSchema } from '@/lib/validation/schemas'
import { createServerSupabase, supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, rateLimit, getClientIP, sanitizeObject } from '@/lib/security'
import { generateAssessmentQuestions } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const ip = getClientIP(req)
  const limit = rateLimit(`assessment:${user!.id}`, 10, 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Assessment rate limit reached. Try again in 1 hour.' }, { status: 429 })

  try {
    const body = await req.json()
    const parse = assessmentStartSchema.safeParse(sanitizeObject(body))
    if (!parse.success) return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 })

    const { skill_id } = parse.data

    // Fetch skill
    const { data: skill } = await supabaseAdmin.from('skills').select('*').eq('id', skill_id).eq('is_active', true).single()
    if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })

    // Check for existing in-progress assessment
    const { data: existing } = await supabaseAdmin
      .from('assessments')
      .select('id, status, started_at')
      .eq('user_id', user!.id)
      .eq('skill_id', skill_id)
      .eq('status', 'in_progress')
      .single()

    if (existing) {
      // Expire if older than 30 mins
      const started = new Date(existing.started_at).getTime()
      if (Date.now() - started > 30 * 60 * 1000) {
        await supabaseAdmin.from('assessments').update({ status: 'expired' }).eq('id', existing.id)
      } else {
        return NextResponse.json({ error: 'You have an assessment in progress. Complete it first.' }, { status: 409 })
      }
    }

    // Get cached questions or generate new ones
    let questions = []
    const { data: cachedQs } = await supabaseAdmin
      .from('assessment_questions')
      .select('*')
      .eq('skill_id', skill_id)
      .eq('is_active', true)
      .order('times_used', { ascending: true })
      .limit(10)

    if (cachedQs && cachedQs.length >= 10) {
      questions = cachedQs.slice(0, 10)
    } else {
      // Generate with AI
      const level = 'intermediate'
      const generated = await generateAssessmentQuestions({ skillName: skill.name, level, count: 10 })
      // Cache questions
      const toInsert = generated.questions.map((q: any) => ({
        skill_id,
        difficulty: level,
        question_text: q.question,
        options: q.options,
        correct_answer: q.correct,
        explanation: q.explanation,
      }))
      const { data: inserted } = await supabaseAdmin.from('assessment_questions').insert(toInsert).select()
      questions = inserted || toInsert.map((q: any, i: number) => ({ ...q, id: `temp_${i}` }))
    }

    // Create assessment record
    const { data: assessment } = await supabaseAdmin.from('assessments').insert({
      user_id: user!.id,
      skill_id,
      skill_name: skill.name,
      status: 'in_progress',
      questions_total: 10,
      started_at: new Date().toISOString(),
    }).select().single()

    // Return questions WITHOUT correct answers
    const safeQuestions = questions.map((q: any, idx: number) => ({
      id: q.id,
      index: idx,
      question: q.question_text,
      options: q.options,
    }))

    return NextResponse.json({ assessment_id: assessment.id, skill: skill.name, questions: safeQuestions, time_limit_minutes: 15 })
  } catch (e) {
    console.error('Assessment start error:', e)
    return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 })
  }
}
