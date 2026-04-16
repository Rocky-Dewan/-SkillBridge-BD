'use client'
import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  data: Record<string, string>
}

const typeIcon: Record<string, string> = {
  job_match: '💼',
  application_update: '📋',
  assessment_complete: '🎯',
  profile_view: '👁️',
  system: '🔔',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => { fetchNotifications() }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } finally { setLoading(false) }
  }

  async function markAsRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    setMarkingAll(true)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="page-container py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {unread > 0 && <p className="text-sm text-brand-600 mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} disabled={markingAll} className="btn-secondary text-sm py-1.5">
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-gray-600 dark:text-gray-400">No notifications yet. They&apos;ll appear here when you have activity.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`card p-4 cursor-pointer transition-all hover:shadow-sm ${!n.is_read ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{n.title}</span>
                    {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                  </div>
                  {n.message && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
