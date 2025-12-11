import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type InterviewSession = Tables<"interview_sessions">;
export type InterviewSessionInsert = TablesInsert<"interview_sessions">;
export type InterviewSessionUpdate = TablesUpdate<"interview_sessions">;

export interface CreateSessionConfig {
    userId: string;
    interviewType: string;
    position: string;
    config?: any;
}

export interface CompleteSessionData {
    score?: number;
    feedback?: any;
    transcript?: any;
    durationMinutes?: number;
    totalHintsUsed?: number;
    averagePerformanceScore?: number;
}

/**
 * Interview Session Service
 * Handles interview session lifecycle and persistence
 */
export const interviewService = {
    /**
     * Create a new interview session
     */
    async createSession(config: CreateSessionConfig): Promise<InterviewSession | null> {
        try {
            const sessionData: InterviewSessionInsert = {
                user_id: config.userId,
                interview_type: config.interviewType,
                position: config.position,
                status: "in_progress",
                config: config.config || {},
                created_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from("interview_sessions")
                .insert(sessionData)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Interview session created:", data.id);
            return data;
        } catch (error) {
            console.error("Error creating interview session:", error);
            return null;
        }
    },

    /**
     * Update interview session (for ongoing changes like transcript updates)
     */
    async updateSession(sessionId: string, updates: InterviewSessionUpdate): Promise<InterviewSession | null> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .update(updates)
                .eq("id", sessionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error updating interview session:", error);
            return null;
        }
    },

    /**
     * Complete an interview session with final results
     */
    async completeSession(sessionId: string, completionData: CompleteSessionData): Promise<InterviewSession | null> {
        try {
            const { durationMinutes, ...otherData } = completionData;

            const updateData: InterviewSessionUpdate = {
                status: "completed",
                completed_at: new Date().toISOString(),
                duration_minutes: durationMinutes,
                ...otherData,
            };

            const { data, error } = await supabase
                .from("interview_sessions")
                .update(updateData)
                .eq("id", sessionId)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Interview session completed:", sessionId);
            return data;
        } catch (error) {
            console.error("Error completing interview session:", error);
            return null;
        }
    },

    /**
     * Get interview session by ID
     */
    async getSessionById(sessionId: string): Promise<InterviewSession | null> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("id", sessionId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching interview session:", error);
            return null;
        }
    },

    /**
     * Get user's interview session history
     */
    async getSessionHistory(
        userId: string,
        limit: number = 10,
        offset: number = 0
    ): Promise<InterviewSession[]> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching session history:", error);
            return [];
        }
    },

    /**
     * Get user's in-progress sessions
     * Used to check if user has incomplete interviews before starting a new one
     */
    async getInProgressSessions(userId: string): Promise<InterviewSession[]> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "in_progress")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching in-progress sessions:", error);
            return [];
        }
    },

    /**
     * Abandon an in-progress session
     * Marks the session as completed with an abandonment note
     */
    async abandonSession(sessionId: string): Promise<InterviewSession | null> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .update({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    feedback: {
                        note: "Session abandoned - User started a new interview"
                    }
                })
                .eq("id", sessionId)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Session abandoned:", sessionId);
            return data;
        } catch (error) {
            console.error("Error abandoning session:", error);
            return null;
        }
    },

    /**
     * Get user's session statistics
     */
    async getSessionStats(userId: string): Promise<{
        total: number;
        completed: number;
        inProgress: number;
        averageScore: number;
        totalDuration: number;
    }> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("status, score, duration_minutes")
                .eq("user_id", userId);

            if (error) throw error;

            const stats = {
                total: data.length,
                completed: data.filter(s => s.status === "completed").length,
                inProgress: data.filter(s => s.status === "in_progress").length,
                averageScore: 0,
                totalDuration: 0,
            };

            // Calculate averageScore (only from completed sessions with scores)
            const scoredSessions = data.filter(s => s.status === "completed" && s.score !== null);
            if (scoredSessions.length > 0) {
                const totalScore = scoredSessions.reduce((sum, s) => sum + (s.score || 0), 0);
                stats.averageScore = Math.round(totalScore / scoredSessions.length);
            }

            // Calculate total duration
            stats.totalDuration = data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

            return stats;
        } catch (error) {
            console.error("Error fetching session stats:", error);
            return {
                total: 0,
                completed: 0,
                inProgress: 0,
                averageScore: 0,
                totalDuration: 0,
            };
        }
    },

    /**
     * Add transcript entry to session (for real-time updates)
     */
    async addTranscriptEntry(
        sessionId: string,
        entry: { speaker: "user" | "ai"; text: string; timestamp: number }
    ): Promise<boolean> {
        try {
            // Get current session
            const session = await this.getSessionById(sessionId);
            if (!session) return false;

            // Get existing transcript or initialize empty array
            const currentTranscript = (session.transcript as any[]) || [];
            const updatedTranscript = [...currentTranscript, entry];

            // Update session with new transcript
            await this.updateSession(sessionId, {
                transcript: updatedTranscript as any,
            });

            return true;
        } catch (error) {
            console.error("Error adding transcript entry:", error);
            return false;
        }
    },

    /**
     * Get transcripts for a session
     */
    async getTranscripts(sessionId: string): Promise<Array<{
        speaker: "user" | "ai";
        text: string;
        timestamp: number;
    }> | null> {
        try {
            const session = await this.getSessionById(sessionId);
            if (!session) return null;

            // Return transcript array or empty array
            const transcript = session.transcript as any[];
            return Array.isArray(transcript) ? transcript : [];
        } catch (error) {
            console.error("Error getting transcripts:", error);
            return null;
        }
    },

    /**
     * Generate feedback for a completed session (for fixing stuck sessions)
     */
    async generateFeedbackForSession(sessionId: string): Promise<boolean> {
        try {
            const response = await fetch('/api/generate-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            });

            if (response.ok) {
                console.log("✅ Feedback generated for session:", sessionId);
                return true;
            } else {
                console.error("❌ Failed to generate feedback for session:", sessionId);
                return false;
            }
        } catch (error) {
            console.error("Error generating feedback for session:", error);
            return false;
        }
    },

    /**
     * Fix sessions stuck in 'in_progress' status
     */
    async fixStuckSessions(userId: string): Promise<{ fixed: number; errors: string[] }> {
        try {
            const { data: sessions, error } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "in_progress");

            if (error) throw error;

            const result = { fixed: 0, errors: [] as string[] };

            for (const session of sessions || []) {
                try {
                    // Check if session has transcripts
                    const transcripts = (session.transcript as any[]) || [];

                    if (transcripts.length > 0) {
                        // Complete the session and generate feedback
                        const durationMinutes = session.duration_minutes || 10; // Default duration

                        await this.completeSession(session.id, {
                            durationMinutes,
                            transcript: transcripts
                        });

                        // Try to generate feedback
                        await this.generateFeedbackForSession(session.id);
                        result.fixed++;
                    } else {
                        // Complete session without feedback if no transcripts
                        await this.completeSession(session.id, {
                            durationMinutes: 1,
                            feedback: {
                                note: "No conversation recorded - session completed automatically"
                            }
                        });
                        result.fixed++;
                    }
                } catch (sessionError) {
                    result.errors.push(`Failed to fix session ${session.id}: ${sessionError}`);
                }
            }

            return result;
        } catch (error) {
            console.error("Error fixing stuck sessions:", error);
            return { fixed: 0, errors: [error instanceof Error ? error.message : String(error)] };
        }
    },

    /**
     * Delete interview session (admin only)
     */
    async deleteSession(sessionId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("interview_sessions")
                .delete()
                .eq("id", sessionId);

            if (error) throw error;
            console.log("✓ Interview session deleted:", sessionId);
            return true;
        } catch (error) {
            console.error("Error deleting interview session:", error);
            return false;
        }
    },

    /**
     * Get all sessions for a specific user
     */
    async getUserSessions(userId: string): Promise<InterviewSession[]> {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq('user_id', userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching user sessions:", error);
            return [];
        }
    },

    /**
     * Calculate user's leaderboard rank using Bayesian scoring
     */
    async calculateUserRank(userId: string): Promise<number> {
        try {
            // Fetch all completed interview sessions with scores
            const { data: allSessions, error } = await supabase
                .from("interview_sessions")
                .select("user_id, score")
                .not("score", "is", null)
                .eq("status", "completed");

            if (error || !allSessions) {
                console.error("Error fetching sessions for rank:", error);
                return 0;
            }

            // Aggregate scores by user
            const userStats: Record<string, { totalScore: number; count: number }> = {};

            allSessions.forEach((session) => {
                if (!userStats[session.user_id]) {
                    userStats[session.user_id] = { totalScore: 0, count: 0 };
                }
                userStats[session.user_id].totalScore += session.score || 0;
                userStats[session.user_id].count += 1;
            });

            // Calculate Weighted Score (avgScore × (1 + log(count) / 10))
            const rankedUsers = Object.entries(userStats).map(([uid, stats]) => {
                const avgScore = stats.totalScore / stats.count;
                const experienceMultiplier = 1 + (Math.log10(stats.count) / 10);
                const weightedScore = avgScore * experienceMultiplier;

                return { userId: uid, weightedScore };
            });

            // Sort by Weighted Score (descending)
            const sortedUsers = rankedUsers.sort((a, b) => b.weightedScore - a.weightedScore);

            // Find current user's rank
            const userRankIndex = sortedUsers.findIndex(u => u.userId === userId);
            return userRankIndex >= 0 ? userRankIndex + 1 : 0;
        } catch (error) {
            console.error("Error calculating user rank:", error);
            return 0;
        }
    },

    /**
     * Get recent performance metrics for a user
     */
    async getRecentPerformanceMetrics(userId: string, limit: number = 3): Promise<{
        id: string;
        position: string;
        interview_type: string;
        completed_at: string | null;
        score: number | null;
        feedback: any;
    }[]> {
        try {
            const { data, error } = await supabase
                .from('interview_sessions')
                .select('id, position, interview_type, completed_at, score, feedback')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .not('feedback', 'is', null)
                .not('score', 'is', null)
                .order('completed_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching recent performance metrics:", error);
            return [];
        }
    },

    /**
     * Get session configuration (for API routes and server-side usage)
     */
    async getSessionConfig(sessionId: string): Promise<Record<string, any> | null> {
        try {
            const { data, error } = await supabase
                .from('interview_sessions')
                .select('config')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return (data?.config as Record<string, any>) || null;
        } catch (error) {
            console.error("Error fetching session config:", error);
            return null;
        }
    },
};
