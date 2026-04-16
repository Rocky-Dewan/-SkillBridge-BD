-- ============================================================
-- SKILLBRIDGE BD — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('jobseeker', 'employer', 'freelancer', 'admin');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE assessment_status AS ENUM ('pending', 'in_progress', 'completed', 'expired');
CREATE TYPE job_status AS ENUM ('active', 'paused', 'filled', 'expired');
CREATE TYPE application_status AS ENUM ('applied', 'screening', 'shortlisted', 'rejected', 'hired');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('stripe', 'bkash', 'nagad');

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'jobseeker',
  phone TEXT,
  location TEXT,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  skill_score INTEGER DEFAULT 0,
  total_assessments INTEGER DEFAULT 0,
  profile_completeness INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSESSMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) NOT NULL,
  skill_name TEXT NOT NULL,
  status assessment_status DEFAULT 'pending',
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  percentage DECIMAL(5,2),
  level skill_level,
  time_taken_seconds INTEGER,
  questions_total INTEGER DEFAULT 10,
  questions_correct INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]',
  ai_feedback TEXT,
  badge_earned TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSESSMENT QUESTIONS (AI-generated, cached)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  skill_id UUID REFERENCES public.skills(id) NOT NULL,
  difficulty skill_level NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  times_used INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  description TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT false,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  job_type TEXT DEFAULT 'full-time',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'BDT',
  required_skills JSONB DEFAULT '[]',
  min_skill_score INTEGER DEFAULT 0,
  status job_status DEFAULT 'active',
  views INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOB APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'applied',
  cover_letter TEXT,
  resume_url TEXT,
  skill_match_score INTEGER,
  ai_screening_notes TEXT,
  employer_notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- ============================================================
-- FREELANCER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  title TEXT,
  hourly_rate_min INTEGER,
  hourly_rate_max INTEGER,
  currency TEXT DEFAULT 'USD',
  availability TEXT DEFAULT 'available',
  skills_summary JSONB DEFAULT '[]',
  portfolio_items JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  total_earnings DECIMAL(12,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  client_rating DECIMAL(3,2),
  response_time TEXT,
  export_profile_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CHAT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT DEFAULT 'career_advisor',
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE (Security)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RATE LIMIT TRACKING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_skill_score ON public.profiles(skill_score DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_skill_id ON public.assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_search ON public.jobs USING gin(to_tsvector('english', title || ' ' || description));

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Assessments: users can only see their own
CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.assessments FOR UPDATE USING (auth.uid() = user_id);

-- Jobs: public read, only company owners can modify
CREATE POLICY "Jobs are publicly viewable" ON public.jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Company owners can manage jobs" ON public.jobs FOR ALL USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- Applications: applicants and employers can view
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Users can create applications" ON public.applications FOR INSERT WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "Employers can view job applications" ON public.applications FOR SELECT USING (
  job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.owner_id = auth.uid())
);

-- AI sessions: private
CREATE POLICY "Users can manage own AI sessions" ON public.ai_sessions FOR ALL USING (auth.uid() = user_id);

-- Notifications: private
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Payments: private
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update skill score after assessment
CREATE OR REPLACE FUNCTION public.update_user_skill_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles SET
      skill_score = (
        SELECT COALESCE(AVG(percentage), 0)::INTEGER
        FROM public.assessments
        WHERE user_id = NEW.user_id AND status = 'completed'
      ),
      total_assessments = (
        SELECT COUNT(*) FROM public.assessments
        WHERE user_id = NEW.user_id AND status = 'completed'
      )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_assessment_completed
  AFTER UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION update_user_skill_score();

-- ============================================================
-- SEED: Default Skills
-- ============================================================
INSERT INTO public.skills (name, category, description, icon) VALUES
  ('JavaScript', 'Programming', 'Frontend and backend JavaScript development', 'code'),
  ('React', 'Frontend', 'React.js framework for UI development', 'layers'),
  ('Python', 'Programming', 'Python programming and data science', 'terminal'),
  ('SQL', 'Database', 'Structured Query Language for databases', 'database'),
  ('Digital Marketing', 'Marketing', 'SEO, SEM, social media marketing', 'trending-up'),
  ('Graphic Design', 'Design', 'Visual design, branding, and UI design', 'pen-tool'),
  ('English Communication', 'Soft Skills', 'Professional English writing and speaking', 'message-circle'),
  ('Data Analysis', 'Analytics', 'Data analysis with Excel, Python, or R', 'bar-chart-2'),
  ('Node.js', 'Backend', 'Server-side JavaScript with Node.js', 'server'),
  ('Project Management', 'Management', 'Agile, Scrum, project planning', 'clipboard'),
  ('UI/UX Design', 'Design', 'User interface and experience design', 'layout'),
  ('WordPress', 'CMS', 'WordPress website development', 'globe'),
  ('Machine Learning', 'AI/ML', 'Machine learning and AI fundamentals', 'cpu'),
  ('Content Writing', 'Writing', 'SEO content writing and copywriting', 'edit'),
  ('Video Editing', 'Media', 'Video production and editing skills', 'video')
ON CONFLICT (name) DO NOTHING;
