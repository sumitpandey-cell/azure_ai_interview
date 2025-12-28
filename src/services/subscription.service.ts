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
                .order("price_monthly", { ascending: true });

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
    async getSubscription(userId: string): Promise<Subscription | null> {
        try {
            const { data, error } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "active")
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
    async createSubscription(userId: string, planId: string): Promise<Subscription | null> {
        try {
            // Get plan details
            const { data: plan, error: planError } = await supabase
                .from("plans")
                .select("*")
                .eq("id", planId)
                .single();

            if (planError) throw planError;

            // Create subscription
            const subscriptionData: SubscriptionInsert = {
                user_id: userId,
                plan_id: planId,
                status: "active",
                monthly_seconds: plan.monthly_seconds,
                seconds_used: 0,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            };

            const { data, error } = await supabase
                .from("subscriptions")
                .insert(subscriptionData)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Subscription created:", data.id);
            return data;
        } catch (error) {
            console.error("Error creating subscription:", error);
            return null;
        }
    },

    /**
     * Track usage for a user
     * Updates the seconds_used in the database using an atomic RPC call
     */
    async trackUsage(userId: string, seconds: number): Promise<boolean> {
        try {
            console.log(`📊 trackUsage called: userId=${userId}, seconds=${seconds}`);

            if (seconds <= 0) return true;

            // Use the atomic RPC function to increment usage
            // This is safer as it prevents race conditions and handles both subscription and daily_usage
            const { error } = await (supabase as any).rpc('increment_usage', {
                user_uuid: userId,
                seconds_to_add: Math.round(seconds)
            });

            if (error) {
                console.error("❌ Error incrementing usage via RPC:", error);

                // Fallback: Try manual update if RPC fails
                // 1. Update subscriptions table
                const { data: subscriptions } = await supabase
                    .from("subscriptions")
                    .select("id, seconds_used")
                    .eq("user_id", userId)
                    .eq("status", "active")
                    .limit(1);

                if (subscriptions && subscriptions.length > 0) {
                    const sub = subscriptions[0];
                    const newSecondsUsed = (sub.seconds_used || 0) + seconds;
                    const { error: updateError } = await supabase
                        .from("subscriptions")
                        .update({
                            seconds_used: Math.round(newSecondsUsed),
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", sub.id);

                    if (updateError) {
                        console.error("❌ Fallback subscription update failed:", updateError);
                    } else {
                        console.log("✅ Fallback subscription update successful");
                        // Trigger refresh even on fallback success
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('subscription-updated'));
                        }
                    }
                } else {
                    console.warn("⚠️ No active subscription found for fallback tracking");
                }

                return !error;
            }

            console.log(`✅ Usage tracked successfully via RPC for user ${userId}: +${seconds} seconds`);

            // Trigger global refresh for hooks (like the one in DashboardLayout)
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
     * Check if user has remaining time (converts seconds in DB to minutes for display)
     */
    async checkUsageLimit(userId: string): Promise<{
        hasLimit: boolean;
        remainingMinutes: number;
        percentageUsed: number;
    }> {
        try {
            const subscription = await this.getSubscription(userId);

            if (!subscription) {
                console.error('❌ No subscription found for user');
                // Return default free tier limits if no subscription exists
                return {
                    hasLimit: false,
                    remainingMinutes: 100,
                    percentageUsed: 0,
                };
            }

            const remainingSeconds = subscription.monthly_seconds - subscription.seconds_used;
            const percentageUsed = Math.round((subscription.seconds_used / subscription.monthly_seconds) * 100);

            console.log(`📊 Subscription usage: ${subscription.seconds_used}/${subscription.monthly_seconds} seconds (${remainingSeconds} remaining)`);

            return {
                hasLimit: remainingSeconds <= 0,
                remainingMinutes: Math.max(0, remainingSeconds), // Note: Keeping the key name for compatibility but it contains seconds
                percentageUsed,
            };
        } catch (error) {
            console.error("Error checking usage limit:", error);
            // On error, allow free tier access
            return {
                hasLimit: false,
                remainingMinutes: 100,
                percentageUsed: 0,
            };
        }
    },

    /**
     * Get remaining time in minutes for countdown timer (converts from seconds stored in DB)
     */
    async getRemainingMinutes(userId: string): Promise<number> {
        const { remainingMinutes } = await this.checkUsageLimit(userId);
        return remainingMinutes;
    },

    /**
     * Check if user has low remaining time (< 5 minutes)
     */
    async hasLowTime(userId: string): Promise<boolean> {
        const remaining = await this.getRemainingMinutes(userId);
        return remaining < 5 && remaining > 0;
    },





    /**
     * Update subscription plan
     */
    async updateSubscriptionPlan(userId: string, newPlanId: string): Promise<Subscription | null> {
        try {
            const subscription = await this.getSubscription(userId);
            if (!subscription) return null;

            // Get new plan details
            const { data: plan, error: planError } = await supabase
                .from("plans")
                .select("*")
                .eq("id", newPlanId)
                .single();

            if (planError) throw planError;

            // Update subscription
            const { data, error } = await supabase
                .from("subscriptions")
                .update({
                    plan_id: newPlanId,
                    monthly_seconds: plan.monthly_seconds,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", subscription.id)
                .select()
                .single();

            if (error) throw error;
            console.log("✓ Subscription plan updated");
            return data;
        } catch (error) {
            console.error("Error updating subscription plan:", error);
            return null;
        }
    },

    /**
     * Cancel subscription
     */
    async cancelSubscription(userId: string): Promise<boolean> {
        try {
            const subscription = await this.getSubscription(userId);
            if (!subscription) return false;

            const { error } = await supabase
                .from("subscriptions")
                .update({
                    status: "cancelled",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", subscription.id);

            if (error) throw error;
            console.log("✓ Subscription cancelled");
            return true;
        } catch (error) {
            console.error("Error cancelling subscription:", error);
            return false;
        }
    },
};
