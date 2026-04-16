'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas'

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') as 'jobseeker' | 'employer' | 'freelancer') || 'jobseeker'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  })
  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Registration failed'); return }
      // Redirect to verify-email page with their email
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const roles = [
    { value: 'jobseeker', label: '🎓 Job Seeker', desc: 'Find jobs with verified skills' },
    { value: 'freelancer', label: '💻 Freelancer', desc: 'Get international clients' },
    { value: 'employer', label: '🏢 Employer', desc: 'Find verified talent' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">SB</div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">SkillBridge BD</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Free forever. Email verification required.</p>
        </div>
        <div className="card p-6 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <label key={r.value} className={`cursor-pointer rounded-lg border-2 p-2.5 text-center transition-all ${selectedRole === r.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'}`}>
                    <input type="radio" value={r.value} {...register('role')} className="sr-only" />
                    <div className="text-lg">{r.label.split(' ')[0]}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">{r.label.slice(2)}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{r.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Full Name</label>
              <input {...register('full_name')} className="input" placeholder="Your full name" autoComplete="name" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label">Email Address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              <p className="text-xs text-gray-500 mt-1">⚠️ You must verify this email before logging in.</p>
            </div>
            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="Min 8 chars, uppercase + number + special" autoComplete="new-password" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span> : 'Create Free Account →'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Already have an account? <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
