import Link from 'next/link'
import { createServerSupabase } from '@/lib/db/supabase'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, assessmentsRes, applicationsRes, jobsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('assessments').select('*').eq('user_id', user.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(5),
    supabase.from('applications').select('*, jobs(title, companies(name))').eq('applicant_id', user.id).order('applied_at', { ascending: false }).limit(5),
    supabase.from('jobs').select('id, title, companies(name, logo_url), location, job_type, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(6),
  ])

  const profile = profileRes.data
  const assessments = assessmentsRes.data || []
  const applications = applicationsRes.data || []
  const jobs = jobsRes.data || []

  const stats = [
    { label: 'Skill Score', value: profile?.skill_score || 0, suffix: '/100', color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: 'Assessments Done', value: profile?.total_assessments || 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Applications', value: applications.length, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Profile Complete', value: profile?.profile_completeness || 0, suffix: '%', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your skill journey at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>
              {s.value}{s.suffix || ''}
            </div>
          </div>
        ))}
      </div>

      {/* Profile completeness warning */}
      {(profile?.profile_completeness || 0) < 60 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-500 text-lg mt-0.5">⚠️</span>
          <div>
            <div className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">Complete your profile</div>
            <div className="text-yellow-700 dark:text-yellow-300 text-xs mt-0.5">A complete profile gets 3x more employer views. Add your bio, location, and LinkedIn.</div>
            <Link href="/dashboard/profile" className="text-xs font-medium text-yellow-700 dark:text-yellow-300 underline mt-1 inline-block">Complete profile →</Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Assessments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Your Skill Badges</h2>
            <Link href="/dashboard/assessments" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">No assessments yet</div>
              <div className="text-xs text-gray-500 mt-1 mb-3">Take your first assessment to start building verified skills</div>
              <Link href="/assessment" className="btn-primary text-xs py-2 px-4">Take Assessment</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{a.skill_name}</div>
                    <div className="text-xs text-gray-500">{a.badge_earned}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${a.percentage >= 75 ? 'text-green-600' : a.percentage >= 55 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {a.percentage}%
                    </div>
                    <div className={`badge-${a.level} text-xs`}>{a.level}</div>
                  </div>
                </div>
              ))}
              <Link href="/assessment" className="btn-secondary w-full text-xs py-2 justify-center">+ Take New Assessment</Link>
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
            <Link href="/dashboard/applications" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💼</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">No applications yet</div>
              <div className="text-xs text-gray-500 mt-1 mb-3">Find jobs matched to your skill score</div>
              <Link href="/jobs" className="btn-primary text-xs py-2 px-4">Browse Jobs</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{app.jobs?.title}</div>
                    <div className="text-xs text-gray-500">{app.jobs?.companies?.name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    app.status === 'hired' ? 'bg-green-100 text-green-700' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recommended Jobs</h2>
          <Link href="/jobs" className="text-xs text-brand-600 hover:underline">Browse all jobs →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-300 hover:shadow-sm transition-all group">
              <div className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors mb-1">{job.title}</div>
              <div className="text-xs text-gray-500 mb-2">{job.companies?.name}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{job.job_type}</span>
                {job.location && <span className="text-xs text-gray-500">📍 {job.location}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
