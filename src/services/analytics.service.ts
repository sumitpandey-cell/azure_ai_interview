import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Interface for feedback structure
interface FeedbackData {
    technicalSkills?: Array<{ name: string; score: number }>;
    skills?: Array<{ name: string; score: number }>;
    [key: string]: any;
}

export interface SkillData {
    name: string;
    averageScore: number;
    count: number;
}

export interface WeeklyActivityData {
    day: string;
    count: number;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
}

export interface PerformanceData {
    month: string;
    interviewCount: number;
    averageScore: number;
}

export const analyticsService = {
    /**
     * Get aggregated skill progress from all completed interviews
     */
    async getSkillProgress(userId: string): Promise<SkillData[]> {
        try {
            const { data: sessions, error } = await supabase
                .from('interview_sessions')
                .select('feedback')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .not('feedback', 'is', null);

            if (error) throw error;

            // Aggregate skills from all sessions
            const skillMap = new Map<string, { totalScore: number; count: number }>();

            sessions?.forEach(session => {
                const feedback = session.feedback as FeedbackData | null;

                // Check for technicalSkills (new format)
                const skills = feedback?.technicalSkills || feedback?.skills || [];

                skills.forEach((skill: any) => {
                    const existing = skillMap.get(skill.name) || { totalScore: 0, count: 0 };
                    skillMap.set(skill.name, {
                        totalScore: existing.totalScore + skill.score,
                        count: existing.count + 1
                    });
                });
            });

            // Convert to array and calculate averages
            const skillData: SkillData[] = Array.from(skillMap.entries()).map(([name, data]) => ({
                name,
                averageScore: Math.round(data.totalScore / data.count),
                count: data.count
            }));

            // Sort by average score descending
            return skillData.sort((a, b) => b.averageScore - a.averageScore);
        } catch (error) {
            console.error('Error fetching skill progress:', error);
            return [];
        }
    },

    /**
     * Get weekly activity data (last 7 days)
     */
    async getWeeklyActivity(userId: string): Promise<WeeklyActivityData[]> {
        try {
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 6);

            const { data: sessions, error } = await supabase
                .from('interview_sessions')
                .select('created_at')
                .eq('user_id', userId)
                .gte('created_at', sevenDaysAgo.toISOString());

            if (error) throw error;

            // Initialize all 7 days with 0 count
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const activityMap = new Map<string, number>();

            // Get the last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dayName = days[date.getDay()];
                activityMap.set(dayName, 0);
            }

            // Count sessions per day
            sessions?.forEach(session => {
                const date = new Date(session.created_at);
                const dayName = days[date.getDay()];
                activityMap.set(dayName, (activityMap.get(dayName) || 0) + 1);
            });

            // Convert to array in correct order
            const result: WeeklyActivityData[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dayName = days[date.getDay()];
                result.push({
                    day: dayName,
                    count: activityMap.get(dayName) || 0
                });
            }

            return result;
        } catch (error) {
            console.error('Error fetching weekly activity:', error);
            return [];
        }
    },

    /**
     * Calculate current and longest streak
     */
    async calculateStreak(userId: string): Promise<StreakData> {
        try {
            const { data: sessions, error } = await supabase
                .from('interview_sessions')
                .select('created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!sessions || sessions.length === 0) {
                return { currentStreak: 0, longestStreak: 0 };
            }

            // Get unique dates (YYYY-MM-DD format)
            const uniqueDates = new Set(
                sessions.map(s => new Date(s.created_at).toISOString().split('T')[0])
            );
            const sortedDates = Array.from(uniqueDates).sort().reverse();

            // Calculate current streak
            let currentStreak = 0;
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // Check if there's activity today or yesterday
            if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                currentStreak = 1;
                let checkDate = new Date(sortedDates[0]);

                for (let i = 1; i < sortedDates.length; i++) {
                    const prevDate = new Date(checkDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    const expectedDate = prevDate.toISOString().split('T')[0];

                    if (sortedDates[i] === expectedDate) {
                        currentStreak++;
                        checkDate = new Date(sortedDates[i]);
                    } else {
                        break;
                    }
                }
            }

            // Calculate longest streak
            let longestStreak = 0;
            let tempStreak = 1;

            for (let i = 1; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i]);
                const prevDate = new Date(sortedDates[i - 1]);
                const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / 86400000);

                if (diffDays === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }

            longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

            return { currentStreak, longestStreak };
        } catch (error) {
            console.error('Error calculating streak:', error);
            return { currentStreak: 0, longestStreak: 0 };
        }
    },

    /**
     * Get performance analysis data (last 6 months)
     */
    async getPerformanceAnalysis(userId: string): Promise<PerformanceData[]> {
        try {
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 5);
            sixMonthsAgo.setDate(1); // Start of month

            const { data: sessions, error } = await supabase
                .from('interview_sessions')
                .select('created_at, score')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .gte('created_at', sixMonthsAgo.toISOString());

            if (error) throw error;

            // Group by month
            const monthMap = new Map<string, { count: number; totalScore: number; scoreCount: number }>();

            // Initialize last 6 months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(today.getMonth() - i);
                const monthKey = months[date.getMonth()];
                monthMap.set(monthKey, { count: 0, totalScore: 0, scoreCount: 0 });
            }

            // Aggregate data
            sessions?.forEach(session => {
                const date = new Date(session.created_at);
                const monthKey = months[date.getMonth()];
                const existing = monthMap.get(monthKey) || { count: 0, totalScore: 0, scoreCount: 0 };

                monthMap.set(monthKey, {
                    count: existing.count + 1,
                    totalScore: existing.totalScore + (session.score || 0),
                    scoreCount: existing.scoreCount + (session.score !== null ? 1 : 0)
                });
            });

            // Convert to array
            const result: PerformanceData[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(today.getMonth() - i);
                const monthKey = months[date.getMonth()];
                const data = monthMap.get(monthKey) || { count: 0, totalScore: 0, scoreCount: 0 };

                result.push({
                    month: monthKey,
                    interviewCount: data.count,
                    averageScore: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : 0
                });
            }

            return result;
        } catch (error) {
            console.error('Error fetching performance analysis:', error);
            return [];
        }
    },

    /**
     * Get user interview history for roadmap generation
     * Returns recent 15 completed sessions + aggregate stats
     * @param supabaseClient - Optional Supabase client (for server-side calls)
     */
    async getUserInterviewHistory(userId: string, supabaseClient?: SupabaseClient<Database>) {
        try {
            const client = supabaseClient || supabase;
            // Fetch last 15 completed interviews
            const { data: sessions, error } = await client
                .from('interview_sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .not('feedback', 'is', null)
                .order('completed_at', { ascending: false })
                .limit(15);

            if (error) throw error;

            // Calculate aggregate stats
            const { count: totalCount } = await client
                .from('interview_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'completed');

            const { count: completedCount } = await client
                .from('interview_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Calculate average score
            const averageScore = sessions && sessions.length > 0
                ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length
                : 0;

            // Calculate completion rate
            const completionRate = completedCount && completedCount > 0
                ? ((totalCount || 0) / completedCount) * 100
                : 0;

            // Extract weak and strong areas from feedback
            const weakAreas = new Set<string>();
            const strongAreas = new Set<string>();

            sessions?.forEach(session => {
                const feedback = session.feedback as any;
                if (feedback?.weaknesses) {
                    feedback.weaknesses.forEach((w: string) => weakAreas.add(w));
                }
                if (feedback?.strengths) {
                    feedback.strengths.forEach((s: string) => strongAreas.add(s));
                }
            });

            // Determine trend
            let trend: 'improving' | 'stable' | 'declining' = 'stable';
            if (sessions && sessions.length >= 3) {
                const recent = sessions.slice(0, 3).reduce((sum, s) => sum + (s.score || 0), 0) / 3;
                const older = sessions.slice(3, 6).reduce((sum, s) => sum + (s.score || 0), 0) / 3;
                if (recent > older + 5) trend = 'improving';
                else if (recent < older - 5) trend = 'declining';
            }

            return {
                interviews: sessions || [],
                completed: sessions || [],
                stats: {
                    total_interviews: totalCount || 0,
                    average_score: Math.round(averageScore),
                    completion_rate: Math.round(completionRate),
                    weak_areas: Array.from(weakAreas),
                    strong_areas: Array.from(strongAreas),
                    trend
                }
            };
        } catch (error) {
            console.error('Error fetching interview history:', error);
            return {
                interviews: [],
                completed: [],
                stats: {
                    total_interviews: 0,
                    average_score: 0,
                    completion_rate: 0,
                    weak_areas: [],
                    strong_areas: [],
                    trend: 'stable' as const
                }
            };
        }
    }
};
