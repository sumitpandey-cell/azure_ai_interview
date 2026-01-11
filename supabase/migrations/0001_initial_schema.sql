-- ==========================================
-- 1. TABLES DEFINITIONS
-- ==========================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    streak_count INTEGER DEFAULT 0 NOT NULL,
    last_activity_date TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false NOT NULL,
    profile_slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PLANS
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    monthly_seconds INTEGER NOT NULL,
    price_monthly NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT DEFAULT 'active' NOT NULL,
    current_period_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    monthly_seconds INTEGER NOT NULL,
    seconds_used INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INTERVIEW SESSIONS
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interview_type TEXT NOT NULL,
    position TEXT NOT NULL,
    difficulty TEXT,
    score INTEGER,
    status TEXT DEFAULT 'in_progress' NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    feedback JSONB,
    transcript JSONB,
    difficulty_progression JSONB DEFAULT '[]'::jsonb NOT NULL,
    total_hints_used INTEGER DEFAULT 0 NOT NULL,
    average_performance_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- INTERVIEW RESUMPTIONS
CREATE TABLE IF NOT EXISTS public.interview_resumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    resumed_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    start_transcript_index INTEGER DEFAULT 0 NOT NULL,
    end_transcript_index INTEGER,
    duration_seconds INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BADGES
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    requirement TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- USER BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- TEMPLATES
CREATE TABLE IF NOT EXISTS public.templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color TEXT NOT NULL,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('Technical', 'Behavioral', 'Creative')),
    skills TEXT[] DEFAULT '{}'::text[] NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_popular BOOLEAN DEFAULT false NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DOMAINS
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    description TEXT,
    companies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COMPANY TEMPLATES
CREATE TABLE IF NOT EXISTS public.company_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    industry TEXT,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    common_roles TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COMPANY QUESTIONS
CREATE TABLE IF NOT EXISTS public.company_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.company_templates(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('Technical', 'Behavioral', 'System Design', 'Coding', 'Case Study')),
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    role TEXT,
    experience_level TEXT CHECK (experience_level IN ('Entry', 'Mid', 'Senior', 'Staff', 'Principal')),
    tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    difficulty_score INTEGER,
    hints JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- QUESTIONS (General pool)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    topics TEXT[],
    description TEXT NOT NULL,
    constraints TEXT[],
    examples JSONB,
    hints TEXT[],
    default_code JSONB,
    test_cases JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DAILY USAGE
CREATE TABLE IF NOT EXISTS public.daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    minutes_used INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

-- LEARNING ROADMAPS
CREATE TABLE IF NOT EXISTS public.learning_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1 NOT NULL,
    overall_level TEXT CHECK (overall_level IN ('Beginner', 'Intermediate', 'Advanced')),
    roadmap_data JSONB NOT NULL,
    is_paid BOOLEAN DEFAULT false NOT NULL,
    payment_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    payment_id TEXT,
    payment_status TEXT CHECK (payment_status IN ('free', 'pending', 'completed', 'failed')) DEFAULT 'free' NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ROADMAP PROGRESS
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES public.learning_roadmaps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phase_number INTEGER,
    milestone_id TEXT,
    item_type TEXT CHECK (item_type IN ('phase', 'milestone', 'goal', 'interview', 'resource')),
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ROADMAP PURCHASES
CREATE TABLE IF NOT EXISTS public.roadmap_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    roadmap_id UUID REFERENCES public.learning_roadmaps(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    payment_gateway TEXT DEFAULT 'razorpay' NOT NULL,
    payment_id TEXT UNIQUE NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 2. ENABLING RLS
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_resumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PLANS (Read only for everyone)
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);

-- SUBSCRIPTIONS
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- INTERVIEW SESSIONS
CREATE POLICY "Users can view their own sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.interview_sessions FOR UPDATE USING (auth.uid() = user_id);

-- INTERVIEW RESUMPTIONS
CREATE POLICY "Users can view their own resumptions" ON public.interview_resumptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = interview_resumptions.interview_session_id AND user_id = auth.uid()));
CREATE POLICY "Users can create resumptions for their sessions" ON public.interview_resumptions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = interview_session_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their resumptions" ON public.interview_resumptions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = interview_session_id AND user_id = auth.uid()));

-- BADGES (Read only for everyone)
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- USER BADGES
CREATE POLICY "Anyone can view earned badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can earn their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TEMPLATES & CONTENT (Read only for everyone)
CREATE POLICY "Anyone can view active templates" ON public.templates FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view domains" ON public.domains FOR SELECT USING (true);
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Anyone can view active companies" ON public.company_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active company questions" ON public.company_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);

-- ROADMAP TABLES (Private per user)
CREATE POLICY "Users can manage their own roadmaps" ON public.learning_roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own roadmap progress" ON public.roadmap_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own roadmap purchases" ON public.roadmap_purchases FOR SELECT USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. SEED DATA
-- ==========================================

-- SEED PLANS
INSERT INTO public.plans (name, monthly_seconds, price_monthly) VALUES
('Free', 6000, 0),
('Basic', 18000, 499),
('Pro', 60000, 999),
('Business', 9999999, 2999)
ON CONFLICT (name) DO NOTHING;

-- SEED TEMPLATES
INSERT INTO public.templates (id, title, description, icon_name, color, interview_type, skills, difficulty, is_popular, category) VALUES
('frontend-developer', 'Frontend Developer', 'UI design, interactivity, and integration with APIs.', 'Code2', 'text-blue-500', 'Technical', ARRAY['React', 'JavaScript', 'CSS', 'HTML', 'UI/UX'], 'Intermediate', true, 'Engineer'),
('backend-developer', 'Backend Developer', 'API design, database management, and architecture.', 'Database', 'text-purple-500', 'Technical', ARRAY['Node.js', 'Database', 'API Design', 'System Design'], 'Intermediate', true, 'Engineer'),
('fullstack-developer', 'Full Stack Developer', 'Frontend, backend, APIs, and deployment.', 'Layers', 'text-indigo-500', 'Technical', ARRAY['Frontend', 'Backend', 'Database', 'Deployment'], 'Advanced', true, 'Engineer')
ON CONFLICT (id) DO NOTHING;

-- SEED BADGES
INSERT INTO public.badges (slug, name, description, category, rarity, icon_name, requirement) VALUES
('streak-3', '3-Day Rookie', 'Complete interviews for 3 consecutive days', 'streak', 'bronze', '🔥', '3-day streak'),
('streak-7', '7-Day Consistent', 'Maintain a 7-day interview streak', 'streak', 'silver', '⚡', '7-day streak'),
('streak-14', '14-Day Dedicated', 'Two weeks of consistent practice', 'streak', 'silver', '🌟', '14-day streak'),
('streak-30', '30-Day Grinder', 'Show true commitment with a 30-day streak', 'streak', 'gold', '💪', '30-day streak'),
('streak-100', '100-Day Acharya', 'Legendary dedication - 100 days of continuous practice', 'streak', 'platinum', '👑', '100-day streak'),
('high-scorer', 'High Scorer', 'Achieve a score of 80% or higher', 'performance', 'bronze', '⭐', 'Score 80%+'),
('excellence', 'Excellence', 'Score 90% or higher in an interview', 'performance', 'silver', '🌟', 'Score 90%+'),
('perfect-score', 'Perfect Score', 'Achieve a flawless 100% score', 'performance', 'gold', '💯', 'Score 100%'),
('consistent-performer', 'Consistent Performer', 'Maintain 75%+ average across 5 interviews', 'performance', 'gold', '📊', '75%+ avg (5 interviews)'),
('first-interview', 'First Interview', 'Complete your first interview', 'milestone', 'bronze', '🎯', '1 interview'),
('interviews-5', '5 Interviews', 'Complete 5 interviews', 'milestone', 'bronze', '🎪', '5 interviews'),
('interviews-10', '10 Interviews', 'Complete 10 interviews', 'milestone', 'silver', '🎖️', '10 interviews'),
('interviews-25', '25 Interviews', 'Complete 25 interviews', 'milestone', 'silver', '🏵️', '25 interviews'),
('interviews-50', '50 Interviews', 'Complete 50 interviews', 'milestone', 'gold', '🏅', '50 interviews'),
('interviews-100', '100 Interviews', 'Complete 100 interviews - True dedication!', 'milestone', 'platinum', '🎊', '100 interviews'),
('communication-guru', 'Communication Guru', 'Excel in communication skills', 'communication', 'gold', '💬', 'High communication score'),
('articulate', 'Articulate', 'Demonstrate clear and concise communication', 'communication', 'silver', '🗣️', 'Clear communication'),
('subject-matter-expert', 'Subject Matter Expert', 'Master a specific skill domain', 'skill', 'gold', '🎓', 'Skill mastery'),
('technical-wizard', 'Technical Wizard', 'Demonstrate exceptional technical knowledge', 'skill', 'platinum', '🧙', 'Technical excellence'),
('weekly-top-10', 'Top 10% Weekly', 'Rank in the top 10% this week', 'leaderboard', 'silver', '🏆', 'Top 10% rank'),
('weekly-top-3', 'Weekly Top 3', 'Finish in the top 3 this week', 'leaderboard', 'gold', '🥇', 'Top 3 rank'),
('monthly-champion', 'Monthly Champion', 'Claim the #1 spot for the month', 'leaderboard', 'platinum', '👑', '#1 monthly rank'),
('quick-thinker', 'Quick Thinker', 'Complete interview in under 15 minutes', 'speed', 'bronze', '⚡', 'Complete in <15 min'),
('lightning-fast', 'Lightning Fast', 'Complete interview in under 10 minutes', 'speed', 'silver', '⚡', 'Complete in <10 min'),
('versatile', 'Versatile', 'Complete 3 different interview types', 'diversity', 'silver', '🎭', '3 interview types'),
('jack-of-all-trades', 'Jack of All Trades', 'Complete 5 different interview types', 'diversity', 'gold', '🌈', '5 interview types'),
('comeback-hero', 'Comeback Hero', 'Return after a break and complete a 3-day streak', 'special', 'special', '🦸', '7+ days inactive, then 3-day streak'),
('early-bird', 'Early Bird', 'Complete interviews in the morning (6 AM - 10 AM)', 'special', 'special', '🌅', 'Morning interviews'),
('night-owl', 'Night Owl', 'Complete interviews late at night (10 PM - 2 AM)', 'special', 'special', '🦉', 'Night interviews')
ON CONFLICT (slug) DO NOTHING;

-- SEED COMPANY TEMPLATES
INSERT INTO public.company_templates (id, name, slug, logo_url, industry, description, difficulty, common_roles, metadata, is_active) VALUES
('1166b15f-3bf4-42cf-983b-f48f07e002ed', 'Google', 'google', 'https://logo.clearbit.com/google.com', 'Technology', 'Leading technology company known for search, cloud, and AI products', 'Advanced', ARRAY['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'], '{}'::jsonb, true),
('2ccc526b-3258-4f61-ae51-ef8ef91f8540', 'Stripe', 'stripe', 'https://logo.clearbit.com/stripe.com', 'Fintech', 'Online payment processing platform', 'Intermediate', ARRAY['Software Engineer', 'Product Manager', 'Solutions Engineer', 'Data Analyst'], '{}'::jsonb, true),
('35ad7343-01b2-4066-bd96-9ac208075d9b', 'Netflix', 'netflix', 'https://logo.clearbit.com/netflix.com', 'Streaming & Entertainment', 'Leading streaming entertainment service', 'Advanced', ARRAY['Software Engineer', 'Data Engineer', 'Content Strategist', 'Product Manager'], '{}'::jsonb, true),
('3b0f9e67-bbca-42f6-bb3e-7e06bf019dac', 'Apple', 'apple', 'https://logo.clearbit.com/apple.com', 'Technology & Consumer Electronics', 'Premium consumer electronics and software company', 'Advanced', ARRAY['Software Engineer', 'Hardware Engineer', 'Product Designer', 'Machine Learning Engineer'], '{}'::jsonb, true),
('541f6854-2cb4-4602-9acc-c41cef429c77', 'Meta', 'meta', 'https://logo.clearbit.com/meta.com', 'Social Media & Technology', 'Social media and metaverse technology company', 'Advanced', ARRAY['Software Engineer', 'Product Designer', 'Data Scientist', 'Research Scientist'], '{}'::jsonb, true),
('6f07cb9a-a661-4441-9ef6-49cdbbaa47aa', 'Amazon', 'amazon', 'https://logo.clearbit.com/amazon.com', 'E-commerce & Cloud', 'Global e-commerce and cloud computing leader', 'Advanced', ARRAY['Software Development Engineer', 'Product Manager', 'Solutions Architect', 'Data Engineer'], '{}'::jsonb, true),
('8f55985c-5c7e-4c27-ac9d-c67df072c555', 'Microsoft', 'microsoft', 'https://logo.clearbit.com/microsoft.com', 'Technology', 'Software and cloud services giant', 'Intermediate', ARRAY['Software Engineer', 'Cloud Solutions Architect', 'Program Manager', 'Data Scientist'], '{}'::jsonb, true),
('ee02eb88-8ebe-428e-8a23-d9448e8961ab', 'Tesla', 'tesla', 'https://logo.clearbit.com/tesla.com', 'Automotive & Energy', 'Electric vehicles and clean energy company', 'Advanced', ARRAY['Software Engineer', 'Mechanical Engineer', 'Automation Engineer', 'Data Scientist'], '{}'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;
