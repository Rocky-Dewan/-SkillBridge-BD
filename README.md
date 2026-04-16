# SkillBridge BD

SkillBridge BD is a full-stack skill verification and job matching platform built for Bangladesh. It allows job seekers, freelancers, and employers to connect through AI-powered skill assessments. Candidates earn verified badges by completing timed tests, which are then used to match them with relevant job listings and freelance opportunities.

---

<div align="center">
  <a href="https://skillbridge-bd.vercel.app/"><strong>Explore SkillBridge BD Live »</strong></a>
</div>


## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database Setup](#database-setup)
- [Admin Account Setup](#admin-account-setup)
- [User Roles](#user-roles)
- [Features by Role](#features-by-role)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Security](#security)
- [Deployment](#deployment)
- [Payment Integration](#payment-integration)
- [Known Limitations](#known-limitations)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | Latest |
| AI | Groq (LLaMA 3.3 70B) | Latest |
| Email | Resend | 4.x |
| Styling | Tailwind CSS | 3.x |
| Validation | Zod | 3.x |
| Forms | React Hook Form | 7.x |
| Deployment | Vercel | - |

---

## Project Structure

```
skillbridge/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Landing page
│   │   ├── layout.tsx                    # Root layout
│   │   ├── globals.css                   # Global styles
│   │   ├── auth/
│   │   │   ├── login/page.tsx            # Login page
│   │   │   ├── register/                 # Registration page and form
│   │   │   ├── forgot-password/page.tsx  # Forgot password page
│   │   │   └── reset-password/page.tsx   # Password reset page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Dashboard shell layout
│   │   │   ├── DashboardNav.tsx          # Sidebar navigation (client)
│   │   │   ├── page.tsx                  # Dashboard overview
│   │   │   ├── assessments/page.tsx      # Skill badge gallery
│   │   │   ├── jobs/page.tsx             # Job browser
│   │   │   ├── jobs/post/page.tsx        # Post a job form
│   │   │   ├── freelancer/page.tsx       # Freelancer profile and AI generator
│   │   │   ├── applications/page.tsx     # Application tracker
│   │   │   ├── profile/page.tsx          # Edit profile
│   │   │   ├── settings/page.tsx         # Account settings, password, deletion
│   │   │   ├── upgrade/page.tsx          # Premium plan comparison
│   │   │   └── notifications/page.tsx    # Notification centre
│   │   ├── assessment/page.tsx           # Skill assessment flow
│   │   ├── jobs/page.tsx                 # Public job listings
│   │   ├── freelancer/page.tsx           # Public freelancer directory
│   │   ├── ai-assistant/page.tsx         # AI career advisor chat
│   │   ├── admin/page.tsx                # Admin dashboard
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── forgot-password/route.ts
│   │       │   └── reset-password/route.ts
│   │       ├── assessment/
│   │       │   ├── skills/route.ts       # List skills + completed assessments
│   │       │   ├── start/route.ts
│   │       │   └── submit/route.ts
│   │       ├── jobs/
│   │       │   ├── route.ts              # GET list / POST create
│   │       │   └── apply/route.ts        # GET list / POST apply
│   │       ├── user/
│   │       │   ├── profile/route.ts      # GET / PATCH / PUT / DELETE
│   │       │   └── freelancer/route.ts   # GET / POST generate
│   │       ├── ai/chat/route.ts
│   │       └── admin/stats/route.ts
│   ├── lib/
│   │   ├── ai/index.ts                   # Groq AI helpers
│   │   ├── db/supabase.ts                # Browser, server, and admin clients
│   │   ├── email/index.ts                # Resend email service
│   │   ├── security/index.ts             # Rate limiting, sanitization, audit logs
│   │   └── validation/schemas.ts         # Zod schemas for all inputs
│   ├── hooks/
│   │   └── useDebounce.ts
│   └── middleware.ts                     # Auth protection and security headers
├── supabase-schema.sql                   # Full database schema
├── .env.example                          # Environment variable template
└── README.md
```

---

## Prerequisites

- Node.js 18.17 or higher
- npm 9 or higher
- A Supabase account (free tier is sufficient)
- A Groq API key (free tier is sufficient)
- A Resend account for transactional email (free tier: 3,000 emails per month)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in each value.

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Yes |
| `GROQ_API_KEY` | Groq API key for AI features | Yes |
| `RESEND_API_KEY` | Resend API key for email | Yes |
| `EMAIL_FROM` | Sender email address | Yes |
| `NEXT_PUBLIC_SITE_URL` | Full URL of the deployed app | Yes |
| `NEXT_PUBLIC_APP_URL` | Same as above (used in some links) | Yes |
| `JWT_SECRET` | Random secret, minimum 32 characters | Yes |
| `BKASH_APP_KEY` | bKash sandbox or production key | Optional |
| `BKASH_APP_SECRET` | bKash app secret | Optional |
| `BKASH_USERNAME` | bKash merchant username | Optional |
| `BKASH_PASSWORD` | bKash merchant password | Optional |

To generate a JWT secret:

```bash
openssl rand -base64 32
```

---

## Local Development

1. Clone the repository and install dependencies.

```bash
git clone <repository-url>
cd skillbridge
npm install
```

2. Set up environment variables as described above.

3. Run the database schema in Supabase (see Database Setup below).

4. Start the development server.

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Other available commands:

```bash
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run test           # Run Jest unit tests
npm run security:audit # Audit npm dependencies
```

---

## Database Setup

1. Log in to your Supabase project at https://supabase.com.
2. Go to the SQL Editor.
3. Open `supabase-schema.sql` from this repository and paste its full contents into the editor.
4. Click Run. This creates all tables, enums, indexes, Row Level Security policies, and triggers.

If you are upgrading an existing database rather than starting fresh, the schema file includes `ALTER TABLE` migration statements at the bottom that add any new columns safely using `ADD COLUMN IF NOT EXISTS`.

### Supabase Auth settings

In your Supabase project, go to Authentication and configure the following:

- Set Site URL to your production domain, for example `https://skillbridge.com.bd`.
- Add `http://localhost:3000` to the list of allowed Redirect URLs for local development.
- Email confirmation is enabled by default (required in production). For local development only, you may disable it temporarily under Authentication, Providers, Email.

---

## Admin Account Setup

To give yourself an admin role:

1. Register a normal account through the application.
2. Go to the Supabase SQL Editor and run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

3. Because the admin account is created through normal registration, it does not automatically have a password from the SQL update. If you created the profile only via SQL without going through the sign-up flow, go to Supabase Dashboard, then Authentication, then Users, find your email, and click Send password reset email. Follow the link in the email to set a password.

4. Log in and visit `/admin` to access the admin dashboard.

Admin access is enforced at two levels: the middleware checks the role before serving the page, and the admin page itself re-checks the role server-side.

---

## User Roles

| Role | Description |
|---|---|
| `jobseeker` | Can take assessments, browse jobs, apply for positions |
| `freelancer` | Can take assessments, generate an AI profile, appear in the freelancer directory |
| `employer` | Can post jobs, view applicants and their skill scores |
| `admin` | Full access to the admin dashboard, all user data, and platform statistics |

A user selects their role at registration. The role is stored in the `profiles` table and enforced by Row Level Security policies in Supabase.

---

## Features by Role

### Job Seeker and Freelancer

- Take timed skill assessments (10 questions, 15 minutes) and earn a verified badge at one of four levels: beginner, intermediate, advanced, expert.
- View all earned skill badges with scores and completion dates at `/dashboard/assessments`.
- Browse active job listings with search and filter at `/dashboard/jobs`.
- Submit job applications with an optional cover letter.
- Track application statuses (applied, screening, shortlisted, rejected, hired) at `/dashboard/applications`.
- Generate an AI-written freelancer profile based on verified skill scores at `/dashboard/freelancer`.
- Edit personal profile including bio, location, LinkedIn, GitHub, and portfolio links at `/dashboard/profile`.
- Change password, manage notification preferences, and delete account at `/dashboard/settings`.
- Upgrade to a premium plan at `/dashboard/upgrade`.
- Chat with an AI career advisor at `/ai-assistant`.

### Employer

- Post job listings with description, requirements, salary range, required skills, and minimum skill score threshold at `/dashboard/jobs/post`.
- View applications submitted to their job postings.
- See applicant skill match scores calculated by AI at the time of application.

### Admin

- View platform statistics including total users, jobs, assessments, applications, and average skill score at `/admin`.
- See recent user signups and recent assessment completions.
- Role breakdown between job seekers, freelancers, and employers.

---

## API Reference

All API routes are under `/api`. Routes that require authentication return `401` if the session cookie is missing or invalid.

### Authentication

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account. Sends verification email. |
| POST | `/api/auth/login` | No | Sign in with email and password. |
| POST | `/api/auth/logout` | No | Sign out and clear session. |
| POST | `/api/auth/forgot-password` | No | Send password reset email. |

### Assessments

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/assessment/skills` | Optional | List all active skills. If authenticated, also returns the user's completed assessments. |
| POST | `/api/assessment/start` | Yes | Start a new assessment for a given skill ID. Returns assessment ID and 10 questions. |
| POST | `/api/assessment/submit` | Yes | Submit answers. Returns score, badge level, and AI feedback. |

### Jobs

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | No | List active jobs. Supports query params: `search`, `location`, `type`, `remote`, `page`, `limit`. |
| POST | `/api/jobs` | Yes | Create a job listing. Requires employer role. Rate limited to 5 per hour. |
| GET | `/api/jobs/apply` | Yes | List the authenticated user's applications. |
| POST | `/api/jobs/apply` | Yes | Apply to a job. Rate limited to 20 per day. |

### User

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/user/profile` | Yes | Get full profile including assessments and freelancer profile. |
| PATCH | `/api/user/profile` | Yes | Update profile fields (name, bio, phone, location, social links). |
| PUT | `/api/user/profile` | Yes | Update notification preferences. |
| DELETE | `/api/user/profile` | Yes | Permanently delete account and all associated data. |
| GET | `/api/user/freelancer` | Yes | Get freelancer profile and assessment summary. |
| POST | `/api/user/freelancer` | Yes | Generate an AI-written freelancer profile. Rate limited to 5 per hour. |

### Admin

| Method | Route | Auth + Role | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Yes, admin | Platform-wide statistics. |

---

## Authentication Flow

### Registration

1. User submits name, email, password, and role.
2. Server validates input with Zod, sanitizes all string fields, and checks the email domain against a blocklist of disposable email services.
3. Supabase creates the auth user with `email_confirm: false`, meaning the user must verify their email before they can log in.
4. A verification email is sent automatically by Supabase to the provided address.
5. The user is shown a confirmation screen telling them to check their inbox.
6. After clicking the verification link, the user can log in normally.

### Password Reset

1. User visits `/auth/forgot-password` and submits their email.
2. The server calls Supabase's password reset API. The response is always `200` regardless of whether the email exists, to prevent email enumeration attacks.
3. If the email belongs to a registered account, Supabase sends a reset link.
4. The link points to `/auth/reset-password`, where a Supabase `PASSWORD_RECOVERY` session event is detected client-side.
5. The user sets a new password. Strength requirements are enforced: minimum 8 characters, at least one uppercase letter, one number, and one special character.

### Session Management

Sessions are managed entirely by Supabase Auth using secure HTTP-only cookies. The middleware reads the session cookie on every request to protected routes and redirects unauthenticated users to the login page. Admin routes additionally check the user's role in the `profiles` table.

---

## Security

### Input Validation

All API routes validate inputs using Zod schemas defined in `src/lib/validation/schemas.ts`. All string inputs are also passed through a sanitizer in `src/lib/security/index.ts` that strips script tags, javascript: protocol strings, and HTML angle brackets before any database operation.

### Rate Limiting

Rate limiting is applied per IP or per user ID using an in-memory store.

| Endpoint | Limit |
|---|---|
| Registration | 5 attempts per IP per 15 minutes |
| Login | 10 attempts per IP per 15 minutes |
| Forgot password | 3 attempts per IP per 15 minutes |
| Job posting | 5 posts per user per hour |
| Job applications | 20 applications per user per day |
| AI profile generation | 5 generations per user per hour |
| AI chat | 20 messages per user per hour |

Note: The in-memory rate limit store resets when the server process restarts. For production at scale, replace it with a Redis-backed store using the `rate-limiter-flexible` package already installed.

### Security Headers

The following HTTP security headers are set on every response by the middleware:

- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` — browser-level XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables camera, microphone, and geolocation
- `Content-Security-Policy` — restricts script and connection sources

### Row Level Security

All Supabase tables have Row Level Security enabled. Users can only read and write their own records. Employers can read applications submitted to their own job postings. Admins bypass RLS using the service role key, which is only used server-side and never exposed to the client.

### Audit Logging

All authentication events (register, login, failed login) are written to an `audit_logs` table in Supabase with the user ID, action, IP address, and timestamp.

### Disposable Email Blocking

The registration endpoint rejects email addresses from known disposable email services including mailinator.com, guerrillamail.com, yopmail.com, tempmail.com, and others.

---

## Deployment

The application is designed to deploy on Vercel with zero configuration beyond environment variables.

1. Push the repository to GitHub.
2. Import the repository in Vercel at https://vercel.com/new.
3. Set all environment variables from `.env.example` in the Vercel project settings.
4. Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.
5. Deploy.

After deploying, update the Supabase Authentication settings to add your Vercel URL to the allowed Redirect URLs list and set it as the Site URL.

For a custom domain, configure it in Vercel project settings, then update Supabase and environment variables accordingly.

---

## Payment Integration

The application is structured to support bKash, Nagad, and Stripe payments. The credentials for all three are defined in `.env.example`. The upgrade page at `/dashboard/upgrade` currently shows pricing and a call-to-action button, but the payment gateway integration code is a placeholder pending production merchant credentials.

To enable bKash:
1. Register at https://developer.bka.sh for a sandbox account.
2. Fill in the four `BKASH_` variables in `.env.local`.
3. Test in sandbox mode before applying for production credentials, which require a registered business.

---

## Known Limitations

- Rate limiting uses an in-memory store. It resets on server restart and does not share state across multiple instances. Replace with Redis for production use at scale.
- The notifications page is scaffolded but requires a `notifications` table to be added to the database schema and a background job or webhook to populate it.
- The upgrade flow does not complete a real payment transaction. The payment gateway must be wired to the upgrade button before accepting real subscribers.
- AI assessment questions are generated dynamically by the Groq API. If the Groq API is unavailable, assessments cannot be started.
- Email deliverability depends on your Resend domain configuration. Without a verified custom domain, use `onboarding@resend.dev` as `EMAIL_FROM` for testing only.
