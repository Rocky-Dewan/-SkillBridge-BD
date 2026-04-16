'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FreelancerProfile {
  id: string
  full_name: string
  title: string
  bio: string
  skill_score: number
  location: string
  hourly_rate_min: number
  hourly_rate_max: number
  skills_summary: Array<{ name: string; level: string; score: number }>
  portfolio_url: string
  linkedin_url: string
  github_url: string
  jobs_completed: number
  client_rating: number
  availability: string
  languages: string[]
  total_assessments: number
}

export default function FreelancerPage() {
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatedProfile, setGeneratedProfile] = useState<{ id: string; text: string } | null>(null)

  useEffect(() => { fetchFreelancers() }, [])

  async function fetchFreelancers() {
    setLoading(true)
    try {
      const res = await fetch('/api/user/freelancer')
      if (res.ok) {
        const data = await res.json()
        setFreelancers(data.freelancers || mockFreelancers)
      } else {
        setFreelancers(mockFreelancers)
      }
    } catch { setFreelancers(mockFreelancers) }
    finally { setLoading(false) }
  }

  async function generateExportProfile(freelancerId: string, freelancerName: string) {
    setGenerating(freelancerId)
    try {
      const res = await fetch('/api/user/freelancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_profile', freelancer_id: freelancerId }),
      })
      const data = await res.json()
      setGeneratedProfile({ id: freelancerId, text: data.profile || 'Could not generate profile. Please try again.' })
    } catch { setGeneratedProfile({ id: freelancerId, text: 'Error generating profile.' }) }
    finally { setGenerating(null) }
  }

  const filtered = freelancers.filter(f => {
    const matchSearch = !search || f.full_name.toLowerCase().includes(search.toLowerCase()) || f.title?.toLowerCase().includes(search.toLowerCase())
    const matchSkill = !skillFilter || f.skills_summary?.some(s => s.name.toLowerCase().includes(skillFilter.toLowerCase()))
    const matchScore = f.skill_score >= minScore
    return matchSearch && matchSkill && matchScore
  })

  function ScoreRing({ score }: { score: number }) {
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-blue-600'
    const bg = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-blue-50'
    return (
      <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center flex-col`}>
        <span className={`text-lg font-bold ${color}`}>{score}</span>
        <span className="text-xs text-gray-500">score</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="page-container py-8">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">SB</div>
              <span className="font-bold text-gray-900 dark:text-white">SkillBridge BD</span>
            </Link>
            <div className="flex gap-3">
              <Link href="/auth/login" className="btn-secondary text-sm py-2">Log in</Link>
              <Link href="/dashboard" className="btn-primary text-sm py-2">Dashboard</Link>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-6 mb-2">Verified Freelancers</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse AI-verified Bangladeshi freelancers. Every skill score is tested, not self-reported.</p>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Search freelancers</label>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Name or title..." />
          </div>
          <div className="flex-1 min-w-40">
            <label className="label text-xs">Filter by skill</label>
            <input value={skillFilter} onChange={e => setSkillFilter(e.target.value)} className="input" placeholder="e.g. React, Python..." />
          </div>
          <div className="min-w-44">
            <label className="label text-xs">Min skill score: <span className="font-bold text-brand-600">{minScore}</span></label>
            <input type="range" min={0} max={100} step={10} value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-brand-600" />
          </div>
          <div className="text-sm text-gray-500">{filtered.length} freelancers</div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3 animate-pulse">
                <div className="flex gap-3"><div className="skeleton w-12 h-12 rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div></div>
                <div className="skeleton h-12 w-full" />
                <div className="flex gap-2"><div className="skeleton h-6 w-16 rounded-full" /><div className="skeleton h-6 w-16 rounded-full" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(f => (
              <div key={f.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                    {f.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{f.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{f.title || 'Freelancer'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{f.location || 'Bangladesh'}</div>
                  </div>
                  <ScoreRing score={f.skill_score || 0} />
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{f.bio || 'Verified Bangladeshi freelancer on SkillBridge BD.'}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(f.skills_summary || []).slice(0, 4).map(s => (
                    <span key={s.name} className={`badge-skill text-xs ${s.score >= 80 ? 'bg-green-100 text-green-700' : s.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      ✓ {s.name}
                    </span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs text-gray-500 py-2.5 border-t border-gray-100 dark:border-gray-800 mb-3">
                  <span>💼 {f.jobs_completed || 0} projects</span>
                  <span>⭐ {f.client_rating ? f.client_rating.toFixed(1) : 'New'}</span>
                  <span className={`font-medium ${f.availability === 'available' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {f.availability === 'available' ? '● Available' : '◐ Busy'}
                  </span>
                </div>

                {/* Rate */}
                {(f.hourly_rate_min || f.hourly_rate_max) && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    💰 ${f.hourly_rate_min || '?'}–${f.hourly_rate_max || '?'}/hr USD
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => generateExportProfile(f.id, f.full_name)}
                    disabled={generating === f.id}
                    className="btn-primary flex-1 py-1.5 text-xs"
                  >
                    {generating === f.id ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : '🤖 AI Export Profile'}
                  </button>
                  {f.portfolio_url && (
                    <a href={f.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 text-xs px-3">Portfolio</a>
                  )}
                </div>

                {/* Generated profile display */}
                {generatedProfile?.id === f.id && (
                  <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">AI-Generated Export Profile</span>
                      <button onClick={() => { navigator.clipboard.writeText(generatedProfile.text) }} className="text-xs text-brand-600 hover:underline">Copy</button>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedProfile.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600 dark:text-gray-400">No freelancers found matching your filters.</p>
            <button onClick={() => { setSearch(''); setSkillFilter(''); setMinScore(0) }} className="btn-secondary mt-4 text-sm">Clear filters</button>
          </div>
        )}

        {/* CTA banner */}
        <div className="mt-10 card p-8 text-center bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border-brand-200 dark:border-brand-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you a freelancer?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">Get verified, build your export profile, and reach international clients — without Upwork&apos;s 20% fee.</p>
          <Link href="/auth/register?role=freelancer" className="btn-primary px-8">Start Free — Get Verified Today →</Link>
        </div>
      </div>
    </div>
  )
}

// Mock data for demo/fallback
const mockFreelancers: FreelancerProfile[] = [
  { id: '1', full_name: 'Rafiq Ahmed', title: 'Full Stack Developer', bio: 'React + Node.js developer with 4 years experience. Built 30+ projects for clients in USA, UK, and Australia.', skill_score: 87, location: 'Dhaka', hourly_rate_min: 25, hourly_rate_max: 45, skills_summary: [{ name: 'React', level: 'expert', score: 92 }, { name: 'Node.js', level: 'advanced', score: 85 }, { name: 'SQL', level: 'advanced', score: 83 }], portfolio_url: '#', linkedin_url: '#', github_url: '#', jobs_completed: 47, client_rating: 4.9, availability: 'available', languages: ['English', 'Bangla'], total_assessments: 5 },
  { id: '2', full_name: 'Nadia Islam', title: 'UI/UX Designer & Brand Strategist', bio: 'Figma expert. Created brand identities for 20+ startups. Specializing in mobile-first design for South Asian market.', skill_score: 91, location: 'Chittagong', hourly_rate_min: 20, hourly_rate_max: 40, skills_summary: [{ name: 'UI/UX Design', level: 'expert', score: 95 }, { name: 'Graphic Design', level: 'advanced', score: 88 }], portfolio_url: '#', linkedin_url: '#', github_url: '', jobs_completed: 62, client_rating: 5.0, availability: 'available', languages: ['English', 'Bangla'], total_assessments: 3 },
  { id: '3', full_name: 'Karim Hossain', title: 'Python & Data Science Developer', bio: 'Machine learning engineer. Kaggle contributor. Built recommendation systems and NLP models for e-commerce clients.', skill_score: 82, location: 'Dhaka', hourly_rate_min: 30, hourly_rate_max: 60, skills_summary: [{ name: 'Python', level: 'expert', score: 89 }, { name: 'Machine Learning', level: 'advanced', score: 78 }, { name: 'Data Analysis', level: 'advanced', score: 80 }], portfolio_url: '#', linkedin_url: '#', github_url: '#', jobs_completed: 28, client_rating: 4.7, availability: 'busy', languages: ['English', 'Bangla'], total_assessments: 4 },
  { id: '4', full_name: 'Sadia Begum', title: 'Digital Marketing Specialist', bio: 'Google Ads certified. Managed $500K+ ad spend. Helped BD and international brands grow with measurable ROI.', skill_score: 78, location: 'Sylhet', hourly_rate_min: 15, hourly_rate_max: 30, skills_summary: [{ name: 'Digital Marketing', level: 'advanced', score: 82 }, { name: 'Content Writing', level: 'intermediate', score: 71 }], portfolio_url: '#', linkedin_url: '#', github_url: '', jobs_completed: 34, client_rating: 4.6, availability: 'available', languages: ['English', 'Bangla'], total_assessments: 2 },
]
