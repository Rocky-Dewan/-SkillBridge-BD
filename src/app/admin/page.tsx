import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/db/supabase'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

type RecentUser = { id: string; full_name: string; email: string; role: string; created_at: string }
type RecentAssessment = { id: string; skill_name: string; percentage: number; status: string; profiles: unknown }

async function getAdminStats() {
  try {
    const supabase = createServerSupabase()
    const [users, jobs, assessments, applications] = await Promise.all([
      supabase.from('profiles').select('id, role, created_at, subscription_tier', { count: 'exact' }),
      supabase.from('jobs').select('id, status', { count: 'exact' }),
      supabase.from('assessments').select('id, status, percentage', { count: 'exact' }),
      supabase.from('applications').select('id, status', { count: 'exact' }),
    ])
    const recentUsers = await supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(10)
    const recentAssessments = await supabase.from('assessments').select('id, skill_name, percentage, status, profiles(full_name)').order('created_at', { ascending: false }).limit(10)

    const completedWithScore = (assessments.data || []).filter(a => a.percentage != null)
    const avgScore = completedWithScore.length
      ? completedWithScore.reduce((s, a) => s + (a.percentage ?? 0), 0) / completedWithScore.length
      : 0

    return {
      totalUsers: users.count || 0,
      totalJobs: jobs.count || 0,
      totalAssessments: assessments.count || 0,
      totalApplications: applications.count || 0,
      completedAssessments: (assessments.data || []).filter(a => a.status === 'completed').length,
      avgScore,
      recentUsers: (recentUsers.data || []) as RecentUser[],
      recentAssessments: (recentAssessments.data || []) as RecentAssessment[],
      roleBreakdown: {
        jobseeker: (users.data || []).filter(u => u.role === 'jobseeker').length,
        freelancer: (users.data || []).filter(u => u.role === 'freelancer').length,
        employer: (users.data || []).filter(u => u.role === 'employer').length,
      }
    }
  } catch {
    return { totalUsers: 0, totalJobs: 0, totalAssessments: 0, totalApplications: 0, completedAssessments: 0, avgScore: 0, recentUsers: [] as RecentUser[], recentAssessments: [] as RecentAssessment[], roleBreakdown: { jobseeker: 0, freelancer: 0, employer: 0 } }
  }
}

export default async function AdminPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const stats = await getAdminStats()

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' },
    { label: 'Active Jobs', value: stats.totalJobs.toLocaleString(), icon: '💼', color: 'bg-green-50 dark:bg-green-900/20 text-green-700' },
    { label: 'Assessments', value: stats.totalAssessments.toLocaleString(), icon: '🎯', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700' },
    { label: 'Applications', value: stats.totalApplications.toLocaleString(), icon: '📋', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700' },
    { label: 'Avg Score', value: `${Math.round(stats.avgScore)}%`, icon: '📊', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700' },
    { label: 'Completion Rate', value: `${stats.totalAssessments > 0 ? Math.round(stats.completedAssessments / stats.totalAssessments * 100) : 0}%`, icon: '✅', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white text-xs font-bold">SB</div>
          </Link>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Admin Dashboard</span>
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <Link href="/dashboard" className="btn-secondary text-sm py-1.5">← Back to App</Link>
      </nav>

      <div className="page-container py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Overview</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className={`card p-4 text-center ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs opacity-75 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {Object.entries(stats.roleBreakdown).map(([role, count]) => (
            <div key={role} className="card p-4 flex items-center gap-4">
              <div className="text-2xl">{role === 'jobseeker' ? '🎓' : role === 'freelancer' ? '💻' : '🏢'}</div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                <div className="text-sm text-gray-500 capitalize">{role}s</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Signups</h2>
            <div className="space-y-2.5">
              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No users yet</p>
              ) : stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                    {u.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded capitalize">{u.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Assessments</h2>
            <div className="space-y-2.5">
              {stats.recentAssessments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No assessments yet</p>
              ) : stats.recentAssessments.map((a) => {
                const prof = a.profiles as { full_name?: string } | null
                return (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{a.skill_name}</div>
                      <div className="text-xs text-gray-500">{prof?.full_name || 'Unknown'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.percentage != null && (
                        <span className={`text-sm font-semibold ${a.percentage >= 80 ? 'text-green-600' : a.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {Math.round(a.percentage)}%
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Admin Actions</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Manage Skills', href: '/admin/skills', icon: '🎯' },
              { label: 'View All Users', href: '/admin/users', icon: '👥' },
              { label: 'Manage Jobs', href: '/admin/jobs', icon: '💼' },
              { label: 'Audit Logs', href: '/admin/audit', icon: '🔍' },
              { label: 'Payments', href: '/admin/payments', icon: '💳' },
              { label: 'Send Announcement', href: '/admin/announce', icon: '📢' },
            ].map(a => (
              <Link key={a.label} href={a.href} className="btn-secondary text-sm gap-1.5">
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
