# SkillBridge BD — Complete Deployment Guide

## 🏗 Project Structure
```
skillbridge-bd/
├── src/
│   ├── app/                    # Next.js 15 App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind global styles
│   │   ├── auth/               # Login / Register pages
│   │   ├── dashboard/          # Protected dashboard pages
│   │   ├── assessment/         # Skill assessment flow
│   │   ├── jobs/               # Job listings
│   │   ├── freelancer/         # Freelancer directory
│   │   ├── ai-assistant/       # AI Career Advisor chat
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API routes
│   │       ├── auth/           # register / login / logout
│   │       ├── assessment/     # start / submit / skills
│   │       ├── jobs/           # list jobs / apply
│   │       ├── ai/             # chat streaming
│   │       ├── user/           # profile / freelancer
│   │       └── admin/          # admin stats
│   ├── lib/
│   │   ├── ai/index.ts         # Anthropic Claude integration
│   │   ├── db/supabase.ts      # Supabase clients
│   │   ├── email/index.ts      # Resend email service
│   │   ├── security/index.ts   # Rate limiting, sanitization, audit logs
│   │   └── validation/schemas.ts  # Zod validation schemas
│   ├── hooks/useDebounce.ts
│   └── middleware.ts           # Auth middleware + security headers
├── supabase-schema.sql         # Full DB schema (run in Supabase)
├── .env.example                # Environment variables template
└── DEPLOY.md                   # This file
```

---

## ✅ STEP 1 — Supabase Setup (MANUAL)

1. Go to https://supabase.com → Create new project
2. Wait for project to provision (~2 min)
3. Go to **SQL Editor** → paste entire contents of `supabase-schema.sql` → click Run
4. Go to **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Authentication → Settings**:
   - Set Site URL to your app URL (e.g. `https://skillbridge.com.bd`)
   - Add `http://localhost:3000` to Redirect URLs
   - Disable email confirmation for development (enable in production)

---

## ✅ STEP 2 — Anthropic API Key (MANUAL)

1. Go to https://console.anthropic.com
2. Create account → Billing → Add payment method
3. API Keys → Create key → copy to `ANTHROPIC_API_KEY`
4. Set spending limit to $50/month to avoid surprise bills

---

## ✅ STEP 3 — Resend Email Setup (MANUAL)

1. Go to https://resend.com → create account
2. Domains → Add your domain → verify DNS records
3. API Keys → Create → copy to `RESEND_API_KEY`
4. Set `EMAIL_FROM=noreply@yourdomain.com`

> For testing without a domain: use `onboarding@resend.dev` as the from address (Resend's test domain)

---

## ✅ STEP 4 — Stripe Setup (MANUAL — for payments)

1. Go to https://stripe.com → create account
2. Developers → API keys → copy test keys
3. Webhooks → Add endpoint → `https://yourdomain.com/api/payment/webhook`
4. Select events: `payment_intent.succeeded`, `customer.subscription.*`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## ✅ STEP 5 — Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Fill in .env.local with your keys from steps 1-4

# 4. Run development server
npm run dev

# 5. Visit http://localhost:3000
```

---

## ✅ STEP 6 — Deploy to Vercel (MANUAL)

### Option A: Vercel CLI (Recommended)
```bash
npm install -g vercel
vercel login
vercel --prod
```
Vercel will auto-detect Next.js and configure build settings.

### Option B: GitHub + Vercel Dashboard
1. Push code to GitHub: `git init && git add . && git commit -m "init" && git remote add origin YOUR_REPO && git push`
2. Go to https://vercel.com → Import Git Repository
3. Select your repo → Framework: Next.js → Deploy
4. In Vercel → Settings → Environment Variables → add all vars from `.env.example`

### Required Vercel Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
JWT_SECRET
RESEND_API_KEY
EMAIL_FROM
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

---

## ✅ STEP 7 — Set Admin User (MANUAL)

After first signup, make yourself admin:

```sql
-- Run in Supabase SQL Editor
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

Then visit `/admin` to access the admin dashboard.

---

## ✅ STEP 8 — bKash Integration (MANUAL — BD payments)

1. Register at https://developer.bka.sh
2. Apply for sandbox credentials
3. Add to `.env.local`:
   ```
   BKASH_APP_KEY=your_key
   BKASH_APP_SECRET=your_secret
   BKASH_USERNAME=your_username
   BKASH_PASSWORD=your_password
   ```
4. Test in sandbox, then apply for production credentials

---

## 🔐 Security Checklist

- [x] Input sanitization on all API routes (XSS prevention)
- [x] Rate limiting on auth endpoints (10 req/15min)
- [x] Rate limiting on AI endpoints (20 req/hour)  
- [x] Rate limiting on applications (20/day)
- [x] Row Level Security (RLS) on all Supabase tables
- [x] Security headers (X-Frame-Options, CSP, HSTS)
- [x] Zod validation on all inputs
- [x] Audit logging for all auth actions
- [x] Password strength validation
- [x] SQL injection prevention via Supabase parameterized queries
- [x] CORS configured via Next.js headers
- [ ] Enable Supabase email confirmation in production
- [ ] Set up Cloudflare WAF in production
- [ ] Configure Vercel DDoS protection

---

## 💰 Revenue Streams Implemented

1. **Freelancer Premium** — `/api/user/freelancer` (POST generate_profile)
2. **Job Applications** — `/api/jobs/apply` (POST)
3. **AI Assessment** — `/api/assessment/start` + `/submit`
4. **B2B Company Posts** — `/api/jobs` (POST — requires employer role)

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Email | Resend |
| Payments | Stripe + bKash + Nagad |
| Styling | Tailwind CSS 3 |
| Validation | Zod |
| Deployment | Vercel |
| Security | Custom rate limiter, Zod, RLS |

---

## 🚀 After Launch Checklist

- [ ] Enable Supabase backups (daily)
- [ ] Set up Vercel Analytics
- [ ] Configure Sentry for error tracking: `npm install @sentry/nextjs`
- [ ] Add Google Analytics / Posthog
- [ ] Set up uptime monitoring (Better Uptime / UptimeRobot)
- [ ] Configure custom domain in Vercel
- [ ] Set up Cloudflare for CDN + DDoS protection
- [ ] Apply for BASIS membership (Bangladesh)
- [ ] Register with ICT Division freelancer program

---

## 📞 Support

Built with ❤️ for Bangladesh. Questions? Check the source code comments or create an issue.
