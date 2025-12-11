import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Subscription = Tables<"subscriptions">;
export type SubscriptionInsert = TablesInsert<"subscriptions">;
export type SubscriptionUpdate = TablesUpdate<"subscriptions">;
export type Plan = Tables<"plans">;
export type DailyUsage = Tables<"daily_usage">;

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
                monthly_minutes: plan.monthly_minutes,
                minutes_used: 0,
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
     */
    async trackUsage(userId: string, minutes: number): Promise<boolean> {
        try {
            // Get current subscription
            const subscription = await this.getSubscription(userId);
            if (!subscription) {
                console.warn("No active subscription found for user:", userId);
                return false;
            }

            // Update subscription minutes
            const newMinutesUsed = subscription.minutes_used + minutes;
            await supabase
                .from("subscriptions")
                .update({
                    minutes_used: newMinutesUsed,
                    updated_at: new Date().toISOString()
                })
                .eq("id", subscription.id);

            // Update daily usage
            const today = new Date().toISOString().split('T')[0];
            const { data: existingUsage } = await supabase
                .from("daily_usage")
                .select("*")
                .eq("user_id", userId)
                .eq("date", today)
                .single();

            if (existingUsage) {
                // Update existing record
                await supabase
                    .from("daily_usage")
                    .update({
                        minutes_used: existingUsage.minutes_used + minutes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingUsage.id);
            } else {
                // Create new record
                await supabase
                    .from("daily_usage")
                    .insert({
                        user_id: userId,
                        date: today,
                        minutes_used: minutes,
                    });
            }

            console.log(`✓ Usage tracked: ${minutes} minutes for user ${userId}`);
            return true;
        } catch (error) {
            console.error("Error tracking usage:", error);
            return false;
        }
    },

    /**
     * Check if user has remaining minutes
     */
    async checkUsageLimit(userId: string): Promise<{
        hasLimit: boolean;
        remainingMinutes: number;
        percentageUsed: number;
    }> {
        try {
            const subscription = await this.getSubscription(userId);

            // If no subscription exists, user is on free tier with 30 minutes
            if (!subscription) {
                console.log('📊 No subscription found - checking free tier usage');
                // Check if user has used any minutes this month
                const { data: sessions } = await supabase
                    .from('interview_sessions')
                    .select('duration_minutes')
                    .eq('user_id', userId)
                    .eq('status', 'completed')
                    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

                const minutesUsed = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
                const FREE_TIER_MINUTES = 30;
                const remainingMinutes = FREE_TIER_MINUTES - minutesUsed;
                const percentageUsed = Math.round((minutesUsed / FREE_TIER_MINUTES) * 100);

                console.log(`📊 Free tier usage: ${minutesUsed}/${FREE_TIER_MINUTES} minutes (${remainingMinutes} remaining)`);

                return {
                    hasLimit: remainingMinutes <= 0,
                    remainingMinutes: Math.max(0, remainingMinutes),
                    percentageUsed,
                };
            }

            const remainingMinutes = subscription.monthly_minutes - subscription.minutes_used;
            const percentageUsed = Math.round((subscription.minutes_used / subscription.monthly_minutes) * 100);

            return {
                hasLimit: remainingMinutes <= 0,
                remainingMinutes: Math.max(0, remainingMinutes),
                percentageUsed,
            };
        } catch (error) {
            console.error("Error checking usage limit:", error);
            // On error, allow free tier access
            return {
                hasLimit: false,
                remainingMinutes: 30,
                percentageUsed: 0,
            };
        }
    },

    /**
     * Get usage history for a user
     */
    async getUsageHistory(userId: string, days: number = 30): Promise<DailyUsage[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await supabase
                .from("daily_usage")
                .select("*")
                .eq("user_id", userId)
                .gte("date", startDate.toISOString().split('T')[0])
                .order("date", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching usage history:", error);
            return [];
        }
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
                    monthly_minutes: plan.monthly_minutes,
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
