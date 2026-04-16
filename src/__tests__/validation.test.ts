import { registerSchema, loginSchema, jobPostSchema } from '@/lib/validation/schemas'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse({
      email: 'test@example.com', password: 'Strong@Pass1', full_name: 'Test User', role: 'jobseeker',
    }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(registerSchema.safeParse({ email: 'notanemail', password: 'Strong@Pass1', full_name: 'User', role: 'jobseeker' }).success).toBe(false)
  })
  it('rejects weak password', () => {
    expect(registerSchema.safeParse({ email: 'x@x.com', password: 'weak', full_name: 'User', role: 'jobseeker' }).success).toBe(false)
  })
  it('rejects invalid role', () => {
    expect(registerSchema.safeParse({ email: 'x@x.com', password: 'Strong@Pass1', full_name: 'User', role: 'hacker' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: 'anypassword' }).success).toBe(true)
  })
  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false)
  })
})

describe('jobPostSchema', () => {
  it('accepts valid job post', () => {
    expect(jobPostSchema.safeParse({
      title: 'Senior React Developer',
      description: 'A'.repeat(60),
      is_remote: true,
      job_type: 'full-time',
    }).success).toBe(true)
  })
  it('rejects short title', () => {
    expect(jobPostSchema.safeParse({ title: 'Job', description: 'A'.repeat(60) }).success).toBe(false)
  })
  it('rejects short description', () => {
    expect(jobPostSchema.safeParse({ title: 'Valid Job Title', description: 'Short' }).success).toBe(false)
  })
})
