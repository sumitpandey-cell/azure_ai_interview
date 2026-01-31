import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    rank: number;
    total_interviews: number;
    completed_interviews: number;
    average_score: number;
    total_duration: number;
    last_activity: string | null;
}

/**
 * Leaderboard Service
 * Computes and fetches leaderboard rankings based on user performance
 */
export const leaderboardService = {
    /**
     * Get global leaderboard rankings
     * Uses average score as primary ranking metric, with completed interviews as tiebreaker
     */
    async getGlobalLeaderboard(
        limit: number = 100,
        timeFilter: 'all' | 'monthly' | 'weekly' = 'all'
    ): Promise<LeaderboardEntry[]> {
        try {

            // Calculate date range based on filter
            let startDate: Date | null = null;
            if (timeFilter === 'monthly') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
            } else if (timeFilter === 'weekly') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
            }

            // Using a more detailed query to get comprehensive stats
            let query = supabase
                .from('interview_sessions')
                .select(`
          user_id,
          score,
          status,
          duration_seconds,
          created_at
        `)
                .eq('status', 'completed')
                .not('score', 'is', null);

            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;

            // Group by user and calculate stats
            const userStats = new Map<string, {
                userId: string;
                scores: number[];
                totalInterviews: number;
                totalDuration: number;
                lastActivity: string;
            }>();

            data?.forEach((session) => {
                const userId = session.user_id;
                if (!userStats.has(userId)) {
                    userStats.set(userId, {
                        userId,
                        scores: [],
                        totalInterviews: 0,
                        totalDuration: 0,
                        lastActivity: session.created_at,
                    });
                }

                const stats = userStats.get(userId)!;
                if (session.score !== null) {
                    stats.scores.push(session.score);
                }
                stats.totalInterviews++;
                stats.totalDuration += session.duration_seconds || 0;

                // Update last activity if this session is more recent
                if (new Date(session.created_at) > new Date(stats.lastActivity)) {
                    stats.lastActivity = session.created_at;
                }
            });

            // Get profile data for all users
            const userIds = Array.from(userStats.keys());
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            if (profileError) throw profileError;

            // Create profile map
            const profileMap = new Map(
                profiles?.map(p => [p.id, p]) || []
            );

            // Calculate rankings
            const rankings: LeaderboardEntry[] = [];

            userStats.forEach((stats, userId) => {
                const profile = profileMap.get(userId);
                const averageScore = stats.scores.length > 0
                    ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
                    : 0;

                rankings.push({
                    user_id: userId,
                    full_name: profile?.full_name || null,
                    avatar_url: profile?.avatar_url || null,
                    rank: 0, // Will be set after sorting
                    total_interviews: stats.totalInterviews,
                    completed_interviews: stats.totalInterviews,
                    average_score: averageScore,
                    total_duration: stats.totalDuration,
                    last_activity: stats.lastActivity,
                });
            });

            // Sort by average score (desc), then by completed interviews (desc)
            rankings.sort((a, b) => {
                if (b.average_score !== a.average_score) {
                    return b.average_score - a.average_score;
                }
                return b.completed_interviews - a.completed_interviews;
            });

            // Assign ranks
            rankings.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            return rankings.slice(0, limit);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    /**
     * Get a specific user's rank
     */
    async getUserRank(userId: string): Promise<number | null> {
        try {
            // Get all rankings (could be optimized with a more efficient query)
            const rankings = await this.getGlobalLeaderboard(1000);
            const userEntry = rankings.find(entry => entry.user_id === userId);
            return userEntry?.rank || null;
        } catch (error) {
            console.error('Error fetching user rank:', error);
            return null;
        }
    },

    /**
     * Get leaderboard entry for a specific user
     */
    async getUserLeaderboardEntry(userId: string): Promise<LeaderboardEntry | null> {
        try {
            const rankings = await this.getGlobalLeaderboard(1000);
            return rankings.find(entry => entry.user_id === userId) || null;
        } catch (error) {
            console.error('Error fetching user leaderboard entry:', error);
            return null;
        }
    },
};
