'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscription.service';

export interface SubscriptionStatus {
    type: 'free' | 'paid';
    plan_name?: string;
    allowed: boolean;
    remaining_seconds: number;
    plan_seconds: number;
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
            plan_seconds: 3600,
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
            console.log('🔄 Fetching fresh credit balance');
            // Fetch usage limit from service which now uses balance_seconds
            const { remainingSeconds, remainingMinutes, percentageUsed, hasLimit } = await subscriptionService.checkUsageLimit(user.id);

            const subscription = await subscriptionService.getSubscription(user.id);
            const planName = subscription?.plan_id ? (await (supabase as any)
                .from('plans')
                .select('name')
                .eq('id', subscription.plan_id)
                .single()).data?.name || 'Free' : 'Free';

            const newStatus: SubscriptionStatus = {
                type: planName !== 'Free' ? 'paid' : 'free',
                plan_name: planName,
                allowed: !hasLimit,
                remaining_seconds: remainingSeconds,
                plan_seconds: subscription?.plan_seconds || 6000,
                plan_id: subscription?.plan_id || undefined,
                loading: false
            };

            console.log('📊 Final Credit Status:', newStatus);

            setStatus(newStatus);

            // Cache the result
            subscriptionCache.set(user.id, {
                data: newStatus,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error in checkEligibility:', error);
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [user?.id]);

    const recordUsage = useCallback(async (secondsToAdd: number) => {
        if (!user?.id) return;

        try {
            const success = await subscriptionService.trackUsage(user.id, secondsToAdd);

            if (!success) {
                console.error('Error recording usage with credit system');
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
