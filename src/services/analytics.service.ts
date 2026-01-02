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

            if (error) {
                console.error('[WeeklyActivity] Supabase error:', error);
                throw error;
            }

            console.log(`[WeeklyActivity] Sessions found for last 7 days: ${sessions?.length || 0}`);

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
            console.error('[WeeklyActivity] Full error context:', error);
            return [];
        }
    },

    /**
     * Calculate current and longest streak
     */
    async calculateStreak(userId: string): Promise<StreakData> {
        try {
            console.log(`[StreakDebug] Starting calculation for user: ${userId}`);

            // UTILITIES
            const parseSafeDate = (dateStr: string | null) => {
                if (!dateStr) return new Date(); // Return current date if string is null/empty
                // Handle "2026-01-01 06:00:00+00" -> "2026-01-01T06:00:00+00"
                const isoStr = dateStr.includes(' ') && !dateStr.includes('T')
                    ? dateStr.replace(' ', 'T')
                    : dateStr;
                return new Date(isoStr);
            };

            const getLocalDateString = (date: Date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            // 1. Fetch official profile data
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('streak_count, last_activity_date')
                .eq('id', userId)
                .maybeSingle(); // Changed to maybeSingle as per instruction

            if (profileError) console.error('[StreakDebug] Profile fetch error:', profileError);
            console.log(`[StreakDebug] Raw Profile Data:`, profile);

            // 2. Fetch session history
            const { data: sessions, error: sessionError } = await supabase
                .from('interview_sessions')
                .select('created_at')
                .eq('user_id', userId); // Removed order as uniqueDates will handle sorting

            if (sessionError) console.error('[StreakDebug] Sessions fetch error:', sessionError);
            console.log(`[StreakDebug] Sessions found: ${sessions?.length || 0}`);

            const now = new Date();
            const todayStr = getLocalDateString(now);
            const yesterdayDate = new Date(now);
            yesterdayDate.setDate(now.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterdayDate);

            console.log(`[StreakDebug] Reference - Today: ${todayStr}, Yesterday: ${yesterdayStr}`);

            let currentStreak = 0;
            let longestFromHistory = 0;

            // 3. Current Streak Logic (Priority: Profile)
            if (profile) {
                const profileLastActivityDate = profile.last_activity_date ? parseSafeDate(profile.last_activity_date) : null;
                const profileLastDay = profileLastActivityDate ? getLocalDateString(profileLastActivityDate) : null;
                console.log(`[StreakDebug] Profile Last Activity Date (Raw): ${profile?.last_activity_date}, Parsed Day: ${profileLastDay}`);

                if (profileLastDay === todayStr || profileLastDay === yesterdayStr) {
                    currentStreak = profile.streak_count || 0;
                    console.log(`[StreakDebug] Current Streak validated from Profile: ${currentStreak}`);
                } else {
                    console.log(`[StreakDebug] Profile streak not active for today/yesterday. Profile last day: ${profileLastDay}`);
                }
            }

            // 4. Verification/Fallback Logic (Sessions)
            if (sessions && sessions.length > 0) {
                const uniqueDates = Array.from(new Set(
                    sessions.map(s => getLocalDateString(parseSafeDate(s.created_at)))
                )).sort((a, b) => b.localeCompare(a)); // Sort descending for current streak calculation

                console.log(`[StreakDebug] Unique Session Dates (most recent 5):`, uniqueDates.slice(0, 5));

                const mostRecentSessionDate = uniqueDates[0];

                // If profile failed or currentStreak is 0, but sessions exist and are recent
                if (currentStreak === 0 && (mostRecentSessionDate === todayStr || mostRecentSessionDate === yesterdayStr)) {
                    currentStreak = 1;
                    let checkDate = parseSafeDate(mostRecentSessionDate); // Use parseSafeDate for consistency
                    for (let i = 1; i < uniqueDates.length; i++) {
                        const expected = new Date(checkDate);
                        expected.setDate(expected.getDate() - 1);
                        const expectedStr = getLocalDateString(expected);

                        if (uniqueDates[i] === expectedStr) {
                            currentStreak++;
                            checkDate = expected;
                        } else break;
                    }
                    console.log(`[StreakDebug] Current Streak recalculated from Sessions: ${currentStreak}`);
                } else if (currentStreak === 0) {
                    console.log(`[StreakDebug] No active streak found from sessions (most recent: ${mostRecentSessionDate}).`);
                }

                // 5. Calculate Longest Streak from full history
                const chronDates = [...uniqueDates].sort((a, b) => a.localeCompare(b)); // Sort ascending for longest streak
                let temp = 1;
                longestFromHistory = 1; // Initialize to 1 because a single session counts as a streak of 1
                if (chronDates.length === 0) longestFromHistory = 0; // No sessions, no streak

                for (let i = 1; i < chronDates.length; i++) {
                    const c = parseSafeDate(chronDates[i]);
                    const p = parseSafeDate(chronDates[i - 1]);
                    // Calculate difference in days
                    const diffTime = Math.abs(c.getTime() - p.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        temp++;
                        longestFromHistory = Math.max(longestFromHistory, temp);
                    } else {
                        temp = 1;
                    }
                }
                console.log(`[StreakDebug] Longest streak calculated from sessions: ${longestFromHistory}`);
            }

            const finalLongest = Math.max(profile?.streak_count || 0, longestFromHistory, currentStreak);
            console.log(`[StreakDebug] Final Values -> Current: ${currentStreak}, Longest: ${finalLongest}`);

            return { currentStreak, longestStreak: finalLongest };
        } catch (error) {
            console.error('[StreakDebug] Critical error in streak calculation:', error);
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
