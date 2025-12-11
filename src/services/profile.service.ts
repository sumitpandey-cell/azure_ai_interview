import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

/**
 * Profile Service
 * Handles all user profile related database operations
 */
export const profileService = {
    /**
     * Get user profile by ID
     */
    async getProfile(userId: string): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    },

    /**
     * Create a new user profile
     */
    async createProfile(profile: ProfileInsert): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .insert(profile)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Profile created:", data.id);
            return data;
        } catch (error) {
            console.error("Error creating profile:", error);
            return null;
        }
    },

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", userId)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Profile updated:", userId);
            return data;
        } catch (error) {
            console.error("Error updating profile:", error);
            return null;
        }
    },

    /**
     * Update user streak
     * Increments streak if last activity was yesterday, resets if missed a day
     */
    async updateStreak(userId: string): Promise<{ streak: number; wasReset: boolean } | null> {
        try {
            const profile = await this.getProfile(userId);
            if (!profile) return null;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let newStreak = profile.streak_count;
            let wasReset = false;

            if (profile.last_activity_date) {
                const lastActivity = new Date(profile.last_activity_date);
                lastActivity.setHours(0, 0, 0, 0);

                const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff === 0) {
                    // Same day, no change to streak
                    return { streak: newStreak, wasReset: false };
                } else if (daysDiff === 1) {
                    // Consecutive day, increment streak
                    newStreak += 1;
                } else {
                    // Missed day(s), reset streak
                    newStreak = 1;
                    wasReset = true;
                }
            } else {
                // First activity
                newStreak = 1;
            }

            await this.updateProfile(userId, {
                streak_count: newStreak,
                last_activity_date: new Date().toISOString(),
            });

            console.log(`✓ Streak updated for ${userId}: ${newStreak} days${wasReset ? ' (reset)' : ''}`);
            return { streak: newStreak, wasReset };
        } catch (error) {
            console.error("Error updating streak:", error);
            return null;
        }
    },

    /**
     * Get current streak count
     */
    async getStreak(userId: string): Promise<number> {
        try {
            const profile = await this.getProfile(userId);
            return profile?.streak_count || 0;
        } catch (error) {
            console.error("Error getting streak:", error);
            return 0;
        }
    },

    /**
     * Delete user profile (admin only)
     */
    async deleteProfile(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userId);

            if (error) throw error;
            console.log("✓ Profile deleted:", userId);
            return true;
        } catch (error) {
            console.error("Error deleting profile:", error);
            return false;
        }
    }
};
