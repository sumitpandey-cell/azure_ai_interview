-- 1. Add public profile columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_slug TEXT UNIQUE;

-- 2. Add index for slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_slug ON public.profiles (profile_slug);

-- 3. Enable RLS (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies for Public Visibility
-- Allow anyone to read profiles marked as public
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (is_public = true);

-- Allow anyone to read interview sessions of public users
DROP POLICY IF EXISTS "Public interview stats are viewable by everyone" ON public.interview_sessions;
CREATE POLICY "Public interview stats are viewable by everyone" 
ON public.interview_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = interview_sessions.user_id 
    AND profiles.is_public = true
  )
);
