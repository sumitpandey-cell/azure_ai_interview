import { supabase, publicSupabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { subscriptionService } from "./subscription.service";
import { badgeService } from "./badge.service";

export type InterviewSession = Tables<"interview_sessions">;
export type InterviewSessionInsert = TablesInsert<"interview_sessions">;
export type InterviewSessionUpdate = TablesUpdate<"interview_sessions">;

export type InterviewResumption = Tables<"interview_resumptions">;
export type InterviewResumptionInsert = TablesInsert<"interview_resumptions">;
export type InterviewResumptionUpdate = TablesUpdate<"interview_resumptions">;

export interface CreateSessionConfig {
    userId: string;
    interviewType: string;
    position: string;
    difficulty?: string;
    jobDescription?: string;
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
            const sessionData: any = {
                user_id: config.userId,
                interview_type: config.interviewType,
                position: config.position,
                difficulty: config.difficulty || config.config?.difficulty || "Intermediate",
                job_description: config.jobDescription || config.config?.jobDescription || null,
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
                ...otherData,
            };

            // Only include duration_seconds if explicitly provided
            if (durationMinutes !== undefined) {
                updateData.duration_seconds = durationMinutes;
            }

            const { data, error } = await supabase
                .from("interview_sessions")
                .update(updateData)
                .eq("id", sessionId)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Interview session completed:", sessionId);

            // Check and award badges after completion
            try {
                await badgeService.checkAndAwardBadges(data.user_id);
            } catch (badgeError) {
                console.error("Error checking badges after completion:", badgeError);
            }

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
                        const durationMinutes = session.duration_seconds || 10; // Default duration in seconds

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

    // ==========================================
    // Interview Resumption Tracking Methods
    // ==========================================

    /**
     * Create a new resumption record when interview starts or resumes
     */
    async createResumption(sessionId: string, startTranscriptIndex: number = 0): Promise<InterviewResumption | null> {
        try {
            const resumptionData: InterviewResumptionInsert = {
                interview_session_id: sessionId,
                resumed_at: new Date().toISOString(),
                start_transcript_index: startTranscriptIndex,
            };

            const { data, error } = await supabase
                .from("interview_resumptions")
                .insert(resumptionData)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Interview resumption created:", data.id);
            return data;
        } catch (error) {
            console.error("Error creating interview resumption:", error);
            return null;
        }
    },

    /**
     * Create a completed resumption record (used when disconnection occurs)
     * This is the new method that creates a resumption with all data at once
     */
    async createCompletedResumption(
        sessionId: string,
        data: {
            resumed_at: string;
            ended_at: string;
            start_transcript_index: number;
            end_transcript_index: number;
            duration_seconds: number;
        }
    ): Promise<InterviewResumption | null> {
        try {
            const resumptionData: InterviewResumptionInsert = {
                interview_session_id: sessionId,
                resumed_at: data.resumed_at,
                ended_at: data.ended_at,
                start_transcript_index: data.start_transcript_index,
                end_transcript_index: data.end_transcript_index,
                duration_seconds: data.duration_seconds,
            };

            const { data: result, error } = await supabase
                .from("interview_resumptions")
                .insert(resumptionData)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Completed resumption record created:", result.id, "Duration:", data.duration_seconds, "seconds");
            return result;
        } catch (error) {
            console.error("Error creating completed resumption:", error);
            return null;
        }
    },

    /**
     * End the current active resumption
     */
    async endCurrentResumption(sessionId: string, endTranscriptIndex: number): Promise<InterviewResumption | null> {
        try {
            // Get the active resumption (one without ended_at)
            const { data: activeResumptions, error: fetchError } = await supabase
                .from("interview_resumptions")
                .select("*")
                .eq("interview_session_id", sessionId)
                .is("ended_at", null)
                .order("resumed_at", { ascending: false })
                .limit(1);

            if (fetchError) throw fetchError;

            if (!activeResumptions || activeResumptions.length === 0) {
                console.warn("No active resumption found for session:", sessionId);
                return null;
            }

            const activeResumption = activeResumptions[0];
            const endedAt = new Date();
            const resumedAt = new Date(activeResumption.resumed_at);

            // Calculate duration in seconds (rounded)
            const durationMs = endedAt.getTime() - resumedAt.getTime();
            const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

            // Update the resumption with end time, transcript index, and duration
            const { data, error } = await supabase
                .from("interview_resumptions")
                .update({
                    ended_at: endedAt.toISOString(),
                    end_transcript_index: endTranscriptIndex,
                    duration_seconds: durationSeconds,
                })
                .eq("id", activeResumption.id)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Interview resumption ended:", data.id, "Duration:", durationSeconds, "seconds");

            // Update the total duration in the interview_sessions table
            const session = await this.getSessionById(sessionId);
            if (session) {
                const newTotalDuration = (session.duration_seconds || 0) + durationSeconds;
                await this.updateSession(sessionId, {
                    duration_seconds: newTotalDuration
                });
                console.log("✓ Session total duration updated:", newTotalDuration, "seconds");

                // Track usage in subscription
                await subscriptionService.trackUsage(session.user_id, durationSeconds);
            }

            return data;
        } catch (error) {
            console.error("Error ending interview resumption:", error);
            return null;
        }
    },

    /**
     * Get all resumptions for a session
     */
    async getResumptionHistory(sessionId: string): Promise<InterviewResumption[]> {
        try {
            const { data, error } = await supabase
                .from("interview_resumptions")
                .select("*")
                .eq("interview_session_id", sessionId)
                .order("resumed_at", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching resumption history:", error);
            return [];
        }
    },

    /**
     * Get the current active resumption (not ended)
     */
    async getCurrentResumption(sessionId: string): Promise<InterviewResumption | null> {
        try {
            const { data, error } = await supabase
                .from("interview_resumptions")
                .select("*")
                .eq("interview_session_id", sessionId)
                .is("ended_at", null)
                .order("resumed_at", { ascending: false })
                .limit(1)
                .single();

            if (error) {
                // If no rows found, that's okay - return null
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return data;
        } catch (error) {
            console.error("Error fetching current resumption:", error);
            return null;
        }
    },

    /**
     * Get transcript count for a session
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
     * Get a slice of the transcript array
     */
    async getTranscriptSlice(sessionId: string, startIndex: number, endIndex: number): Promise<any[]> {
        try {
            const transcripts = await this.getTranscripts(sessionId);
            if (!Array.isArray(transcripts)) return [];

            return transcripts.slice(startIndex, endIndex);
        } catch (error) {
            console.error("Error getting transcript slice:", error);
            return [];
        }
    },

    /**
     * Get the count of user turns in a transcript
     */
    async getUserTurnCount(sessionId: string): Promise<number> {
        try {
            const transcripts = await this.getTranscripts(sessionId);
            if (!Array.isArray(transcripts)) return 0;

            return transcripts.filter((t: any) => t.speaker === 'user' || t.role === 'user').length;
        } catch (error) {
            console.error("Error getting user turn count:", error);
            return 0;
        }
    },

    /**
     * Generate feedback for all resumptions (called only at interview completion)
     */
    async generateAllResumptionFeedback(sessionId: string): Promise<boolean> {
        try {
            // Get session and resumptions
            const session = await this.getSessionById(sessionId);
            if (!session || session.status !== 'completed') {
                console.log("Session must be completed to generate resumption feedback");
                return false;
            }

            let resumptions = await this.getResumptionHistory(sessionId);
            if (resumptions.length === 0) {
                console.log("⚠️ No resumptions found for session:", sessionId, "- falling back to full session transcript");
                const transcriptCount = await this.getTranscriptCount(sessionId);

                if (transcriptCount === 0) {
                    console.error("❌ No transcript found for session. Cannot generate feedback.");
                    return false;
                }

                // Create a virtual resumption for the entire session
                resumptions = [{
                    id: 'full-session-resumption',
                    interview_session_id: sessionId,
                    start_transcript_index: 0,
                    end_transcript_index: transcriptCount,
                    resumed_at: session.created_at,
                    ended_at: session.completed_at || new Date().toISOString(),
                    duration_seconds: session.duration_seconds || 0,
                } as any];
            }

            console.log(`🤖 Processing feedback for ${resumptions.length} conversation segment(s)`);

            // Generate feedback for each resumption
            const resumptionFeedbacks = [];

            for (let i = 0; i < resumptions.length; i++) {
                const resumption = resumptions[i];
                const startIndex = resumption.start_transcript_index;
                const endIndex = resumption.end_transcript_index || await this.getTranscriptCount(sessionId);

                // Get transcript slice for this resumption
                const transcriptSlice = await this.getTranscriptSlice(sessionId, startIndex, endIndex);

                if (transcriptSlice.length > 0) {
                    // Call Gemini API to generate feedback for this specific session
                    // For now, we'll import the feedback generator
                    const { generateFeedback } = await import('@/lib/gemini-feedback');

                    const sessionData = {
                        id: sessionId,
                        interview_type: session.interview_type,
                        position: session.position,
                        config: (session.config as any) || {},
                    };

                    const feedback = await generateFeedback(transcriptSlice, sessionData);

                    resumptionFeedbacks.push({
                        resumption_id: resumption.id,
                        session_number: i + 1,
                        score: Math.round(
                            (feedback.overallSkills.reduce((sum, s) => sum + s.score, 0) / feedback.overallSkills.length)
                        ),
                        executiveSummary: feedback.executiveSummary,
                        strengths: feedback.strengths,
                        improvements: feedback.improvements,
                        overallSkills: feedback.overallSkills,
                        technicalSkills: feedback.technicalSkills,
                    });
                }
            }

            // Calculate overall session score (average of resumption scores)
            let sessionScore = 0;
            if (resumptionFeedbacks.length > 0) {
                const totalScore = resumptionFeedbacks.reduce((sum, r) => sum + (r.score || 0), 0);
                sessionScore = Math.round(totalScore / resumptionFeedbacks.length);
            }

            // Simplified feedback structure:
            // If only 1 resumption (most common case), store feedback directly at root
            // If multiple resumptions, use the complex structure with overall + resumptions
            let updatedFeedback: any;

            if (resumptionFeedbacks.length === 1) {
                // Single resumption - flatten structure (simple and clean)
                const feedback = resumptionFeedbacks[0];
                updatedFeedback = {
                    score: feedback.score,
                    executiveSummary: feedback.executiveSummary,
                    strengths: feedback.strengths,
                    improvements: feedback.improvements,
                    overallSkills: feedback.overallSkills,
                    technicalSkills: feedback.technicalSkills,
                    generatedAt: new Date().toISOString(),
                };
            } else {
                // Multiple resumptions - use nested structure
                updatedFeedback = {
                    overall: {
                        score: sessionScore,
                        generatedAt: new Date().toISOString(),
                    },
                    resumptions: resumptionFeedbacks,
                };
            }

            await this.updateSession(sessionId, {
                feedback: updatedFeedback as any,
                score: sessionScore, // Save the calculated score
            });

            console.log(`✅ Generated feedback for ${resumptionFeedbacks.length} resumptions`);
            return true;
        } catch (error) {
            console.error("Error generating resumption feedback:", error);
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
    async getPublicRecentInterviews(userId: string, limit: number = 5): Promise<any[]> {
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
