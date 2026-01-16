'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
    type: 'free' | 'paid';
    plan_name?: string;
    allowed: boolean;
    remaining_seconds: number;
    monthly_seconds: number;
    plan_id?: string;
    loading: boolean;
}

// In-memory cache to prevent re-fetching on every navigation
const subscriptionCache = new Map<string, { data: SubscriptionStatus; timestamp: number }>();
const CACHE_DURATION = 300 * 1000; // 5 minutes

export function useSubscription() {
    const { user } = useAuth();

    // Initialize with cached data if available to prevent flash
    const getInitialState = (): SubscriptionStatus => {
        if (user?.id) {
            const cached = subscriptionCache.get(user.id);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data;
            }
        }
        return {
            type: 'free',
            allowed: true,
            remaining_seconds: 3600, // Initialize to 1 hour (seconds) to prevent "Low Time" flash
            monthly_seconds: 3600,
            loading: true
        };
    };

    const [status, setStatus] = useState<SubscriptionStatus>(getInitialState);

    // Track if we've already fetched for this user in this session
    const hasFetchedRef = useRef(false);

    const checkEligibility = useCallback(async () => {
        if (!user?.id) return;

        // Check cache first
        const cached = subscriptionCache.get(user.id);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('📦 Using cached subscription data');
            setStatus(cached.data);
            return;
        }

        try {
            console.log('🔄 Fetching fresh subscription data');
            // Call the database function we created
            const { data, error } = await (supabase as any).rpc('check_and_reset_monthly_usage', { user_uuid: user.id });

            if (error) {
                console.error('Error checking eligibility:', error);
                return;
            }

            if (data && data.length > 0) {
                const subscriptionData = data[0]; // RPC returns an array
                console.log('🔍 RPC Response:', subscriptionData);
                let planName = 'Free';
                if (subscriptionData.plan_id) {
                    const { data: planData } = await (supabase as any)
                        .from('plans')
                        .select('name')
                        .eq('id', subscriptionData.plan_id)
                        .single();
                    if (planData) {
                        planName = planData.name;
                    }
                }

                const newStatus: SubscriptionStatus = {
                    type: subscriptionData.type,
                    plan_name: planName,
                    allowed: subscriptionData.allowed,
                    remaining_seconds: subscriptionData.remaining_seconds,
                    monthly_seconds: subscriptionData.monthly_seconds,
                    plan_id: subscriptionData.plan_id,
                    loading: false
                };

                console.log('📊 Final Status:', newStatus);

                setStatus(newStatus);

                // Cache the result
                subscriptionCache.set(user.id, {
                    data: newStatus,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Error in checkEligibility:', error);
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [user?.id]);

    const recordUsage = useCallback(async (secondsToAdd: number) => {
        if (!user?.id) return;

        try {
            const { error } = await (supabase as any).rpc('increment_usage', {
                user_uuid: user.id,
                seconds_to_add: Math.round(secondsToAdd)
            });

            if (error) {
                console.error('Error recording usage:', error);
            } else {
                // Invalidate cache and refresh
                subscriptionCache.delete(user.id);
                checkEligibility();
            }
        } catch (error) {
            console.error('Error in recordUsage:', error);
        }
    }, [user?.id, checkEligibility]);

    // Only fetch once per user session
    useEffect(() => {
        if (user?.id && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            checkEligibility();
        }
    }, [user?.id, checkEligibility]);

    // Function to manually invalidate cache
    const invalidateCache = useCallback(() => {
        if (user?.id) {
            subscriptionCache.delete(user.id);
            checkEligibility();
        }
    }, [user?.id, checkEligibility]);

    // Listen for global updates to refresh data immediately
    useEffect(() => {
        const handleGlobalUpdate = () => {
            if (user?.id) {
                console.log('🔔 Subscription update event received, refreshing...');
                subscriptionCache.delete(user.id);
                checkEligibility();
            }
        };

        window.addEventListener('subscription-updated', handleGlobalUpdate);
        return () => window.removeEventListener('subscription-updated', handleGlobalUpdate);
    }, [user?.id, checkEligibility]);

    return {
        ...status,
        checkEligibility,
        recordUsage,
        invalidateCache
    };
}
