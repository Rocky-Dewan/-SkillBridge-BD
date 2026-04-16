import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db/supabase'

// ─── Rate Limiting (in-memory for dev, use Redis in prod) ───
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  identifier: string,
  limit = 100,
  windowMs = 15 * 60 * 1000
): { success: boolean; remaining: number; resetAt: Date } {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt: new Date(resetAt) }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: new Date(entry.resetAt) }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: new Date(entry.resetAt) }
}

// Aggressive rate limit for auth endpoints
export function authRateLimit(ip: string) {
  return rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000)
}

// AI endpoint rate limit
export function aiRateLimit(userId: string) {
  return rateLimit(`ai:${userId}`, 20, 60 * 60 * 1000)
}

// ─── Input Sanitization ───
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'))
    .trim()
    .slice(0, 10000) // max length
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result as T
}

// ─── JWT / Auth helpers ───
export async function getAuthUser(req: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user, response: null }
}

// ─── Security Headers helper ───
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}

// ─── IP extraction ───
export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

// ─── CSRF token generation ───
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Audit logging ───
export async function auditLog(params: {
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}) {
  const { supabaseAdmin } = await import('@/lib/db/supabase')
  await supabaseAdmin.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    metadata: params.metadata || {},
  })
}

// ─── Password validation ───
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('At least 8 characters required')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required')
  if (!/[0-9]/.test(password)) errors.push('At least one number required')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character required')
  return { valid: errors.length === 0, errors }
}
