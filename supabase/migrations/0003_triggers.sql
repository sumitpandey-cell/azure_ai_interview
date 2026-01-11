-- ==========================================
-- 1. AUTH HOOKS & NEW USER LOGIC
-- ==========================================

-- Function: Auto-create Profile and Free Subscription for new Auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_plan_id UUID;
    default_monthly_seconds INTEGER;
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- 2. Find default 'Free' plan
    SELECT id, monthly_seconds INTO default_plan_id, default_monthly_seconds 
    FROM public.plans 
    WHERE name = 'Free' 
    LIMIT 1;

    -- 3. Create initial Subscription if plan exists
    IF default_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (
            user_id, 
            plan_id, 
            status, 
            monthly_seconds, 
            seconds_used, 
            current_period_start, 
            current_period_end
        )
        VALUES (
            NEW.id, 
            default_plan_id, 
            'active', 
            default_monthly_seconds, 
            0, 
            NOW(), 
            NOW() + INTERVAL '30 days'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fire on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. AUTOMATIC TIMESTAMPS
-- ==========================================

-- Function: Generic updated_at updater
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_daily_usage_updated_at BEFORE UPDATE ON public.daily_usage FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_learning_roadmaps_updated_at BEFORE UPDATE ON public.learning_roadmaps FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_roadmap_purchases_updated_at BEFORE UPDATE ON public.roadmap_purchases FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_company_templates_updated_at BEFORE UPDATE ON public.company_templates FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_company_questions_updated_at BEFORE UPDATE ON public.company_questions FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
