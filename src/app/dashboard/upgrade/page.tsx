'use client'
import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '৳0',
    period: 'forever',
    color: 'border-gray-200',
    features: [
      '5 skill assessments/month',
      'Basic job matching',
      '20 AI chat messages/hour',
      'Standard profile',
      'Apply to 20 jobs/day',
    ],
    missing: ['Export freelancer profile', 'Priority job matching', 'Unlimited assessments', 'Company dashboard'],
    cta: 'Current Plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '৳499',
    period: 'per month',
    color: 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800',
    badge: '⭐ Most Popular',
    features: [
      'Unlimited skill assessments',
      'AI export freelancer profile',
      'Priority job matching',
      '100 AI chat messages/hour',
      'Featured in freelancer search',
      'Verified Pro badge',
      'Apply to unlimited jobs',
      'Email notifications',
    ],
    missing: [],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
    bkash: true,
  },
  {
    id: 'enterprise',
    name: 'Employer',
    price: '৳5,000',
    period: 'per month',
    color: 'border-purple-200 dark:border-purple-800',
    features: [
      'Post unlimited jobs',
      'Company dashboard',
      'Candidate skill filtering',
      'AI screening of applicants',
      'Dedicated account manager',
      'ATS integration',
      'Bulk candidate export',
      'Priority support',
    ],
    missing: [],
    cta: 'Contact Sales',
    ctaDisabled: false,
    enterprise: true,
  },
]

export default function UpgradePage() {
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  async function handleUpgrade(planId: string) {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@skillbridge.com.bd?subject=Enterprise Plan Inquiry'
      return
    }
    setUpgrading(planId)
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, payment_method: 'bkash' }),
      })
      const data = await res.json()
      if (res.ok && data.bkash_url) {
        window.location.href = data.bkash_url
      } else if (res.ok) {
        setSuccess('Upgrade initiated! Check your email for payment instructions.')
      } else {
        alert(data.error || 'Failed to start upgrade')
      }
    } catch { alert('Network error. Please try again.') }
    finally { setUpgrading(null) }
  }

  return (
    <div className="page-container py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Upgrade Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Unlock your full potential. Pro members get 3× more job interviews.</p>
      </div>

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-green-700 dark:text-green-300 text-center mb-6">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map(plan => (
          <div key={plan.id} className={`card p-6 relative flex flex-col ${plan.color}`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                {plan.badge}
              </div>
            )}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-gray-500">/{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>{f}
                </li>
              ))}
              {plan.missing.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="flex-shrink-0 mt-0.5">✗</span>{f}
                </li>
              ))}
            </ul>
            {plan.bkash && (
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-gray-500">
                <span className="font-semibold text-pink-600">bKash</span> •
                <span className="font-semibold text-orange-600">Nagad</span> •
                <span className="font-semibold text-blue-600">Card</span> accepted
              </div>
            )}
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.ctaDisabled || upgrading === plan.id}
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-60 ${
                plan.ctaDisabled ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default' :
                plan.id === 'pro' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {upgrading === plan.id ? 'Processing...' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8 text-sm text-gray-500">
        🔒 Payments secured by bKash & SSL. Cancel anytime.{' '}
        <Link href="/dashboard/settings" className="text-brand-600 hover:underline">Manage subscription</Link>
      </div>
    </div>
  )
}
