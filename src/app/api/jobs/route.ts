import { NextRequest, NextResponse } from 'next/server'
import { jobPostSchema } from '@/lib/validation/schemas'
import { supabaseAdmin, createServerSupabase } from '@/lib/db/supabase'
import { requireAuth, rateLimit, getClientIP, sanitizeObject } from '@/lib/security'

// GET /api/jobs - List jobs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const jobType = searchParams.get('type') || ''
    const minScore = parseInt(searchParams.get('min_score') || '0')
    const remote = searchParams.get('remote') === 'true'
    const from = (page - 1) * limit

    let query = supabaseAdmin
      .from('jobs')
      .select(`*, companies(id, name, logo_url, location, is_verified)`, { count: 'exact' })
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (search) query = query.textSearch('title', search, { type: 'websearch' })
    if (location) query = query.ilike('location', `%${location}%`)
    if (jobType) query = query.eq('job_type', jobType)
    if (minScore > 0) query = query.gte('min_skill_score', minScore)
    if (remote) query = query.eq('is_remote', true)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ jobs: data, total: count, page, limit, pages: Math.ceil((count || 0) / limit) })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

// POST /api/jobs - Create job
export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAuth(req)
  if (authError) return authError

  const ip = getClientIP(req)
  const limit = rateLimit(`job_post:${user!.id}`, 5, 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Job post limit reached (5/hour)' }, { status: 429 })

  try {
    const body = await req.json()
    const parse = jobPostSchema.safeParse(sanitizeObject(body))
    if (!parse.success) return NextResponse.json({ error: 'Validation failed', details: parse.error.flatten() }, { status: 400 })

    // Get user's company
    const { data: company } = await supabaseAdmin.from('companies').select('id, subscription_tier').eq('owner_id', user!.id).single()
    if (!company) return NextResponse.json({ error: 'You need a company profile to post jobs. Create one first.' }, { status: 403 })

    // Check job post limit based on tier
    const jobLimits: Record<string, number> = { free: 2, basic: 10, pro: 50, enterprise: 999 }
    const { count: activeJobs } = await supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'active')
    if ((activeJobs || 0) >= (jobLimits[company.subscription_tier] || 2)) {
      return NextResponse.json({ error: `Job post limit reached for ${company.subscription_tier} plan. Upgrade to post more.` }, { status: 403 })
    }

    const { data: job, error } = await supabaseAdmin.from('jobs').insert({ ...parse.data, company_id: company.id }).select().single()
    if (error) throw error

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
