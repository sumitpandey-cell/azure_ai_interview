-- Add unique constraint to prevent multiple in-progress sessions for a single user
-- This handles race conditions where multiple tabs might try to create sessions simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_session ON public.interview_sessions (user_id) WHERE (status = 'in_progress');
