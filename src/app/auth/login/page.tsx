'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true); setError(''); setUnverified(false)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        if (result.requiresVerification) {
          setUnverified(true)
          setUnverifiedEmail(data.email)
        } else {
          setError(result.error || 'Login failed')
        }
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">SB</div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">SkillBridge BD</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Log in to your SkillBridge account</p>
        </div>

        <div className="card p-6 shadow-lg">
          {unverified ? (
            <div className="text-center py-2">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email not verified</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please check your inbox for a verification link for <strong>{unverifiedEmail}</strong>.
              </p>
              <Link href={`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="btn-primary w-full justify-center mb-2">
                Go to verification page
              </Link>
              <button onClick={() => setUnverified(false)} className="btn-secondary w-full text-sm">Try different account</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input {...register('email')} type="email" className="input" placeholder="you@example.com" autoComplete="email" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
                </div>
                <input {...register('password')} type="password" className="input" placeholder="••••••••" autoComplete="current-password" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Logging in...</span> : 'Log in →'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          New to SkillBridge?{' '}
          <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">Create free account</Link>
        </p>
      </div>
    </div>
  )
}
