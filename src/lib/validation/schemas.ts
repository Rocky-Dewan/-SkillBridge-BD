import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  full_name: z.string().min(2, 'At least 2 characters').max(100).regex(/^[a-zA-Z\s\u0980-\u09FF]+$/, 'Name must contain only letters'),
  role: z.enum(['jobseeker', 'employer', 'freelancer']).default('jobseeker'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).optional().nullable(),
  location: z.string().max(100).optional(),
  linkedin_url: z.string().url().optional().nullable(),
  github_url: z.string().url().optional().nullable(),
  portfolio_url: z.string().url().optional().nullable(),
})

export const jobPostSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(10000),
  requirements: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  is_remote: z.boolean().default(false),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).default('full-time'),
  salary_min: z.number().int().positive().optional(),
  salary_max: z.number().int().positive().optional(),
  required_skills: z.array(z.string()).max(10).default([]),
  min_skill_score: z.number().int().min(0).max(100).default(0),
})

export const applicationSchema = z.object({
  job_id: z.string().uuid(),
  cover_letter: z.string().max(2000).optional(),
})

export const assessmentStartSchema = z.object({
  skill_id: z.string().uuid(),
})

export const assessmentSubmitSchema = z.object({
  assessment_id: z.string().uuid(),
  answers: z.array(z.object({
    question_index: z.number().int().min(0),
    selected_option: z.number().int().min(0).max(3),
    time_taken_seconds: z.number().int().positive().optional(),
  })),
})

export const aiChatSchema = z.object({
  message: z.string().min(1).max(1000),
  session_id: z.string().uuid().optional(),
})

export const companySchema = z.object({
  name: z.string().min(2).max(200),
  industry: z.string().max(100).optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().nullable(),
  location: z.string().max(200).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type JobPostInput = z.infer<typeof jobPostSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export type AssessmentStartInput = z.infer<typeof assessmentStartSchema>
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>
export type AIChatInput = z.infer<typeof aiChatSchema>
export type CompanyInput = z.infer<typeof companySchema>
