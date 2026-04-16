'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Assessment {
  id: string
  skill_name: string
  percentage: number
  level: string
  badge_earned: string
  status: string
  questions_total: number
  questions_correct: number
  time_taken_seconds: number
  completed_at: string
  ai_feedback: string
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/assessment/skills?user_assessments=true')
      .then(r => r.json())
      .then(d => setAssessments(d.assessments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const levelColor: Record<string, string> = {
    expert: 'bg-green-100 text-green-700 border-green-200',
    advanced: 'bg-orange-100 text-orange-700 border-orange-200',
    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    beginner: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  const scoreColor = (pct: number) =>
    pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'

  const fmt = (sec: number) => sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Skill Badges</h1>
          <p className="text-gray-500 text-sm mt-0.5">All your verified skill assessments</p>
        </div>
        <Link href="/assessment" className="btn-primary text-sm">+ Take New Assessment</Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : assessments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No assessments yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-5">Take your first assessment to start building verified skill badges</p>
          <Link href="/assessment" className="btn-primary">Take Your First Assessment →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => (
            <div key={a.id} className="card overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-col font-bold ${a.percentage >= 80 ? 'bg-green-100' : a.percentage >= 60 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                      <span className={`text-lg ${scoreColor(a.percentage)}`}>{Math.round(a.percentage)}%</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{a.skill_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${levelColor[a.level] || levelColor.beginner}`}>
                          {a.badge_earned || a.level}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(a.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="hidden sm:block text-xs text-gray-500">
                      <div>{a.questions_correct}/{a.questions_total} correct</div>
                      <div>{a.time_taken_seconds ? fmt(a.time_taken_seconds) : '–'}</div>
                    </div>
                    <span className="text-gray-400 text-lg">{expanded === a.id ? '▲' : '▼'}</span>
                  </div>
                </div>
              </div>

              {expanded === a.id && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{a.questions_correct}/{a.questions_total}</div>
                      <div className="text-xs text-gray-500">Correct answers</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className={`text-xl font-bold ${scoreColor(a.percentage)}`}>{Math.round(a.percentage)}%</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{a.time_taken_seconds ? fmt(a.time_taken_seconds) : '–'}</div>
                      <div className="text-xs text-gray-500">Time taken</div>
                    </div>
                  </div>
                  {a.ai_feedback && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">🤖 AI Feedback</div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{a.ai_feedback}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link href="/assessment" className="btn-secondary text-xs py-1.5">Retake Assessment</Link>
                    <Link href="/dashboard/profile" className="btn-secondary text-xs py-1.5">View on Profile</Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
