'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Application {
  id: string
  status: string
  applied_at: string
  cover_letter: string
  skill_match_score: number
  jobs: {
    title: string
    job_type: string
    location: string
    is_remote: boolean
    companies: { name: string; logo_url: string }
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  applied:     { label: 'Applied',     color: 'bg-blue-100 text-blue-700',   icon: '📤' },
  screening:   { label: 'Screening',   color: 'bg-yellow-100 text-yellow-700', icon: '🔍' },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-700', icon: '⭐' },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700',     icon: '❌' },
  hired:       { label: 'Hired!',      color: 'bg-green-100 text-green-700', icon: '🎉' },
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/jobs/apply')
        if (res.ok) {
          const data = await res.json()
          setApplications(data.applications || [])
        }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)

  const counts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    screening: applications.filter(a => a.status === 'screening').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  }

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Track the status of all your job applications</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === key
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300'
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {filter === 'all' ? 'Start applying to jobs to track them here' : 'Check back later for updates'}
          </p>
          {filter === 'all' && (
            <Link href="/jobs" className="btn-primary text-sm">Browse Jobs →</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const status = statusConfig[app.status] || statusConfig.applied
            return (
              <div key={app.id} className="card p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {app.jobs?.title || 'Job Title'}
                      </h3>
                      {app.skill_match_score != null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          app.skill_match_score >= 80 ? 'bg-green-100 text-green-700' :
                          app.skill_match_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {app.skill_match_score}% match
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {app.jobs?.companies?.name || 'Company'} • {app.jobs?.location || (app.jobs?.is_remote ? 'Remote' : 'Bangladesh')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Applied {new Date(app.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                  </div>
                </div>

                {app.status === 'hired' && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      🎉 Congratulations! You got the job. Check your email for next steps.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
