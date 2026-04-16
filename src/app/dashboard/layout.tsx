'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '📊', exact: true },
  { href: '/dashboard/assessments', label: 'My Badges', icon: '🎯' },
  { href: '/jobs', label: 'Browse Jobs', icon: '💼' },
  { href: '/dashboard/jobs/post', label: 'Post a Job', icon: '📝', employerOnly: true },
  { href: '/dashboard/applications', label: 'Applications', icon: '📋' },
  { href: '/freelancer', label: 'Freelancers', icon: '🌐' },
  { href: '/ai-assistant', label: 'AI Advisor', icon: '🤖' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/dashboard/profile', label: 'My Profile', icon: '👤' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 transition-transform duration-200 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">SB</div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">SkillBridge BD</div>
              <div className="text-xs text-gray-500">Career Platform</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href, item.exact)
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="text-base w-5">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive(item.href, item.exact) && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </Link>
          ))}

          {/* Upgrade button */}
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-800">
            <Link
              href="/dashboard/upgrade"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/dashboard/upgrade')
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              }`}
            >
              <span className="text-base w-5">⚡</span>
              <span>Upgrade to Pro</span>
            </Link>
          </div>

          {/* Admin link */}
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <span className="text-base w-5">🔑</span>
            Admin Panel
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <span className="text-base w-5">🚪</span> Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white text-xs font-bold">SB</div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">SkillBridge BD</span>
          </Link>
          <Link href="/dashboard/notifications" className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600">🔔</Link>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
