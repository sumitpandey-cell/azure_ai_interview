import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Subscription = Tables<"subscriptions">;
export type SubscriptionInsert = TablesInsert<"subscriptions">;
export type SubscriptionUpdate = TablesUpdate<"subscriptions">;
export type Plan = Tables<"plans">;


/**
 * Subscription Service
 * Handles subscription management and usage tracking
 */
export const subscriptionService = {
    /**
     * Get all available plans
     */
    async getPlans(): Promise<Plan[]> {
        try {
            const { data, error } = await supabase
                .from("plans")
                .select("*")
                .order("price", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching plans:", error);
            return [];
        }
    },

    /**
     * Get user's current subscription
     */
    async getSubscription(userId: string, client = supabase): Promise<Subscription | null> {
        try {
            const { data, error } = await client
                .from("subscriptions")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === "PGRST116") {
                    // No subscription found
                    return null;
                }
                throw error;
            }
            return data;
        } catch (error) {
            console.error("Error fetching subscription:", error);
            return null;
        }
    },

    /**
     * Create a new subscription for user
     */
    async createSubscription(userId: string, planId: string, client = supabase): Promise<Subscription | null> {
        try {

            // 1. Get plan details (just to get the seconds for the insert)
            const { data: plan, error: planError } = await client
                .from("plans")
                .select("*")
                .eq("id", planId)
                .single();

            if (planError) throw planError;

            // 2. Simply insert into subscriptions table
            // THE DATABASE TRIGGER WILL AUTOMATICALLY ADD THE CREDITS!
            const { data, error } = await client
                .from("subscriptions")
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    plan_seconds: plan.plan_seconds,
                })
                .select()
                .single();

            if (error) {
                console.error("❌ Error inserting into subscriptions table:", error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error("❌ Critical error in createSubscription:", error);
            return null;
        }
    },

    /**
     * Track usage for a user
     * Updates the current_period_used in the database using an atomic RPC call
     */
    /**
     * Track usage for a user
     * Updates the balance_seconds in profiles and records a transaction
     */
    async trackUsage(userId: string, seconds: number, client = supabase): Promise<boolean> {
        try {

            if (seconds <= 0) return true;

            // Use the update_user_credits RPC from migration 0008
            // Cast to bypass typed RPC checks for dynamically added functions while avoiding 'any'
            const { error } = await (client as unknown as {
                rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }>
            }).rpc('update_user_credits', {
                user_uuid: userId,
                seconds_to_add: -Math.round(seconds), // Use negative for usage
                transaction_type: 'usage',
                transaction_description: `Interview session usage: ${Math.round(seconds)} seconds`
            });

            if (error) {
                console.error("❌ Error updating credits via RPC:", error);

                // Fallback: Try manual update if RPC fails
                const { data: profile } = await client
                    .from("profiles")
                    .select("balance_seconds")
                    .eq("id", userId)
                    .single();

                if (profile) {
                    const newBalance = (profile.balance_seconds || 0) - seconds;
                    const { error: updateError } = await client
                        .from("profiles")
                        .update({
                            balance_seconds: Math.max(0, Math.round(newBalance)),
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", userId);

                    if (updateError) {
                        console.error("❌ Fallback profile update failed:", updateError);
                    } else {
                    }
                }
                return !error;
            }


            // Trigger global refresh for hooks
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('subscription-updated'));
            }

            return true;
        } catch (error) {
            console.error("❌ Error tracking usage:", error);
            return false;
        }
    },

    /**
     * Check if user has remaining time
     */
    async checkUsageLimit(userId: string): Promise<{
        hasLimit: boolean;
        remainingSeconds: number;
        remainingMinutes: number;
        percentageUsed: number;
    }> {
        try {
            // Fetch balance directly from profile
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("balance_seconds")
                .eq("id", userId)
                .single();

            if (error || !profile) {
                return {
                    hasLimit: false,
                    remainingSeconds: 6000, // 100 minutes default
                    remainingMinutes: 100,
                    percentageUsed: 0,
                };
            }

            const remainingSeconds = profile.balance_seconds;
            // For percentage, we'll calculate based on the current subscription plan's last purchase
            const subscription = await this.getSubscription(userId);
            const totalAllowance = subscription?.plan_seconds || 6000;
            const percentageUsed = Math.min(100, Math.max(0, Math.round(((totalAllowance - remainingSeconds) / totalAllowance) * 100)));


            return {
                hasLimit: remainingSeconds <= 0,
                remainingSeconds: Math.max(0, remainingSeconds),
                remainingMinutes: Math.max(0, Math.floor(remainingSeconds / 60)),
                percentageUsed,
            };
        } catch (error) {
            console.error("Error checking usage limit:", error);
            return {
                hasLimit: false,
                remainingSeconds: 6000,
                remainingMinutes: 100,
                percentageUsed: 0,
            };
        }
    },

    /**
     * Get remaining time in seconds for countdown timer
     */
    async getRemainingSeconds(userId: string): Promise<number> {
        const { remainingSeconds } = await this.checkUsageLimit(userId);
        return remainingSeconds;
    },

    /**
     * Check if user has low remaining time (< 5 minutes / 300 seconds)
     */
    async hasLowTime(userId: string): Promise<boolean> {
        const remainingSeconds = await this.getRemainingSeconds(userId);
        return remainingSeconds < 300 && remainingSeconds > 0;
    },

    /**
     * Get purchase history for a user
     */
    async getTransactions(userId: string): Promise<Subscription[]> {
        try {
            const { data, error } = await supabase
                .from("subscriptions")
                .select("*, plans(name)")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching purchase history:", error);
            return [];
        }
    },
};
