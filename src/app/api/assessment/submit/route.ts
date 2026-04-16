import { NextRequest, NextResponse } from 'next/server'
import { assessmentSubmitSchema } from '@/lib/validation/schemas'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, sanitizeObject } from '@/lib/security'
import { generateAssessmentFeedback } from '@/lib/ai'
import { sendAssessmentCompleteEmail } from '@/lib/email'

function getLevel(pct: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (pct >= 90) return 'expert'
  if (pct >= 75) return 'advanced'
  if (pct >= 55) return 'intermediate'
  return 'beginner'
}

function getBadge(level: string): string {
  return { beginner: '🔵 Beginner', intermediate: '🟡 Intermediate', advanced: '🟠 Advanced', expert: '🏆 Expert' }[level] || '🔵 Beginner'
}

export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const parse = assessmentSubmitSchema.safeParse(sanitizeObject(body))
    if (!parse.success) return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })

    const { assessment_id, answers } = parse.data

    // Fetch assessment (verify ownership)
    const { data: assessment } = await supabaseAdmin
      .from('assessments')
      .select('*, skills(*)')
      .eq('id', assessment_id)
      .eq('user_id', user!.id)
      .eq('status', 'in_progress')
      .single()

    if (!assessment) return NextResponse.json({ error: 'Assessment not found or already completed' }, { status: 404 })

    // Check time limit (15 min)
    const elapsed = (Date.now() - new Date(assessment.started_at).getTime()) / 1000
    if (elapsed > 15 * 60 + 30) {
      await supabaseAdmin.from('assessments').update({ status: 'expired' }).eq('id', assessment_id)
      return NextResponse.json({ error: 'Assessment time expired' }, { status: 400 })
    }

    // Fetch questions with correct answers
    const { data: questions } = await supabaseAdmin
      .from('assessment_questions')
      .select('*')
      .eq('skill_id', assessment.skill_id)
      .eq('is_active', true)
      .limit(10)

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 500 })
    }

    // Grade answers
    let correct = 0
    const wrongAnswers: any[] = []
    const gradedAnswers = answers.map((ans, idx) => {
      const q = questions[idx]
      if (!q) return ans
      const isCorrect = ans.selected_option === q.correct_answer
      if (isCorrect) correct++
      else wrongAnswers.push({ question: q.question_text, userAnswer: q.options[ans.selected_option], correctAnswer: q.options[q.correct_answer] })
      // Update question stats
      supabaseAdmin.from('assessment_questions').update({
        times_used: (q.times_used || 0) + 1,
        success_rate: isCorrect ? Math.min(100, (q.success_rate || 50) + 2) : Math.max(0, (q.success_rate || 50) - 2),
      }).eq('id', q.id).then(() => {})
      return { ...ans, is_correct: isCorrect, correct_answer: q.correct_answer, explanation: q.explanation }
    })

    const percentage = Math.round((correct / questions.length) * 100)
    const level = getLevel(percentage)
    const badge = getBadge(level)

    // Generate AI feedback (non-blocking, best-effort)
    let aiFeedback = ''
    try {
      aiFeedback = await generateAssessmentFeedback({
        skillName: assessment.skill_name,
        score: percentage,
        level,
        wrongAnswers: wrongAnswers.slice(0, 5),
      })
    } catch { aiFeedback = `You scored ${percentage}% on the ${assessment.skill_name} assessment. Keep practicing to improve your score!` }

    // Update assessment record
    const { data: updated } = await supabaseAdmin.from('assessments').update({
      status: 'completed',
      score: correct,
      max_score: questions.length,
      percentage,
      level,
      badge_earned: badge,
      questions_correct: correct,
      time_taken_seconds: Math.round(elapsed),
      answers: gradedAnswers,
      ai_feedback: aiFeedback,
      completed_at: new Date().toISOString(),
    }).eq('id', assessment_id).select().single()

    // Fetch user email for notification
    const { data: profile } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', user!.id).single()
    if (profile) {
      sendAssessmentCompleteEmail(profile.email, profile.full_name, assessment.skill_name, percentage, badge).catch(() => {})
    }

    // Create notification
    supabaseAdmin.from('notifications').insert({
      user_id: user!.id,
      type: 'assessment_complete',
      title: `${assessment.skill_name} Assessment Complete!`,
      message: `You scored ${percentage}% and earned the ${badge} badge.`,
      data: { assessment_id, score: percentage, badge },
    }).then(() => {})

    return NextResponse.json({
      success: true,
      result: {
        score: correct,
        total: questions.length,
        percentage,
        level,
        badge,
        ai_feedback: aiFeedback,
        answers: gradedAnswers,
      },
    })
  } catch (e) {
    console.error('Assessment submit error:', e)
    return NextResponse.json({ error: 'Failed to grade assessment' }, { status: 500 })
  }
}
