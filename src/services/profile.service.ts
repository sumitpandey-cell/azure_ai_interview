import { supabase, publicSupabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { badgeService } from "./badge.service";

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
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    },

    /**
     * Create or update user profile
     */
    async upsertProfile(profile: ProfileInsert): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .upsert(profile)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error upserting profile:", error);
            return null;
        }
    },

    async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
        try {
            // Use update instead of upsert to avoid RLS insert issues.
            // Direct inserts into profiles are usually handled by database triggers.
            const { data, error } = await supabase
                .from("profiles")
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq("id", userId)
                .select(); // Remove .single() to avoid 406 error if row doesn't exist

            if (error) throw error;

            // Return first item or null if no row was updated
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error("Error updating profile:", error);
            return null;
        }
    },

    /**
     * Check if a profile exists
     */
    async profileExists(userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", userId)
                .maybeSingle();

            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error("Error checking profile existence:", error);
            return false;
        }
    },

    /**
     * Update user avatar URL
     */
    async updateAvatar(userId: string, avatarUrl: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
                .eq("id", userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating avatar:", error);
            return false;
        }
    },

    /**
     * Update last activity date
     */
    async updateLastActivity(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ last_activity_date: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq("id", userId);

            if (error) throw error;
        } catch (error) {
            console.error("Error updating last activity:", error);
        }
    },

    /**
     * Get user streak count
     */
    async getStreak(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("streak_count")
                .eq("id", userId)
                .maybeSingle();

            if (error) throw error;
            return data?.streak_count || 0;
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
            return true;
        } catch (error) {
            console.error("Error deleting profile:", error);
            return false;
        }
    },

    /**
     * Get a public profile by ID or slug
     * Only returns a subset of safe, non-sensitive fields
     */
    async getPublicProfile(idOrSlug: string): Promise<any | null> {
        try {
            // Check if it's an ID (UUID) or a slug
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

            const query = publicSupabase
                .from("profiles")
                .select("id, full_name, avatar_url, streak_count, is_public, profile_slug, created_at");

            if (isUuid) {
                query.eq("id", idOrSlug);
            } else {
                query.eq("profile_slug", idOrSlug);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error("Supabase error in getPublicProfile:", error);
                throw error;
            }
            if (!data || !data.is_public) return null;

            return data;
        } catch (error: any) {
            console.error("Critical error in getPublicProfile:", error.message || error);
            if (error.cause) {
                console.error("Detailed Fetch Cause:", error.cause);
            }
            return null;
        }
    },

    /**
     * Toggle profile public visibility
     */
    async setProfileVisibility(userId: string, isPublic: boolean): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ is_public: isPublic, updated_at: new Date().toISOString() })
                .eq("id", userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error setting profile visibility:", error);
            return false;
        }
    },

    /**
     * Deactivate user account
     * Sets is_active to false and records deactivation timestamp
     */
    async deactivateAccount(userId: string, reason?: string): Promise<boolean> {
        try {
            const updateData = {
                is_active: false,
                deactivated_at: new Date().toISOString(),
                deactivation_reason: reason || null,
                updated_at: new Date().toISOString()
            };

            // Don't use .select() because RLS will block reading deactivated profiles
            const { error, count } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("id", userId);

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error("Error deactivating account:", error);
            return false;
        }
    },

    /**
     * Reactivate user account
     * Sets is_active to true and clears deactivation data
     */
    async reactivateAccount(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    is_active: true,
                    deactivated_at: null,
                    deactivation_reason: null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error reactivating account:", error);
            return false;
        }
    },

    /**
     * Check account status
     * Returns whether account is active and deactivation details if applicable
     */
    async checkAccountStatus(userId: string): Promise<{
        isActive: boolean;
        deactivatedAt: string | null;
        deactivationReason: string | null;
    } | null> {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("is_active, deactivated_at, deactivation_reason")
                .eq("id", userId)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            return {
                isActive: data.is_active,
                deactivatedAt: data.deactivated_at,
                deactivationReason: data.deactivation_reason
            };
        } catch (error) {
            console.error("Error checking account status:", error);
            return null;
        }
    }
};
