-- Allow selecting interview sessions if the user's profile is public
-- This is required for the public profile page to show stats and history
-- and for the global leaderboard to work for anonymous users

CREATE POLICY "Public sessions are viewable if profile is public" 
ON public.interview_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = interview_sessions.user_id 
    AND profiles.is_public = true
  )
);

-- Also allow viewing resumptions if the session is public (metadata only)
-- Though not currently used on the public profile, this keeps it consistent
CREATE POLICY "Public resumptions are viewable if profile is public" 
ON public.interview_resumptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.interview_sessions
    JOIN public.profiles ON profiles.id = interview_sessions.user_id
    WHERE interview_sessions.id = interview_resumptions.interview_session_id
    AND profiles.is_public = true
  )
);
