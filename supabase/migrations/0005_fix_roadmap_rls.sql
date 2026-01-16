-- Refine RLS policies for learning_roadmaps to be more explicit
DROP POLICY IF EXISTS "Users can manage their own roadmaps" ON public.learning_roadmaps;

CREATE POLICY "Users can manage their own roadmaps" ON public.learning_roadmaps
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Refine RLS policies for roadmap_progress to be more explicit
DROP POLICY IF EXISTS "Users can manage their own roadmap progress" ON public.roadmap_progress;

CREATE POLICY "Users can manage their own roadmap progress" ON public.roadmap_progress
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
