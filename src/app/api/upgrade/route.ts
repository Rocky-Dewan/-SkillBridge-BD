import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/db/supabase'
import { requireAuth, rateLimit, getClientIP, sanitizeObject } from '@/lib/security'

const schema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  payment_method: z.enum(['bkash', 'nagad', 'card']).default('bkash'),
})

const PLAN_PRICES: Record<string, number> = { pro: 499, enterprise: 5000 }

export async function POST(req: NextRequest) {
  const { user, response: authErr } = await requireAuth(req)
  if (authErr) return authErr

  const ip = getClientIP(req)
  const limit = rateLimit(`upgrade:${user!.id}`, 5, 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })

  try {
    const body = sanitizeObject(await req.json())
    const parse = schema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const { plan, payment_method } = parse.data
    const amount = PLAN_PRICES[plan]

    // Create a pending payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user!.id,
        amount,
        currency: 'BDT',
        method: payment_method,
        status: 'pending',
        description: `${plan} plan upgrade`,
        metadata: { plan },
      })
      .select()
      .single()

    // bKash sandbox initiation
    if (payment_method === 'bkash') {
      const bkashKey = process.env.BKASH_APP_KEY
      const bkashSecret = process.env.BKASH_APP_SECRET
      const bkashBase = process.env.NEXT_PUBLIC_BKASH_BASE_URL

      if (!bkashKey || bkashKey === 'placeholder') {
        // bKash not configured — return instructions
        return NextResponse.json({
          success: true,
          manual: true,
          message: `To upgrade to ${plan} plan, send ৳${amount} to bKash merchant number and contact support.`,
          payment_id: payment?.id,
          amount,
          instructions: [
            `1. Open bKash app`,
            `2. Send ৳${amount} to merchant number`,
            `3. Email payment_id: ${payment?.id} to support@skillbridge.com.bd`,
            `4. Your account will be upgraded within 24 hours`,
          ],
        })
      }

      // Real bKash integration
      try {
        // Grant token
        const tokenRes = await fetch(`${bkashBase}/tokenized/checkout/token/grant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            username: process.env.BKASH_USERNAME!,
            password: process.env.BKASH_PASSWORD!,
          },
          body: JSON.stringify({ app_key: bkashKey, app_secret: bkashSecret }),
        })
        const tokenData = await tokenRes.json()
        const idToken = tokenData.id_token

        // Create payment
        const createRes = await fetch(`${bkashBase}/tokenized/checkout/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: idToken,
            'X-App-Key': bkashKey,
          },
          body: JSON.stringify({
            mode: '0011',
            payerReference: user!.id,
            callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/upgrade/callback`,
            amount: String(amount),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: payment?.id || 'INV-' + Date.now(),
          }),
        })
        const createData = await createRes.json()
        if (createData.bkashURL) {
          await supabaseAdmin.from('payments').update({ gateway_transaction_id: createData.paymentID, gateway_response: createData }).eq('id', payment?.id)
          return NextResponse.json({ success: true, bkash_url: createData.bkashURL })
        }
      } catch (bkashErr) {
        console.error('bKash error:', bkashErr)
      }

      return NextResponse.json({
        success: true,
        manual: true,
        message: `bKash payment initiated. Payment ID: ${payment?.id}. Contact support to complete upgrade.`,
        payment_id: payment?.id,
        amount,
      })
    }

    return NextResponse.json({ success: true, payment_id: payment?.id, amount, message: 'Payment record created. Complete payment to upgrade.' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
