-- ==========================================
-- RPC FUNCTIONS
-- ==========================================

-- Function: Increment usage atomically
-- Handles both subscription table and daily_usage table tracking
CREATE OR REPLACE FUNCTION public.increment_usage(user_uuid UUID, seconds_to_add INTEGER)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    minutes_to_add INTEGER := CEIL(seconds_to_add / 60.0);
BEGIN
    -- 1. Update active subscription
    UPDATE public.subscriptions
    SET 
        seconds_used = seconds_used + seconds_to_add,
        updated_at = NOW()
    WHERE 
        user_id = user_uuid 
        AND status = 'active';

    -- 2. Update or Insert daily usage tracking
    INSERT INTO public.daily_usage (user_id, date, minutes_used, updated_at)
    VALUES (user_uuid, today_date, minutes_to_add, NOW())
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
        minutes_used = public.daily_usage.minutes_used + minutes_to_add,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and reset monthly usage
-- Resets seconds_used if current_period_end has passed
CREATE OR REPLACE FUNCTION public.check_and_reset_monthly_usage(user_uuid UUID)
RETURNS TABLE (
    type TEXT,
    plan_id UUID,
    allowed BOOLEAN,
    remaining_minutes INTEGER
) AS $$
DECLARE
    sub_record RECORD;
BEGIN
    SELECT * INTO sub_record 
    FROM public.subscriptions 
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;

    IF sub_record.current_period_end < NOW() THEN
        -- Reset for new month
        UPDATE public.subscriptions
        SET 
            seconds_used = 0,
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '30 days',
            updated_at = NOW()
        WHERE id = sub_record.id;
        
        -- Re-fetch record
        SELECT * INTO sub_record FROM public.subscriptions WHERE id = sub_record.id;
    END IF;

    RETURN QUERY SELECT 
        'paid'::TEXT as type,
        sub_record.plan_id,
        (sub_record.seconds_used < sub_record.monthly_seconds) as allowed,
        (sub_record.monthly_seconds - sub_record.seconds_used) / 60 as remaining_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate user rank
-- Bayesian-weighted ranking based on score and interview volume
CREATE OR REPLACE FUNCTION public.get_user_rank(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    WITH user_stats AS (
        SELECT 
            user_id,
            AVG(score) as avg_score,
            COUNT(*) as interview_count
        FROM public.interview_sessions
        WHERE status = 'completed' AND score IS NOT NULL
        GROUP BY user_id
    ),
    weighted_scores AS (
        SELECT 
            user_id,
            avg_score * (1 + LOG(10, interview_count)::NUMERIC / 10) as weighted_score
        FROM user_stats
    ),
    rankings AS (
        SELECT 
            user_id,
            RANK() OVER (ORDER BY weighted_score DESC) as rank
        FROM weighted_scores
    )
    SELECT rank INTO user_rank
    FROM rankings
    WHERE user_id = user_uuid;

    RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
