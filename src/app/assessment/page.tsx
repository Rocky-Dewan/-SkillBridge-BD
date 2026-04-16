'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Skill { id: string; name: string; category: string; description: string; icon: string }
interface Question { id: string; index: number; question: string; options: string[] }

export default function AssessmentPage() {
  const router = useRouter()
  const [skills, setSkills] = useState<Skill[]>([])
  const [phase, setPhase] = useState<'select' | 'testing' | 'result'>('select')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [assessmentId, setAssessmentId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    fetch('/api/assessment/skills').then(r => r.json()).then(d => setSkills(d.skills || []))
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'testing' || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { handleSubmit(); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft])

  const startAssessment = async (skill: Skill) => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/assessment/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill_id: skill.id }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSelectedSkill(skill); setAssessmentId(data.assessment_id); setQuestions(data.questions)
      setTimeLeft(15 * 60); setAnswers({}); setCurrentQ(0); setPhase('testing')
    } catch { setError('Failed to start assessment') }
    finally { setLoading(false) }
  }

  const handleSubmit = useCallback(async () => {
    if (!assessmentId) return
    setLoading(true)
    const answerArray = questions.map((_, i) => ({ question_index: i, selected_option: answers[i] ?? 0 }))
    try {
      const res = await fetch('/api/assessment/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assessment_id: assessmentId, answers: answerArray }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data.result); setPhase('result')
    } catch { setError('Failed to submit') }
    finally { setLoading(false) }
  }, [assessmentId, questions, answers])

  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category)))]
  const filteredSkills = category === 'All' ? skills : skills.filter(s => s.category === category)

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (phase === 'testing' && questions.length > 0) {
    const q = questions[currentQ]
    const progress = ((currentQ) / questions.length) * 100
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedSkill?.name} Assessment</div>
              <div className="text-xs text-gray-500">Question {currentQ + 1} of {questions.length}</div>
            </div>
            <div className={`text-sm font-mono font-bold px-3 py-1 rounded-lg ${timeLeft < 120 ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              ⏱ {fmt(timeLeft)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mb-6">
            <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Question card */}
          <div className="card p-8 mb-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">{q.question}</p>
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswers(p => ({ ...p, [currentQ]: i }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${
                    answers[currentQ] === i
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                  <span className="inline-flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${answers[currentQ] === i ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {answers[currentQ] === i ? '✓' : ['A','B','C','D'][i]}
                    </span>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0} className="btn-secondary text-sm py-2 disabled:opacity-30">← Previous</button>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentQ(i)} className={`w-7 h-7 rounded text-xs font-medium transition-all ${i === currentQ ? 'bg-brand-600 text-white' : answers[i] !== undefined ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{i + 1}</button>
              ))}
            </div>
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(p => p + 1)} className="btn-primary text-sm py-2">Next →</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary text-sm py-2 bg-green-600 hover:bg-green-700">
                {loading ? 'Submitting...' : 'Submit Assessment ✓'}
              </button>
            )}
          </div>
          {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
        </div>
      </div>
    )
  }

  if (phase === 'result' && result) {
    const scoreColor = result.percentage >= 75 ? 'text-green-600' : result.percentage >= 55 ? 'text-yellow-600' : 'text-red-500'
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">{result.percentage >= 75 ? '🏆' : result.percentage >= 55 ? '🎯' : '📚'}</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment Complete!</h1>
            <p className="text-gray-500 mb-6">{selectedSkill?.name}</p>
            <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>{result.percentage}%</div>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">{result.badge}</div>
            <div className="text-sm text-gray-500 mb-6">{result.score} / {result.total} correct answers</div>

            {result.ai_feedback && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-left mb-6">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">🤖 AI Feedback</div>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{result.ai_feedback}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => setPhase('select')} className="btn-secondary text-sm">Take Another</button>
              <button onClick={() => router.push('/dashboard')} className="btn-primary text-sm">View Dashboard →</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Skill Assessments</h1>
          <p className="text-gray-600 dark:text-gray-400">Take a 10-minute AI-powered test. Get a verified badge employers trust.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === c ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300'}`}>{c}</button>
          ))}
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-200 dark:border-red-800">{error}</div>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map(skill => (
            <div key={skill.id} className="card p-5 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all">
              <div className="text-2xl mb-3">{skill.icon === 'code' ? '💻' : skill.icon === 'trending-up' ? '📈' : skill.icon === 'database' ? '🗄️' : skill.icon === 'pen-tool' ? '🎨' : '📚'}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{skill.name}</h3>
              <p className="text-xs text-gray-500 mb-1">{skill.category}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-xs leading-relaxed">{skill.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>⏱ 10-15 minutes</span>
                <span>10 questions</span>
              </div>
              <button onClick={() => startAssessment(skill)} disabled={loading} className="btn-primary w-full text-sm py-2.5 justify-center">
                {loading ? 'Loading...' : 'Start Assessment →'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
