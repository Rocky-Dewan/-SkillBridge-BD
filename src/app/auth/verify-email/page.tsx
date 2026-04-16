'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [message, setMessage] = useState('')

  async function resendVerification() {
    if (!email) return
    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) { setResent(true); setMessage('Verification email resent! Check your inbox.') }
      else { setMessage(data.error || 'Failed to resend') }
    } catch { setMessage('Network error') }
    finally { setResending(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">SB</div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">SkillBridge BD</span>
        </Link>

        <div className="card p-8 shadow-lg">
          <div className="text-6xl mb-5">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Verify your email</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We&apos;ve sent a verification link to:
          </p>
          {email && (
            <p className="font-semibold text-brand-600 mb-4 text-lg">{email}</p>
          )}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Click the link in the email to activate your account. Check your <strong>spam folder</strong> if you don&apos;t see it.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6 text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ You must verify your email before you can log in.
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg mb-4 ${resent ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={resendVerification} disabled={resending || resent} className="btn-secondary w-full disabled:opacity-50">
              {resending ? 'Sending...' : resent ? '✓ Email sent' : 'Resend verification email'}
            </button>
            <Link href="/auth/login" className="btn-primary w-full justify-center">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}><VerifyContent /></Suspense>
}
