# SkillBridge BD — Bug Fixes & Changes Applied

## 🔴 BUG 1 FIXED: Verification Email Never Sent

**File:** `src/app/api/auth/register/route.ts`

**Problem:** `supabaseAdmin.auth.admin.createUser()` with `email_confirm: false` creates the user
silently — it does NOT automatically send a verification email. The original code only sent a
welcome email, so users never received a verification link and couldn't log in.

**Fix Applied:**
- After user creation, call `supabaseAdmin.auth.admin.generateLink({ type: 'signup', ... })`
  to get a real, time-limited verification URL from Supabase.
- Pass that URL to the new `sendVerificationEmail()` function in `src/lib/email/index.ts`.
- Users now receive a branded verification email with a working link.

---

## 🔴 BUG 2 FIXED: Supabase POST Errors (400/500)

**Files:** `src/lib/db/supabase.ts`, `src/app/api/auth/register/route.ts`

**Problem 1:** The supabase clients used `!` (non-null assertion) on env vars with no
runtime guard. If `.env.local` is missing or has placeholder values, every API call
silently fails with confusing 400/500 errors.

**Fix Applied:** Added startup console.error warnings when env vars are missing/default.

**Problem 2:** The register route called `.update()` on the `profiles` table immediately
after `createUser()`. But the `handle_new_user` database trigger runs asynchronously —
the profile row may not exist yet, causing the update to match 0 rows and silently fail.

**Fix Applied:** Changed `.update()` to `.upsert(..., { onConflict: 'id' })` so it creates
the row if the trigger hasn't run yet, or updates if it already has.

**Problem 3:** The `handle_new_user` trigger didn't read the `role` from user metadata,
so every newly registered user defaulted to `jobseeker` regardless of what they selected.

**Fix Applied:** Updated trigger SQL in `ADMIN_SETUP.sql` to read `role` from metadata.

---

## 🔴 BUG 3 FIXED: Admin Login Broken

**Files:** `ADMIN_SETUP.sql`, `src/app/api/auth/register/route.ts`

**Problem:** No admin user existed in the database. The `profiles.role` check
(`profile?.role !== 'admin'`) always redirected to `/dashboard` because there was no
user with `role = 'admin'` in the DB.

**Fix Applied:**
1. Created `ADMIN_SETUP.sql` — run this in Supabase SQL Editor.
2. The SQL: sets `role = 'admin'` for `dewanrocky250@gmail.com`, confirms their email
   so they can log in immediately, and creates the profile row if missing.

**To activate admin:**
1. Go to Supabase Dashboard → Authentication → Users → Add User
2. Email: `dewanrocky250@gmail.com`, Password: `52034225R@`
3. Confirm email in the dashboard (click the user → Confirm Email)
4. Run `ADMIN_SETUP.sql` in the SQL Editor
5. Log in at `/auth/login` — you'll be redirected to `/admin`

---

## 🟡 BUG 4 FIXED: Login Session Not Persisting

**File:** `src/app/auth/login/page.tsx`

**Problem:** The fetch to `/api/auth/login` didn't include `credentials: 'include'`,
so the session cookies set by the server weren't being stored in the browser.
After redirect to `/dashboard`, the middleware saw no session and bounced back to login.

**Fix Applied:** Added `credentials: 'include'` to the fetch call + added `router.refresh()`
before `router.push()` to force Next.js to re-evaluate server components with the new session.

Also added a clearer error message when email isn't verified yet.

---

## 🎨 COLOR THEME CHANGED: Ink Wash Palette

**Files:** `globals.css`, `tailwind.config.ts`, `src/app/page.tsx`, all auth pages,
dashboard pages, admin page — 21 files total.

| Role | Color | Hex |
|------|-------|-----|
| Charcoal Black (text, buttons, headers) | ■ | `#4A4A4A` |
| Cool Gray (borders, dividers, chips) | ■ | `#CBCBCB` |
| Soft Ivory (backgrounds, cards) | ■ | `#FFFFE3` |
| Slate Blue-Gray (accents, subtitles) | ■ | `#6D8196` |

All `bg-white`, `bg-gray-50`, `bg-gray-100` → `#FFFFE3` ivory
All `text-gray-900`, `text-gray-700` → `#4A4A4A` charcoal
All `border-gray-200` → `#CBCBCB` cool gray
All `text-gray-500`, `text-gray-600` → `#6D8196` slate
All `bg-brand-600` buttons → `#4A4A4A` charcoal (hover: `#6D8196` slate)

---

## 📋 SETUP CHECKLIST

### .env.local (copy from .env.example and fill in):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yoursite.com
```

### Supabase Dashboard steps:
1. SQL Editor → run `supabase-schema.sql` (full schema)
2. SQL Editor → run `ADMIN_SETUP.sql` (admin user + trigger fix)
3. Authentication → Email Templates → enable "Confirm signup" template
4. Authentication → Settings → Site URL = your deployed URL
5. Authentication → Settings → Redirect URLs → add `https://yoursite.com/auth/verify-email`

### Resend (email) steps:
1. Sign up at resend.com (free: 3000 emails/month)
2. Add and verify your domain (or use `onboarding@resend.dev` for testing)
3. Copy API key → `RESEND_API_KEY` in `.env.local`
4. Set `EMAIL_FROM=noreply@yourdomain.com` (must match verified domain)

