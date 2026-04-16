-- ============================================================
-- SKILLBRIDGE BD — Admin Setup & Bug Fix SQL
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- ============================================================
-- STEP 1: Fix the handle_new_user trigger
-- The original trigger doesn't insert the role column,
-- causing profile updates to sometimes fail.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'jobseeker'::user_role
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Create admin user
-- First go to Supabase Dashboard → Authentication → Users
-- and create a user with:
--   Email:    dewanrocky250@gmail.com
--   Password: 52034225R@
-- Then confirm their email manually in the dashboard,
-- OR run the query below AFTER creating the user.
-- ============================================================

-- Set role to 'admin' for dewanrocky250@gmail.com
-- Run this AFTER creating the user in the Auth dashboard:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'dewanrocky250@gmail.com';

-- Verify it worked:
SELECT id, email, role, created_at
FROM public.profiles
WHERE email = 'dewanrocky250@gmail.com';

-- ============================================================
-- STEP 3: If the profile row doesn't exist yet (user was
-- created but trigger didn't fire), insert it manually:
-- ============================================================
-- Uncomment and run if UPDATE above returned 0 rows:

-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT
--   au.id,
--   au.email,
--   COALESCE(au.raw_user_meta_data->>'full_name', 'Admin'),
--   'admin'::user_role
-- FROM auth.users au
-- WHERE au.email = 'dewanrocky250@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================================
-- STEP 4: Also mark email as confirmed for the admin user
-- so they can log in immediately without verification
-- ============================================================
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'dewanrocky250@gmail.com'
  AND email_confirmed_at IS NULL;

-- ============================================================
-- STEP 5: Fix RLS policies to allow profile upsert from server
-- (needed for the register route fix)
-- ============================================================
-- Allow service role to upsert profiles (it bypasses RLS by default,
-- but this makes the intent explicit)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists, then recreate cleanly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- STEP 6: Verify everything
-- ============================================================
SELECT
  p.email,
  p.role,
  p.full_name,
  au.email_confirmed_at IS NOT NULL AS email_confirmed
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.email = 'dewanrocky250@gmail.com';
