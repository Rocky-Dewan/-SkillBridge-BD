const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SkillBridge BD'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email DEV] To: ${to} | Subject: ${subject}`)
    return { success: true, id: 'dev-mock' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return { success: false }
    }
    return { success: true }
  } catch (e) {
    console.error('Email send failed:', e)
    return { success: false }
  }
}

function base(content: string) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f3f4f6;padding:40px 20px;margin:0">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb">
<div style="text-align:center;margin-bottom:32px">
  <div style="display:inline-block;background:#4f46e5;color:#fff;font-size:18px;font-weight:700;padding:8px 20px;border-radius:8px">${APP_NAME}</div>
</div>
${content}
<div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af">
  &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
  <a href="${APP_URL}" style="color:#4f46e5">${APP_URL}</a>
</div>
</div></body></html>`
}

export async function sendVerificationEmail(to: string, name: string, userId: string) {
  const verifyUrl = `${APP_URL}/auth/verify-email?uid=${userId}&email=${encodeURIComponent(to)}`
  return sendEmail(to, `Verify your ${APP_NAME} email address`, base(`
<h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 12px">Verify your email address</h2>
<p style="color:#374151;line-height:1.6">Hi ${name}, thanks for signing up for ${APP_NAME}!</p>
<p style="color:#374151;line-height:1.6">Please verify your email address to activate your account. This link expires in <strong>24 hours</strong>.</p>
<div style="text-align:center;margin:28px 0">
  <a href="${verifyUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block">Verify Email Address</a>
</div>
<p style="color:#6b7280;font-size:13px">If you didn't create an account, you can safely ignore this email.</p>
<p style="color:#6b7280;font-size:12px;word-break:break-all">Or copy this link: ${verifyUrl}</p>`))
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(to, `Welcome to ${APP_NAME}! 🎉`, base(`
<h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 16px">Welcome, ${name}! 🎉</h2>
<p style="color:#374151;line-height:1.6">Your email has been verified. You're now part of Bangladesh's first AI-powered skill verification platform!</p>
<ul style="color:#374151;line-height:2;padding-left:20px">
  <li>Take free skill assessments and earn verified badges</li>
  <li>Match with top employers across Bangladesh</li>
  <li>Build your international freelancer profile</li>
  <li>Get personalized career advice from our AI advisor</li>
</ul>
<div style="text-align:center;margin-top:28px">
  <a href="${APP_URL}/dashboard" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">Go to Dashboard →</a>
</div>`))
}

export async function sendAssessmentCompleteEmail(to: string, name: string, skill: string, score: number, badge: string) {
  const emoji = score >= 80 ? '🏆' : score >= 60 ? '🎯' : '📚'
  return sendEmail(to, `${emoji} You scored ${score}% in ${skill}!`, base(`
<h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 16px">${emoji} Assessment Complete!</h2>
<p style="color:#374151">Hi ${name}, you've completed the <strong>${skill}</strong> assessment.</p>
<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
  <div style="font-size:48px;font-weight:700;color:#16a34a">${score}%</div>
  <div style="font-size:14px;color:#15803d;font-weight:600">${badge} Level Achieved</div>
</div>
<div style="text-align:center;margin-top:24px">
  <a href="${APP_URL}/dashboard/assessments" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">View Your Badges →</a>
</div>`))
}

export async function sendJobApplicationEmail(to: string, name: string, jobTitle: string, company: string) {
  return sendEmail(to, `Application submitted: ${jobTitle} at ${company}`, base(`
<h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 16px">Application Submitted ✓</h2>
<p style="color:#374151">Hi ${name}, your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been submitted.</p>
<div style="text-align:center;margin-top:24px">
  <a href="${APP_URL}/dashboard/applications" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">Track Application →</a>
</div>`))
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return sendEmail(to, `Reset your ${APP_NAME} password`, base(`
<h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 16px">Password Reset Request</h2>
<p style="color:#374151">We received a request to reset your password. Click the button below — link expires in <strong>1 hour</strong>.</p>
<div style="text-align:center;margin:28px 0">
  <a href="${resetLink}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">Reset Password</a>
</div>
<p style="color:#6b7280;font-size:13px">If you didn't request this, ignore this email. Your password won't change.</p>
<p style="color:#6b7280;font-size:12px;word-break:break-all">Or copy: ${resetLink}</p>`))
}

export async function sendApplicationStatusEmail(to: string, name: string, jobTitle: string, status: string) {
  const statusMsg: Record<string, { emoji: string; message: string }> = {
    shortlisted: { emoji: '⭐', message: 'Great news! You have been shortlisted for an interview.' },
    hired: { emoji: '🎉', message: 'Congratulations! You have been selected for the position.' },
    rejected: { emoji: '📬', message: 'Thank you for applying. Unfortunately you were not selected this time. Keep applying!' },
  }
  const s = statusMsg[status] || { emoji: '📋', message: `Your application status has been updated to: ${status}` }
  return sendEmail(to, `${s.emoji} Application update: ${jobTitle}`, base(`
<h2 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 16px">${s.emoji} Application Update</h2>
<p style="color:#374151">Hi ${name},</p>
<p style="color:#374151;line-height:1.6">Regarding your application for <strong>${jobTitle}</strong>:</p>
<p style="color:#374151;font-size:16px;font-weight:500;margin:16px 0">${s.message}</p>
<div style="text-align:center;margin-top:24px">
  <a href="${APP_URL}/dashboard/applications" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">View Application →</a>
</div>`))
}
