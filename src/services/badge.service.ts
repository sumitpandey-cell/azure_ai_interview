import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

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
    async awardBadge(userId: string, badgeSlug: string): Promise<UserBadge | null> {
        try {
            // First, get the badge ID from slug
            const { data: badge, error: badgeError } = await supabase
                .from("badges")
                .select("id")
                .eq("slug", badgeSlug)
                .single();

            if (badgeError) throw badgeError;

            // Check if user already has this badge
            const { data: existing, } = await supabase
                .from("user_badges")
                .select("id")
                .eq("user_id", userId)
                .eq("badge_id", badge.id)
                .single();

            if (existing) {
                console.log("⚠️ User already has badge:", badgeSlug);
                return null;
            }

            // Award the badge
            const { data, error } = await supabase
                .from("user_badges")
                .insert({
                    user_id: userId,
                    badge_id: badge.id,
                    awarded_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Badge awarded:", badgeSlug, "to user:", userId);
            return data;
        } catch (error) {
            console.error("Error awarding badge:", error);
            return null;
        }
    },

    /**
     * Check badge eligibility and award if criteria met
     * Returns array of newly awarded badges
     */
    async checkAndAwardBadges(userId: string): Promise<Badge[]> {
        const newlyAwarded: Badge[] = [];

        try {
            // Get user's interview stats
            const { data: sessions, error: sessionsError } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("user_id", userId);

            if (sessionsError) throw sessionsError;

            const completedSessions = sessions.filter(s => s.status === "completed");
            const totalSessions = completedSessions.length;

            // Get user's current badges
            const userBadges = await this.getUserBadges(userId);
            const earnedSlugs = new Set(userBadges.map(ub => (ub.badge as any).slug));

            // Check "First Interview" badge (1 completed interview)
            if (totalSessions >= 1 && !earnedSlugs.has("first-interview")) {
                const awarded = await this.awardBadge(userId, "first-interview");
                if (awarded) {
                    const badge = await this.getBadgeBySlug("first-interview");
                    if (badge) newlyAwarded.push(badge);
                }
            }

            // Check "5 Interview Milestone" badge
            if (totalSessions >= 5 && !earnedSlugs.has("five-interviews")) {
                const awarded = await this.awardBadge(userId, "five-interviews");
                if (awarded) {
                    const badge = await this.getBadgeBySlug("five-interviews");
                    if (badge) newlyAwarded.push(badge);
                }
            }

            // Check "Perfect Score" badge (any session with score >= 95)
            const hasPerfectScore = completedSessions.some(s => s.score && s.score >= 95);
            if (hasPerfectScore && !earnedSlugs.has("perfect-score")) {
                const awarded = await this.awardBadge(userId, "perfect-score");
                if (awarded) {
                    const badge = await this.getBadgeBySlug("perfect-score");
                    if (badge) newlyAwarded.push(badge);
                }
            }

            // Check "10 Day Streak" badge
            const { data: profile } = await supabase
                .from("profiles")
                .select("streak_count")
                .eq("id", userId)
                .single();

            if (profile && profile.streak_count >= 10 && !earnedSlugs.has("ten-day-streak")) {
                const awarded = await this.awardBadge(userId, "ten-day-streak");
                if (awarded) {
                    const badge = await this.getBadgeBySlug("ten-day-streak");
                    if (badge) newlyAwarded.push(badge);
                }
            }

            return newlyAwarded;
        } catch (error) {
            console.error("Error checking badge eligibility:", error);
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
    },
};
