'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { jobPostSchema, type JobPostInput } from '@/lib/validation/schemas'

const SKILLS = ['JavaScript','React','Python','SQL','Digital Marketing','Graphic Design','English Communication','Data Analysis','Node.js','Project Management','UI/UX Design','WordPress','Machine Learning','Content Writing','Video Editing','PHP','Laravel','Flutter','Android','iOS']

export default function PostJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<JobPostInput>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: { is_remote: false, job_type: 'full-time', min_skill_score: 0, required_skills: [] },
  })

  function toggleSkill(skill: string) {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill].slice(0, 10)
    setSelectedSkills(updated)
    setValue('required_skills', updated)
  }

  const onSubmit = async (data: JobPostInput) => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, required_skills: selectedSkills }),
      })
      const result = await res.json()
      if (!res.ok) {
        if (res.status === 403 && result.error?.includes('company profile')) {
          setError('You need to create a company profile first. Go to Settings → Company.')
        } else {
          setError(result.error || 'Failed to post job')
        }
        return
      }
      router.push('/dashboard?posted=true')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="page-container py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post a Job</h1>
        <p className="text-gray-500 text-sm mt-1">Find verified, skill-tested candidates from across Bangladesh</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Basic Information</h2>
          <div>
            <label className="label">Job Title *</label>
            <input {...register('title')} className="input" placeholder="e.g. Senior React Developer" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Job Type</label>
              <select {...register('job_type')} className="input">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input {...register('location')} className="input" placeholder="e.g. Dhaka, Gulshan" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('is_remote')} className="accent-brand-600 w-4 h-4" />
            Remote / Work from home allowed
          </label>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Salary (Optional)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Minimum Salary (BDT/month)</label>
              <input {...register('salary_min', { valueAsNumber: true })} type="number" className="input" placeholder="e.g. 40000" min={0} />
            </div>
            <div>
              <label className="label">Maximum Salary (BDT/month)</label>
              <input {...register('salary_max', { valueAsNumber: true })} type="number" className="input" placeholder="e.g. 80000" min={0} />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Job Description *</h2>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input resize-none" rows={5} placeholder="Describe the role, responsibilities, company culture..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="label">Requirements (optional)</label>
            <textarea {...register('requirements')} className="input resize-none" rows={3} placeholder="Education, experience, qualifications..." />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Skill Requirements</h2>
          <div>
            <label className="label">Required Skills (select up to 10)</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SKILLS.map(s => (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedSkills.includes(s)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                  }`}>
                  {selectedSkills.includes(s) ? '✓ ' : ''}{s}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{selectedSkills.length}/10 selected</p>
          </div>
          <div>
            <label className="label">Minimum Skill Score Required: <span className="font-bold text-brand-600">{0}</span></label>
            <input {...register('min_skill_score', { valueAsNumber: true })} type="range" min={0} max={100} step={10} className="w-full accent-brand-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0 (Any)</span><span>50 (Intermediate+)</span><span>100 (Expert)</span></div>
          </div>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-4 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Posting...' : 'Post Job →'}
          </button>
        </div>
      </form>
    </div>
  )
}
