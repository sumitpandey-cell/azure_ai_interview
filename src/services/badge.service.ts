import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { BADGE_DEFINITIONS } from "@/config/badges";
import { UserBadgeData } from "@/types/badge-types";
import { analyticsService } from "./analytics.service";

export type Badge = Tables<"badges">;
export type UserBadge = Tables<"user_badges">;
export type UserBadgeInsert = TablesInsert<"user_badges">;

/**
 * Badge Service
 * Handles gamification badges
 */
export const badgeService = {
    /**
     * Get all available badges
     */
    async getBadges(): Promise<Badge[]> {
        try {
            const { data, error } = await supabase
                .from("badges")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching badges:", error);
            return [];
        }
    },

    /**
     * Get user's earned badges
     */
    async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
        try {
            const { data, error } = await supabase
                .from("user_badges")
                .select(`
          *,
          badge:badges(*)
        `)
                .eq("user_id", userId)
                .order("awarded_at", { ascending: false });

            if (error) throw error;
            return (data || []) as any;
        } catch (error) {
            console.error("Error fetching user badges:", error);
            return [];
        }
    },

    /**
     * Award a badge to a user
     */
    async awardBadge(userId: string, badgeSlug: string, client = supabase): Promise<(UserBadge & { badge: Badge }) | null> {
        try {

            // First, get the badge details from slug
            const { data: badge, error: badgeError } = await client
                .from("badges")
                .select("*")
                .eq("slug", badgeSlug)
                .maybeSingle();

            if (badgeError) {
                console.error(`[BadgeService] Error finding badge ${badgeSlug}:`, badgeError.message, badgeError.code);
                return null;
            }

            if (!badge) {
                console.error(`[BadgeService] Badge with slug ${badgeSlug} not found. Ensure you ran the SQL seed script.`);
                return null;
            }

            // Check if user already has this badge
            const { data: existing } = await client
                .from("user_badges")
                .select("id")
                .eq("user_id", userId)
                .eq("badge_id", badge.id)
                .maybeSingle();

            if (existing) {
                return null;
            }

            // Award the badge
            const { data, error } = await client
                .from("user_badges")
                .insert({
                    user_id: userId,
                    badge_id: badge.id,
                    awarded_at: new Date().toISOString(),
                })
                .select("*, badge:badges(*)")
                .maybeSingle();

            if (error) {
                // If it's a duplicate key error, it means we hit a race condition 
                // but the end result is the same: the user has the badge.
                if (error.code === '23505') {
                    // Fetch the existing record to return it
                    const { data: existingRecord } = await client
                        .from("user_badges")
                        .select("*, badge:badges(*)")
                        .eq("user_id", userId)
                        .eq("badge_id", badge.id)
                        .maybeSingle();
                    return existingRecord as any;
                }

                console.error(`[BadgeService] Failed to insert badge achievement (${badgeSlug}):`, error.message, error.code, error.hint);
                return null;
            }

            return data as any;
        } catch (error) {
            console.error("[BadgeService] Unexpected error in awardBadge:", error);
            return null;
        }
    },

    /**
     * Get user statistics needed for badge evaluation
     */
    async getUserBadgeData(userId: string, client = supabase): Promise<UserBadgeData> {
        try {
            // Get user's profile for last activity date
            const { data: profile } = await client
                .from("profiles")
                .select("last_activity_date")
                .eq("id", userId)
                .single();

            // Calculate streak dynamically using the same logic as the dashboard
            const streakData = await analyticsService.calculateStreak(userId, client);
            const currentStreak = streakData.currentStreak;


            // Get user's completed sessions
            const { data: sessions } = await client
                .from("interview_sessions")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "completed");

            const completedSessions = sessions || [];
            const totalInterviews = completedSessions.length;

            // Get currently earned badges
            const { data: userBadges } = await client
                .from("user_badges")
                .select(`
                    badge:badges(slug)
                `)
                .eq("user_id", userId);

            const earnedBadgesSlugs = (userBadges || []).map((ub: any) => ub.badge.slug);

            // Calculate aggregate stats
            let highestScore = 0;
            let totalScore = 0;
            let fastestTime = Infinity;
            const uniqueTypes = new Set();
            let morningInterviews = 0;
            let nightInterviews = 0;
            let totalCommScore = 0;
            let commScoreCount = 0;
            let totalTechScore = 0;
            let techScoreCount = 0;

            completedSessions.forEach(s => {
                const score = s.score || 0;
                if (score > highestScore) highestScore = score;
                totalScore += score;

                const durationMinutes = (s.duration_seconds || 0) / 60;
                if (durationMinutes > 0 && durationMinutes < fastestTime) fastestTime = durationMinutes;

                if (s.interview_type) uniqueTypes.add(s.interview_type);

                // Time of day
                const hour = new Date(s.created_at).getHours();
                if (hour >= 6 && hour < 10) morningInterviews++;
                if (hour >= 22 || hour < 2) nightInterviews++;

                // Extract granular scores if available in feedback
                const feedback = s.feedback as any;
                if (feedback && feedback.scores) {
                    if (feedback.scores.communication !== undefined) {
                        totalCommScore += feedback.scores.communication;
                        commScoreCount++;
                    }
                    if (feedback.scores.technical !== undefined) {
                        totalTechScore += feedback.scores.technical;
                        techScoreCount++;
                    }
                }
            });

            // Fallback for communication/technical scores if not in feedback
            const avgCommScore = commScoreCount > 0 ? totalCommScore / commScoreCount : (totalInterviews > 0 ? totalScore / totalInterviews : 0);
            const avgTechScore = techScoreCount > 0 ? totalTechScore / techScoreCount : (totalInterviews > 0 ? totalScore / totalInterviews : 0);

            // Build UserBadgeData
            const data: UserBadgeData = {
                streak: currentStreak,
                totalInterviews,
                weeklyRank: null, // To be implemented with leaderboard logic
                monthlyRank: null, // To be implemented with leaderboard logic
                totalWeeklyUsers: 0,
                lastActiveDate: profile?.last_activity_date || null,
                currentStreak: currentStreak,
                wasInactive: false, // Could be calculated based on lastActiveDate
                earnedBadges: earnedBadgesSlugs,
                highestScore,
                averageScore: totalInterviews > 0 ? Math.round(totalScore / totalInterviews) : 0,
                communicationScore: Math.round(avgCommScore),
                technicalScore: Math.round(avgTechScore),
                skillMastery: Math.round(avgTechScore), // Using tech score as proxy
                fastestTime: fastestTime === Infinity ? undefined : fastestTime,
                interviewTypes: uniqueTypes.size,
                morningInterviews,
                nightInterviews,
            };

            return data;
        } catch (error) {
            console.error("Error fetching user badge data:", error);
            return {
                streak: 0,
                totalInterviews: 0,
                weeklyRank: null,
                monthlyRank: null,
                totalWeeklyUsers: 0,
                lastActiveDate: null,
                currentStreak: 0,
                wasInactive: false,
                earnedBadges: [],
            };
        }
    },

    /**
     * Check badge eligibility and award if criteria met
     * Returns array of newly awarded badges
     */
    async checkAndAwardBadges(userId: string, client = supabase): Promise<Badge[]> {
        const newlyAwarded: Badge[] = [];

        try {
            // Get user's current badge statistics
            const userData = await this.getUserBadgeData(userId, client);
            const earnedSlugs = new Set(userData.earnedBadges);


            // Iterate through all badge definitions
            for (const definition of BADGE_DEFINITIONS) {
                // Skip if already earned
                if (earnedSlugs.has(definition.id)) continue;

                // Check condition
                if (definition.checkCondition(userData)) {
                    const awarded = await this.awardBadge(userId, definition.id, client);
                    if (awarded && awarded.badge) {
                        newlyAwarded.push(awarded.badge);
                    }
                }
            }

            if (newlyAwarded.length > 0) {
            }

            return newlyAwarded;
        } catch (error) {
            console.error("[BadgeService] Error in checkAndAwardBadges chain:", error);
            return newlyAwarded;
        }
    },

    /**
     * Get badge by slug
     */
    async getBadgeBySlug(slug: string): Promise<Badge | null> {
        try {
            const { data, error } = await supabase
                .from("badges")
                .select("*")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching badge:", error);
            return null;
        }
    }
};
