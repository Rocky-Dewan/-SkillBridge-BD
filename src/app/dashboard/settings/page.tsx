'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  full_name: string
  email: string
  role: string
  phone: string
  location: string
  bio: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [pwData, setPwData] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' })
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'danger'>('profile')

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => setProfile(d.profile))
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg({ text: '', type: '' })
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data.profile)
        setMsg({ text: '✓ Profile updated successfully', type: 'success' })
      } else {
        setMsg({ text: data.error || 'Failed to save', type: 'error' })
      }
    } catch { setMsg({ text: 'Network error', type: 'error' }) }
    finally { setSaving(false) }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwData.newPw !== pwData.confirm) { setPwMsg({ text: 'Passwords do not match', type: 'error' }); return }
    if (pwData.newPw.length < 8) { setPwMsg({ text: 'Password must be at least 8 characters', type: 'error' }); return }
    if (!/[A-Z]/.test(pwData.newPw)) { setPwMsg({ text: 'Must include uppercase letter', type: 'error' }); return }
    if (!/[0-9]/.test(pwData.newPw)) { setPwMsg({ text: 'Must include a number', type: 'error' }); return }
    if (!/[!@#$%^&*]/.test(pwData.newPw)) { setPwMsg({ text: 'Must include special character (!@#$%^&*)', type: 'error' }); return }

    setPwSaving(true); setPwMsg({ text: '', type: '' })
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwData.newPw, confirm_password: pwData.confirm }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg({ text: '✓ Password changed successfully', type: 'success' })
        setPwData({ current: '', newPw: '', confirm: '' })
      } else {
        setPwMsg({ text: data.error || 'Failed to change password', type: 'error' })
      }
    } catch { setPwMsg({ text: 'Network error', type: 'error' }) }
    finally { setPwSaving(false) }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') { setMsg({ text: 'Type DELETE to confirm', type: 'error' }); return }
    setDeleting(true)
    try {
      const res = await fetch('/api/user/profile', { method: 'DELETE' })
      if (res.ok) {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/?deleted=true')
      } else {
        setMsg({ text: 'Failed to delete account', type: 'error' })
      }
    } catch { setMsg({ text: 'Network error', type: 'error' }) }
    finally { setDeleting(false) }
  }

  if (loading) return <div className="page-container py-8"><div className="skeleton h-96 w-full rounded-xl" /></div>

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'password', label: '🔒 Password' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'danger', label: '⚠️ Danger Zone' },
  ] as const

  return (
    <div className="page-container py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account, security, and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-xs sm:text-sm py-2 px-2 rounded-lg font-medium transition-all ${activeTab === t.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <form onSubmit={saveProfile} className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input value={profile.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="input" placeholder="+880 1XXX-XXXXXX" />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={profile.location || ''} onChange={e => setProfile({ ...profile, location: e.target.value })} className="input" placeholder="e.g. Dhaka, Bangladesh" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} className="input resize-none" rows={3} maxLength={500} />
            <p className="text-xs text-gray-400 mt-1">{(profile.bio || '').length}/500</p>
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input value={profile.linkedin_url || ''} onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })} className="input" placeholder="https://linkedin.com/in/username" />
          </div>
          <div>
            <label className="label">GitHub URL</label>
            <input value={profile.github_url || ''} onChange={e => setProfile({ ...profile, github_url: e.target.value })} className="input" placeholder="https://github.com/username" />
          </div>
          <div>
            <label className="label">Portfolio / Website</label>
            <input value={profile.portfolio_url || ''} onChange={e => setProfile({ ...profile, portfolio_url: e.target.value })} className="input" placeholder="https://yoursite.com" />
          </div>
          {msg.text && <div className={`text-sm p-3 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={changePassword} className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
            Password must be: 8+ chars, uppercase, number, special character (!@#$%^&*)
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={pwData.newPw} onChange={e => setPwData({ ...pwData, newPw: e.target.value })} className="input" autoComplete="new-password" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={pwData.confirm} onChange={e => setPwData({ ...pwData, confirm: e.target.value })} className="input" autoComplete="new-password" />
            {pwData.confirm && pwData.newPw !== pwData.confirm && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
          </div>
          {pwMsg.text && <div className={`text-sm p-3 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{pwMsg.text}</div>}
          <button type="submit" disabled={pwSaving} className="btn-primary w-full">{pwSaving ? 'Updating...' : 'Change Password'}</button>
          <p className="text-xs text-center text-gray-500">
            Forgot your current password? <a href="/auth/forgot-password" className="text-brand-600 hover:underline">Reset via email</a>
          </p>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          {[
            { id: 'job_match', label: 'Job Match Alerts', desc: 'When new jobs match your skill score' },
            { id: 'app_status', label: 'Application Updates', desc: 'When employers update your application status' },
            { id: 'assessment_reminder', label: 'Assessment Reminders', desc: 'Reminders to take new skill assessments' },
            { id: 'weekly_digest', label: 'Weekly Digest', desc: 'Weekly summary of your activity' },
          ].map(n => (
            <div key={n.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">{n.label}</div>
                <div className="text-xs text-gray-500">{n.desc}</div>
              </div>
              <input type="checkbox" defaultChecked className="accent-brand-600 w-4 h-4 cursor-pointer" />
            </div>
          ))}
          <button className="btn-primary w-full">Save Preferences</button>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="card p-5 space-y-4 border-red-200 dark:border-red-800">
          <h2 className="font-semibold text-red-600 dark:text-red-400">⚠️ Danger Zone</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Delete Account</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              This will permanently delete your account, all assessments, applications, and data. <strong>This cannot be undone.</strong>
            </p>
            <div className="mb-3">
              <label className="label text-red-600 text-xs">Type <strong>DELETE</strong> to confirm</label>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} className="input border-red-300 focus:ring-red-500" placeholder="DELETE" />
            </div>
            {msg.text && <p className="text-red-600 text-sm mb-2">{msg.text}</p>}
            <button onClick={deleteAccount} disabled={deleting || deleteConfirm !== 'DELETE'} className="btn-danger w-full disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
