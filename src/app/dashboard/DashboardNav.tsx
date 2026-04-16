'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Overview',           icon: '📊', exact: true },
  { href: '/dashboard/assessments', label: 'Assessments',      icon: '🎯' },
  { href: '/dashboard/jobs',        label: 'Browse Jobs',       icon: '💼' },
  { href: '/dashboard/applications',label: 'My Applications',   icon: '📋' },
  { href: '/dashboard/freelancer',  label: 'Freelancer Profile',icon: '🌐' },
  { href: '/ai-assistant',          label: 'AI Career Advisor', icon: '🤖' },
  { href: '/dashboard/profile',     label: 'My Profile',        icon: '👤' },
  { href: '/dashboard/settings',    label: 'Settings',          icon: '⚙️' },
]

interface Props {
  profile: { full_name?: string; role?: string; skill_score?: number; avatar_url?: string } | null
}

export default function DashboardNav({ profile }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-ink-ivory border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo — click goes to home */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-ink-charcoal flex items-center justify-center text-white text-xs font-bold group-hover:bg-ink-slate transition-colors">SB</div>
          <span className="font-bold text-sm text-gray-900 group-hover:text-ink-charcoal transition-colors">SkillBridge BD</span>
        </Link>
      </div>

      {/* Profile mini card */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-ink-charcoal dark:text-brand-400 font-semibold text-sm flex-shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">{profile?.full_name}</div>
            <div className="text-xs text-ink-slate capitalize">{profile?.role} · Score: {profile?.skill_score || 0}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-ink-charcoal dark:text-brand-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-4 border-t border-gray-100">
        <Link href="/dashboard/upgrade" className="block bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3 text-center hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
          <div className="text-xs font-semibold text-ink-charcoal dark:text-brand-300 mb-1">🚀 Go Premium</div>
          <div className="text-xs text-ink-charcoal dark:text-brand-400 mb-2">Unlimited AI chats, priority matching</div>
          <div className="block w-full bg-ink-charcoal text-white text-xs font-medium py-1.5 rounded-md hover:bg-ink-slate transition-colors">
            Upgrade Free →
          </div>
        </Link>
      </div>
    </aside>
  )
}
