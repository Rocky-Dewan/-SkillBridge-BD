'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validation/schemas'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [assessments, setAssessments] = useState<Array<Record<string, unknown>>>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  })

  useEffect(() => {
    async function load() {
      try {
        const [profRes, assRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/assessment/skills'),
        ])
        if (profRes.ok) {
          const data = await profRes.json()
          setProfile(data.profile)
          reset({
            full_name: data.profile?.full_name || '',
            bio: data.profile?.bio || '',
            phone: data.profile?.phone || '',
            location: data.profile?.location || '',
            linkedin_url: data.profile?.linkedin_url || '',
            github_url: data.profile?.github_url || '',
            portfolio_url: data.profile?.portfolio_url || '',
          })
        }
        if (assRes.ok) {
          const data = await assRes.json()
          setAssessments(data.completed || [])
        }
      } finally { setLoading(false) }
    }
    load()
  }, [reset])

  const onSubmit = async (data: ProfileUpdateInput) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setMessage(res.ok ? 'Profile updated successfully!' : 'Failed to update profile')
    } catch { setMessage('Network error') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="page-container py-8 space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded-lg" />)}
    </div>
  )

  const completeness = [
    profile?.full_name, profile?.bio, profile?.phone,
    profile?.location, profile?.linkedin_url,
  ].filter(Boolean).length * 20

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Complete your profile to improve your job matches</p>
        </div>

        {/* Completeness bar */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile completeness</span>
            <span className="text-sm font-bold text-brand-600">{completeness}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${completeness}%` }} />
          </div>
          {completeness < 100 && (
            <p className="text-xs text-gray-500 mt-2">Add more details to improve your visibility to employers</p>
          )}
        </div>

        {/* Verified skills */}
        {assessments.length > 0 && (
          <div className="card p-5 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Verified Skills</h2>
            <div className="flex flex-wrap gap-2">
              {assessments.map((a: Record<string, unknown>) => (
                <div key={String(a.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  (a.percentage as number) >= 80 ? 'bg-green-50 border-green-200 text-green-700' :
                  (a.percentage as number) >= 60 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <span>✓</span>
                  <span>{String(a.skill_name)}</span>
                  <span className="font-bold">{Math.round(Number(a.percentage))}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Full Name</label>
              <input {...register('full_name')} className="input" placeholder="Your full name" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+880 1XXX-XXXXXX" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Location</label>
            <input {...register('location')} className="input" placeholder="e.g. Dhaka, Bangladesh" />
          </div>

          <div>
            <label className="label">Bio <span className="text-gray-400 font-normal text-xs">(max 500 chars)</span></label>
            <textarea {...register('bio')} className="input resize-none" rows={3} placeholder="Tell employers and clients about yourself..." />
            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Online Presence</h3>
            <div className="space-y-3">
              {[
                { field: 'linkedin_url' as const, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
                { field: 'github_url' as const, label: 'GitHub URL', placeholder: 'https://github.com/username' },
                { field: 'portfolio_url' as const, label: 'Portfolio / Website', placeholder: 'https://yoursite.com' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="label text-xs">{label}</label>
                  <input {...register(field)} className="input" placeholder={placeholder} />
                  {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message}</p>}
                </div>
              ))}
            </div>
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
