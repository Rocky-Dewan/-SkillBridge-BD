'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'

interface Job {
  id: string; title: string; location: string; is_remote: boolean; job_type: string
  salary_min: number; salary_max: number; salary_currency: string
  required_skills: string[]; min_skill_score: number; created_at: string
  companies: { name: string; logo_url: string; location: string; is_verified: boolean }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [remote, setRemote] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (location) params.set('location', location)
    if (jobType) params.set('type', jobType)
    if (remote) params.set('remote', 'true')
    setLoading(true)
    fetch(`/api/jobs?${params}`).then(r => r.json()).then(d => { setJobs(d.jobs || []); setTotal(d.total || 0) }).finally(() => setLoading(false))
  }, [debouncedSearch, location, jobType, remote, page])

  const fmt = (min: number, max: number, currency: string) => {
    if (!min && !max) return null
    const k = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
    return `${currency} ${k(min)}${max ? `–${k(max)}` : '+'}`
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    return days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-8">
        <div className="page-container">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Jobs in Bangladesh</h1>
          <p className="text-gray-500 text-sm mb-6">Matched to your verified skill score</p>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, skills, companies..." className="input flex-1" />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. Dhaka)" className="input sm:w-48" />
            <select value={jobType} onChange={e => setJobType(e.target.value)} className="input sm:w-40">
              <option value="">All types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer">
              <input type="checkbox" checked={remote} onChange={e => setRemote(e.target.checked)} className="rounded border-gray-300 text-brand-600" />
              Remote only
            </label>
          </div>
        </div>
      </div>

      <div className="page-container py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{loading ? 'Loading...' : `${total} jobs found`}</p>
          <Link href="/dashboard/jobs/post" className="btn-primary text-sm py-2">+ Post a Job</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="card p-5 skeleton h-24" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-medium text-gray-700 dark:text-gray-300">No jobs found</div>
            <div className="text-sm text-gray-500 mt-1">Try different search terms or filters</div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="card p-5 flex gap-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group block">
                {/* Company logo */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg flex-shrink-0 font-bold text-gray-500">
                  {job.companies?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-500">{job.companies?.name}</span>
                        {job.companies?.is_verified && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">✓ Verified</span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{timeAgo(job.created_at)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.location && <span className="text-xs text-gray-500">📍 {job.location}</span>}
                    {job.is_remote && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🌐 Remote</span>}
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{job.job_type}</span>
                    {fmt(job.salary_min, job.salary_max, job.salary_currency) && (
                      <span className="text-xs font-medium text-green-600">💰 {fmt(job.salary_min, job.salary_max, job.salary_currency)}</span>
                    )}
                    {job.min_skill_score > 0 && (
                      <span className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-600 px-2 py-0.5 rounded-full">Min score: {job.min_skill_score}</span>
                    )}
                  </div>
                  {job.required_skills?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {job.required_skills.slice(0, 4).map((s: string) => (
                        <span key={s} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{s}</span>
                      ))}
                      {job.required_skills.length > 4 && <span className="text-xs text-gray-400">+{job.required_skills.length - 4} more</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-2 disabled:opacity-30">← Prev</button>
            <span className="text-sm text-gray-500 flex items-center px-3">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-secondary text-sm py-2 disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
