import { supabase, publicSupabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";
import { subscriptionService } from "./subscription.service";
import { badgeService } from "./badge.service";
import { INTERVIEW_CONFIG } from "@/config/interview-config";

// Types for interview sessions are handled by Supabase types
export type InterviewSession = Tables<"interview_sessions">;
export type InterviewSessionInsert = TablesInsert<"interview_sessions">;
export type InterviewSessionUpdate = TablesUpdate<"interview_sessions">;

export interface InterviewSessionFrontendUpdate {
    status?: string;
    score?: number;
    durationSeconds?: number;
    totalHintsUsed?: number;
    averagePerformanceScore?: number;
    feedback?: Json;
    transcript?: Json;
    config?: Json;
}

export interface CreateSessionConfig {
    userId: string;
    interviewType: string;
    position: string;
    difficulty?: string;
    jobDescription?: string;
    config?: Json;
}

export interface CompleteSessionData {
    score?: number;
    feedback?: Json;
    transcript?: Json;
    durationSeconds?: number;
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
            // 1. Existing in-progress sessions are now kept so they can be resumed from the dashboard
            /* 
            const inProgress = await this.getInProgressSessions(config.userId);
            for (const oldSession of inProgress) {
                await this.abandonSession(oldSession.id);
            }
            */

            const sessionData: InterviewSessionInsert = {
                user_id: config.userId,
                interview_type: config.interviewType,
                position: config.position,
                difficulty: config.difficulty || (config.config as Record<string, unknown>)?.difficulty as string | undefined || "Intermediate",
                status: "in_progress",
                config: {
                    ...(config.config as Record<string, unknown> || {}),
                    jobDescription: config.jobDescription || (config.config as Record<string, unknown>)?.jobDescription as string | undefined || null,
                } as Json,
                created_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from("interview_sessions")
                .insert(sessionData)
                .select()
                .single();

            if (error) {
                // If unique constraint still fails (unlikely after manual abandon), handle it
                if (error.code === '23505') {
                    console.error("❌ Unique constraint violation after auto-abandon.");
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error("Error creating interview session:", error);
            return null;
        }
    },

    /**
     * Internal status transition validator
     */
    async canTransitionTo(sessionId: string, newStatus: string): Promise<boolean> {
        const session = await this.getSessionById(sessionId);
        if (!session) return false;

        const currentStatus = session.status;
        if (currentStatus === newStatus) return true;

        const allowed = INTERVIEW_CONFIG.VALID_TRANSITIONS[currentStatus] || [];
        const isAllowed = allowed.includes(newStatus);

        if (!isAllowed) {
            console.error(`❌ Invalid status transition: ${currentStatus} -> ${newStatus} for session ${sessionId}`);
        }

        return isAllowed;
    },

    /**
     * Update interview session (for ongoing changes like transcript updates)
     */
    async updateSession(sessionId: string, updates: InterviewSessionFrontendUpdate): Promise<InterviewSession | null> {
        try {
            // Fetch session to get user_id for trigger compatibility
            const session = await this.getSessionById(sessionId);
            if (!session) return null;

            // If status is being updated, validate the transition
            if (updates.status) {
                const allowed = await this.canTransitionTo(sessionId, updates.status);
                if (!allowed) return null;
            }

            // Explicitly map allowed updates to snake_case
            const mappedUpdates: InterviewSessionUpdate = {};
            if (updates.status) mappedUpdates.status = updates.status;
            if (updates.score !== undefined) mappedUpdates.score = updates.score;
            if (updates.durationSeconds !== undefined) {
                // Increment duration instead of overwriting
                mappedUpdates.duration_seconds = (session.duration_seconds || 0) + updates.durationSeconds;

                // Track usage in user subscription
                if (updates.durationSeconds > 0) {
                    try {
                        await subscriptionService.trackUsage(session.user_id, updates.durationSeconds);
                    } catch (usageError) {
                        console.error("❌ Error tracking usage in updateSession:", usageError);
                    }
                }
            }
            if (updates.totalHintsUsed !== undefined) mappedUpdates.total_hints_used = updates.totalHintsUsed;
            if (updates.averagePerformanceScore !== undefined) mappedUpdates.average_performance_score = updates.averagePerformanceScore;
            if (updates.feedback !== undefined) mappedUpdates.feedback = updates.feedback;
            if (updates.transcript !== undefined) mappedUpdates.transcript = updates.transcript;
            if (updates.config !== undefined) mappedUpdates.config = updates.config;

            // Logic for existing in_progress session auto-abandon relies on user_id
            // providing it here ensures any triggers that check ownership during update pass
            const { data, error } = await supabase
                .from("interview_sessions")
                .update(mappedUpdates)
                .eq("id", sessionId)
                .select();

            if (error) {
                console.error("❌ [updateSession] Supabase error:", error);
                throw error;
            }
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error("Error updating interview session:", error);
            return null;
        }
    },

    /**
     * Complete an interview session with final results
     * CRITICAL: Tracks usage BEFORE marking session as completed to prevent revenue leak
     */
    async completeSession(sessionId: string, completionData: CompleteSessionData, client = supabase): Promise<InterviewSession | null> {
        try {
            // 1. Fetch current session to ensure it exists and get user_id
            const session = await this.getSessionById(sessionId, client);
            if (!session) {
                console.error("❌ [completeSession] Session not found:", sessionId);
                return null;
            }

            const {
                durationSeconds,
                totalHintsUsed,
                averagePerformanceScore,
                ...otherData
            } = completionData;

            // 2. CRITICAL: Track usage FIRST before marking session as completed
            // This prevents revenue leak where session is completed but user isn't charged
            if (durationSeconds !== undefined && durationSeconds > 0) {
                try {
                    const usageTracked = await subscriptionService.trackUsage(session.user_id, durationSeconds, client);

                    if (!usageTracked) {
                        console.error("❌ [completeSession] Failed to track usage - ABORTING session completion to prevent revenue leak");
                        throw new Error("Usage tracking failed - cannot complete session");
                    }
                } catch (usageError) {
                    console.error("❌ [completeSession] CRITICAL: Usage tracking failed:", usageError);
                    // Re-throw to prevent session completion
                    throw new Error(`Cannot complete session - usage tracking failed: ${usageError instanceof Error ? usageError.message : String(usageError)}`);
                }
            }

            // 3. Prepare update data explicitly with snake_case columns
            const updateData: InterviewSessionUpdate = {
                status: INTERVIEW_CONFIG.STATUS.COMPLETED,
                completed_at: new Date().toISOString(),
            };

            // Map frontend camelCase to backend snake_case carefully
            // Accumulate duration instead of overwriting to handle resumed sessions correctly
            if (durationSeconds !== undefined) {
                updateData.duration_seconds = (session.duration_seconds || 0) + durationSeconds;
            }
            if (totalHintsUsed !== undefined) updateData.total_hints_used = totalHintsUsed;
            if (averagePerformanceScore !== undefined) updateData.average_performance_score = averagePerformanceScore;

            // Map other common fields if present in otherData
            if (otherData.score !== undefined) updateData.score = otherData.score;
            if (otherData.feedback !== undefined) updateData.feedback = otherData.feedback;
            if (otherData.transcript !== undefined) updateData.transcript = otherData.transcript;

            // 4. Now mark session as completed (usage already tracked)
            const { data, error } = await client
                .from("interview_sessions")
                .update(updateData)
                .eq("id", sessionId)
                .select();

            if (error) {
                console.error("❌ [completeSession] Supabase error:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn("⚠️ [completeSession] No row updated.");
                return null;
            }

            const updatedSession = data[0];

            // 5. Check and award badges after completion (non-critical, can fail)
            try {
                await badgeService.checkAndAwardBadges(updatedSession.user_id, client);
            } catch (badgeError) {
                console.error("Error checking badges after completion:", badgeError);
                // Don't fail the whole operation if badge awarding fails
            }

            return updatedSession;
        } catch (error) {
            console.error("❌ [completeSession] Error completing interview session:", error);
            return null;
        }
    },

    /**
     * Get interview session by ID
     */
    async getSessionById(sessionId: string, client = supabase): Promise<InterviewSession | null> {
        try {
            const { data, error } = await client
                .from("interview_sessions")
                .select("*")
                .eq("id", sessionId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching interview session:", error instanceof Error ? error.message : error);
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
            // Fetch session to get user_id
            const session = await this.getSessionById(sessionId);
            if (!session) return null;

            // Validate transition
            const allowed = await this.canTransitionTo(sessionId, INTERVIEW_CONFIG.STATUS.COMPLETED);
            if (!allowed) return null;

            const { data, error } = await supabase
                .from("interview_sessions")
                .update({
                    user_id: session.user_id,
                    status: INTERVIEW_CONFIG.STATUS.COMPLETED,
                    completed_at: new Date().toISOString(),
                    feedback: {
                        note: "Session abandoned - User started a new interview"
                    }
                })
                .eq("id", sessionId)
                .select();

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
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
                .select("status, score, duration_seconds")
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
            stats.totalDuration = data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

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
        userId: string,
        entry: {
            role: "user" | "assistant";
            speaker?: string; // Legacy support
            text: string;
            timestamp: number;
        }
    ): Promise<boolean> {
        try {
            // Use the atomic RPC to append to transcript
            const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }> }).rpc('append_transcript_entry', {
                p_session_id: sessionId,
                p_user_id: userId,
                p_entry: entry as unknown as Record<string, unknown>
            });

            if (error) throw error;
            return true;
        } catch (error: unknown) {
            // Silence aborted requests during unmount
            if (error && typeof error === 'object' && ('name' in error && error.name === 'AbortError' || 'message' in error && (error.message === 'Fetch is aborted' || (error.message as string).includes('aborted')))) {
                return false;
            }
            console.error("Error adding transcript entry:", error instanceof Error ? error.message : error);
            return false;
        }
    },

    /**
     * Get transcripts for a session
     */
    async getTranscripts(sessionId: string, client = supabase): Promise<Array<{
        speaker: "user" | "ai";
        text: string;
        timestamp: number;
    }> | null> {
        try {
            const session = await this.getSessionById(sessionId, client);
            if (!session) return null;

            // Return transcript array or empty array
            const transcript = session.transcript;
            return Array.isArray(transcript) ? (transcript as unknown as Array<{
                speaker: "user" | "ai";
                text: string;
                timestamp: number;
            }>) : [];
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
                    const transcripts = (session.transcript as unknown[]) || [];

                    if (transcripts.length > 0) {
                        // Complete the session and generate feedback
                        const durationSeconds = session.duration_seconds || 600; // Default 10 mins in seconds

                        await this.completeSession(session.id, {
                            durationSeconds,
                            transcript: transcripts as unknown as Json
                        });

                        // Try to generate feedback
                        await this.generateFeedbackForSession(session.id);
                        result.fixed++;
                    } else {
                        // Complete session without feedback if no transcripts
                        await this.completeSession(session.id, {
                            durationSeconds: 60,
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
        feedback: Json;
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
    async getSessionConfig(sessionId: string): Promise<Record<string, unknown> | null> {
        try {
            const { data, error } = await supabase
                .from('interview_sessions')
                .select('config')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return (data?.config as Record<string, unknown>) || null;
        } catch (error) {
            console.error("Error fetching session config:", error);
            return null;
        }
    },

    /**
     * Get the count of transcripts in a session
     */
    async getTranscriptCount(sessionId: string): Promise<number> {
        try {
            const transcripts = await this.getTranscripts(sessionId);
            return Array.isArray(transcripts) ? transcripts.length : 0;
        } catch (error) {
            console.error("Error getting transcript count:", error);
            return 0;
        }
    },

    /**
     * Get the count of user turns in a transcript
     */
    async getUserTurnCount(sessionId: string, client = supabase): Promise<number> {
        try {
            const transcripts = await this.getTranscripts(sessionId, client);
            if (!Array.isArray(transcripts)) return 0;

            return transcripts.filter((t: { role?: string; speaker?: string; sender?: string }) =>
                (t.role === 'user' || t.speaker === 'user' || t.sender === 'user')
            ).length;
        } catch (error) {
            console.error("Error getting user turn count:", error);
            return 0;
        }
    },

    /**
     * Generate session feedback (Isolated Version)
     */
    async generateSessionFeedback(
        sessionId: string,
        onProgress?: (progress: number, statusText: string) => void,
        client = supabase
    ): Promise<boolean> {
        try {
            if (onProgress) onProgress(10, "Fetching session data...");
            const session = await this.getSessionById(sessionId, client);
            if (!session || session.status !== 'completed') {
                return false;
            }

            const transcripts = await this.getTranscripts(sessionId, client);
            if (!transcripts || transcripts.length === 0) {
                console.error("No transcript found for session.");
                return false;
            }

            if (onProgress) onProgress(30, "Analyzing interview content...");
            const { generateFeedback } = await import('@/lib/gemini-feedback');

            const { data: profile } = await client
                .from('profiles')
                .select('resume_content')
                .eq('id', session.user_id)
                .single();

            const sessionData: {
                id: string;
                interview_type: string;
                position: string;
                config: Record<string, unknown>;
                resumeContent: string | null;
            } = {
                id: sessionId,
                interview_type: session.interview_type,
                position: session.position,
                config: (session.config as unknown as Record<string, unknown>) || {},
                resumeContent: (profile?.resume_content as string) || null
            };

            const feedback = await generateFeedback(transcripts, sessionData);
            if (onProgress) onProgress(80, "Finalizing report...");

            const score = Math.round(
                (feedback.overallSkills.reduce((sum, s) => sum + s.score, 0) / (feedback.overallSkills.length || 1))
            );

            const updatedFeedback = {
                overall: {
                    ...feedback,
                    score,
                    generatedAt: new Date().toISOString(),
                },
                feedbackVer: "2.0"
            };

            await this.updateSession(sessionId, {
                feedback: updatedFeedback as Json,
                score,
            });

            if (onProgress) onProgress(100, "Report complete.");
            return true;
        } catch (error) {
            console.error("Error generating feedback:", error);
            return false;
        }
    },

    /**
     * Get safe statistics for a public profile
     */
    async getPublicSessionStats(userId: string): Promise<{
        completedCount: number;
        averageScore: number;
        totalDurationMinutes: number;
    }> {
        try {
            const { data, error } = await publicSupabase!
                .from("interview_sessions")
                .select("score, duration_seconds")
                .eq("user_id", userId)
                .eq("status", "completed");

            if (error) throw error;

            const completedCount = data.length;
            let averageScore = 0;
            let totalDurationSeconds = 0;

            if (completedCount > 0) {
                const totalScore = data.reduce((sum, s) => sum + (s.score || 0), 0);
                averageScore = Math.round(totalScore / completedCount);
                totalDurationSeconds = data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
            }

            return {
                completedCount,
                averageScore,
                totalDurationMinutes: Math.round(totalDurationSeconds / 60),
            };
        } catch (error) {
            console.error("Error fetching public session stats:", error);
            return { completedCount: 0, averageScore: 0, totalDurationMinutes: 0 };
        }
    },

    /**
     * Get safe recent interviews for a public profile
     */
    async getPublicRecentInterviews(userId: string, limit: number = 5): Promise<unknown[]> {
        try {
            const { data, error } = await publicSupabase!
                .from("interview_sessions")
                .select("position, interview_type, score, completed_at, difficulty")
                .eq("user_id", userId)
                .eq("status", "completed")
                .order("completed_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching public recent interviews:", error);
            return [];
        }
    }
};
