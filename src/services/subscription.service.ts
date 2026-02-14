import { supabase } from "@/integrations/supabase/client";
import type { Tables, Json } from "@/integrations/supabase/types";

export type Plan = Tables<"plans">;


/**
 * Subscription Service
 * Handles subscription management and usage tracking
 */
export const subscriptionService = {
    /**
     * Get all available plans
     */
    async getPlans(userType?: 'student' | 'recruiter'): Promise<Plan[]> {
        try {
            let query = supabase
                .from("plans")
                .select("*");

            if (userType) {
                query = query.eq('user_type', userType);
            }

            const { data, error } = await query
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
    /**
     * Get user's current subscription by looking at the latest payment transaction
     */
    async getSubscription(userId: string, client = supabase) {
        try {
            // Fetch the most recent successful payment transaction
            const { data: latestPayment, error } = await client
                .from("credit_transactions")
                .select("*")
                .eq("user_id", userId)
                .eq("type", "payment")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error || !latestPayment) {
                return null;
            }

            const metadata = latestPayment.metadata as { plan_id?: string };
            const planId = metadata?.plan_id;

            if (!planId) return null;

            // Fetch current plan details to get name and allowance
            const { data: plan } = await client
                .from("plans")
                .select("*")
                .eq("id", planId)
                .single();

            if (!plan) return null;

            // Return a backward-compatible object for the UI
            return {
                plan_id: planId,
                plan_seconds: plan.plan_seconds,
                status: 'active', // Derived as active since minutes don't expire
                created_at: latestPayment.created_at,
                plans: {
                    name: plan.name
                }
            };
        } catch (error) {
            console.error("Error fetching derived subscription:", error);
            return null;
        }
    },

    /**
     * Process a new purchase
     * Adds minutes via RPC and records the transaction. No 'subscriptions' table needed.
     */
    async createSubscription(userId: string, planId: string, orderId: string, client = supabase): Promise<{ success: boolean; status: 'processed' | 'already_processed' | 'failed' }> {
        try {
            console.log(`ℹ️ Processing purchase for user ${userId}, plan ${planId}, order ${orderId}`);

            const cleanOrderId = orderId.replace(/[?&].*$/, '').trim();

            // 1. Idempotency Check: Prevent duplicate crediting for the same order
            const alreadyProcessed = await this.isOrderProcessed(cleanOrderId, userId, client);
            if (alreadyProcessed) {
                console.log(`ℹ️ Order ${cleanOrderId} already processed. Skipping.`);
                return { success: true, status: 'already_processed' };
            }

            // 2. Get plan details 
            const { data: plan, error: planError } = await client
                .from("plans")
                .select("*")
                .eq("id", planId)
                .single();

            if (planError || !plan) {
                console.error("❌ Plan not found:", planId);
                return { success: false, status: 'failed' };
            }

            // 3. SECURE CREDIT ADDITION & TRANSACTION RECORDING
            // We'll do this in two steps to ensure the order_id is correctly recorded in the new column.

            // Step 1: Create the transaction record first
            const { data: transaction, error: transError } = await client
                .from("credit_transactions")
                .insert({
                    user_id: userId,
                    amount: plan.plan_seconds || 0, // Matches 'amount' column in SQL
                    type: 'purchase', // Matches constraint array['purchase'::text, ...]
                    description: `Purchase: ${plan.name} (${cleanOrderId})`,
                    order_id: cleanOrderId,
                    metadata: { plan_id: planId }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)
                .select()
                .single();

            if (transError) {
                console.error("❌ Error creating transaction record:", transError);
                return { success: false, status: 'failed' };
            }

            // Step 2: Update the user's balance
            // We use the existing update_user_credits RPC but note that it might also create its own transaction record if not modified.
            // If the RPC creates a record, we should ensure we don't end up with duplicates.
            const { error: rpcError } = await client.rpc('update_user_credits', {
                user_uuid: userId,
                seconds_to_add: plan.plan_seconds || 0,
                transaction_type: 'balance_update', // Use a different type to avoid RPC-generated duplicates if possible
                transaction_description: `Balance Update for ${cleanOrderId}`,
                p_metadata: { order_id: cleanOrderId, plan_id: planId }
            });

            if (rpcError) {
                console.error("❌ RPC Error updating balance:", rpcError);
                // If balance update fails, we should probably delete the transaction record to stay consistent
                await client.from("credit_transactions").delete().eq("id", transaction.id);
                return { success: false, status: 'failed' };
            }

            console.log(`✅ Successfully processed purchase ${orderId} for user ${userId}`);
            return { success: true, status: 'processed' };
        } catch (error) {
            console.error("❌ Critical error in process purchase:", error);
            return { success: false, status: 'failed' };
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
    async trackUsage(userId: string, seconds: number, metadata: Record<string, unknown> = {}, client = supabase): Promise<boolean> {
        try {

            if (seconds <= 0) return true;

            // Use the update_user_credits RPC from migration 0008
            const { error } = await client.rpc('update_user_credits', {
                user_uuid: userId,
                seconds_to_add: -Math.round(seconds), // Use negative for usage
                transaction_type: 'usage',
                transaction_description: (metadata as Record<string, string>)?.description || `Interview session usage: ${Math.round(seconds)} seconds`,
                p_metadata: metadata as Json
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
                    }
                }
                return false;
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
                    remainingSeconds: 0,
                    remainingMinutes: 0,
                    percentageUsed: 0,
                };
            }

            const remainingSeconds = profile.balance_seconds ?? 0;
            // For percentage, we'll calculate based on the current subscription plan's last purchase
            const subscription = await this.getSubscription(userId);
            const totalAllowance = (subscription as { plan_seconds: number } | null)?.plan_seconds || 3600;
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
                remainingSeconds: 0,
                remainingMinutes: 0,
                percentageUsed: 0,
            };
        }
    },

    /**
     * Check session eligibility for guests (B2B)
     * Queries the recruiter's balance via a secure RPC
     */
    async checkSessionEligibility(sessionId: string, client = supabase): Promise<{
        isAllowed: boolean;
        remainingSeconds: number;
        billingUserId?: string;
    }> {
        try {
            // Use the new secure billing info RPC
            const { data, error } = await client.rpc('get_session_billing_info', {
                p_session_id: sessionId
            });

            if (error) throw error;

            if (data && data.length > 0) {
                return {
                    isAllowed: data[0].is_allowed,
                    remainingSeconds: data[0].remaining_balance,
                    billingUserId: data[0].billing_user_id
                };
            }

            return { isAllowed: true, remainingSeconds: 0 };
        } catch (error) {
            console.error("❌ Error checking session eligibility:", error);
            return { isAllowed: true, remainingSeconds: 0 };
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
     * Check if a payment order has already been processed
     */
    async isOrderProcessed(orderId: string, userId?: string, client = supabase): Promise<boolean> {
        try {
            if (!orderId) return false;

            // Use the new order_id column for a clean, indexed search
            let query = client
                .from("credit_transactions")
                .select("id")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .eq("order_id", orderId as any);

            if (userId) query = query.eq('user_id', userId);
            const { data, error } = await query.limit(1).maybeSingle();

            if (error) {
                console.error(`❌ Error checking order_id column for ${orderId}:`, error);

                // Final fallback: Manual search in recent transactions if the column check fails
                // This handles cases where the column exists but might not be in the generated types yet
                if (userId) {
                    const { data: recentTrans } = await client
                        .from("credit_transactions")
                        .select("description, id")
                        .eq("user_id", userId)
                        .eq("type", "purchase")
                        .order("created_at", { ascending: false })
                        .limit(20);

                    if (recentTrans) {
                        for (const tx of recentTrans) {
                            if (tx.description?.includes(orderId)) {
                                console.log(`ℹ️ Order ${orderId} found via description fallback search.`);
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            return !!data;
        } catch (error) {
            console.error(`❌ Exception checking status for order ${orderId}:`, error);
            return true; // Fail-closed
        }
    },

    /**
     * Get purchase history for a user from transactions
     */
    async getTransactions(userId: string) {
        try {
            const { data, error } = await supabase
                .from("credit_transactions")
                .select("*")
                .eq("user_id", userId)
                .eq("type", "purchase")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching purchase history:", error);
            return [];
        }
    },

    /**
     * Get credit transactions for a user (usage, bonus, etc.)
     */
    async getCreditTransactions(userId: string): Promise<Tables<"credit_transactions">[]> {
        try {
            const { data, error } = await supabase
                .from("credit_transactions")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching credit transactions:", error);
            return [];
        }
    },
};
