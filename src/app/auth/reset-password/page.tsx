'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!/[A-Z]/.test(password)) { setError('Password needs at least one uppercase letter'); return }
    if (!/[0-9]/.test(password)) { setError('Password needs at least one number'); return }
    if (!/[!@#$%^&*]/.test(password)) { setError('Password needs at least one special character (!@#$%^&*)'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm_password: confirm }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login'), 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*]/.test(password),
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">SB</div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">SkillBridge BD</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
        </div>

        <div className="card p-6 shadow-lg">
          {success ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Password updated!</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="Min 8 chars" autoComplete="new-password" />
                {/* Strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded ${i <= strength ? strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-yellow-400' : strength <= 3 ? 'bg-blue-400' : 'bg-green-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong'} password
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" placeholder="Repeat password" autoComplete="new-password" />
                {confirm && password !== confirm && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
              </div>
              <ul className="text-xs text-gray-500 space-y-0.5">
                {[['8+ characters', password.length >= 8], ['Uppercase letter', /[A-Z]/.test(password)], ['Number', /[0-9]/.test(password)], ['Special char (!@#$...)', /[!@#$%^&*]/.test(password)]].map(([label, met]) => (
                  <li key={String(label)} className={met ? 'text-green-600' : ''}>{met ? '✓' : '○'} {label}</li>
                ))}
              </ul>
              {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
              <button type="submit" disabled={loading || strength < 4 || password !== confirm} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
