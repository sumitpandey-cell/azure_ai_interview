'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscription.service';
import type { InterviewSession } from '@/services/interview.service';

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

export function useSubscription(sessionId?: string) {
    const { user } = useAuth();
    const [billingId, setBillingId] = useState<string | undefined>(user?.id);

    // Resolve billing ID (Delegate pattern)
    useEffect(() => {
        const resolveId = async () => {
            // Case A: Session-based resolution (Campaigns/B2B)
            if (sessionId) {
                try {
                    // Import inside useEffect to avoid circular dependency if any
                    const { interviewService } = await import('@/services/interview.service');
                    const session = await interviewService.getSessionById(sessionId);

                    if (session && (session as InterviewSession).campaign_id) {
                        const eligibility = await subscriptionService.checkSessionEligibility(sessionId);
                        if (eligibility.billingUserId) {
                            setBillingId(eligibility.billingUserId);
                            return; // Priority: Campaign owner
                        }
                    }
                } catch (err) {
                    console.error("Error resolving billing ID from session:", err);
                }
            }

            // Case B: User-based resolution (B2C/Self-practice)
            if (user?.id) {
                setBillingId(user.id);
            } else {
                setBillingId(undefined);
            }
        };

        resolveId();
    }, [user?.id, sessionId]);

    // Initialize with cached data if available to prevent flash
    const getInitialState = (): SubscriptionStatus => {
        if (billingId) {
            const cached = subscriptionCache.get(billingId);
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

    // Track if we've already fetched for this billing ID
    const hasFetchedRef = useRef<string | null>(null);

    const checkEligibility = useCallback(async () => {
        // CASE 1: Session-based check (B2B or Campaign)
        if (sessionId) {
            try {
                // Determine if this is a campaign/delegated session
                // We trust the RPC to tell us who is paying
                const { isAllowed, remainingSeconds, billingUserId } = await subscriptionService.checkSessionEligibility(sessionId as string);

                // If billingUserId is NOT the current user, it's a recruiter-sponsored session (B2B)
                // We MUST use the RPC results and NOT query the recruiter's profile directly (RLS restriction)
                const isRecruiterSponsored = billingUserId && user?.id && billingUserId !== user.id;
                const isGuest = !user?.id;

                if (isRecruiterSponsored || isGuest) {
                    if (billingUserId) {
                        setBillingId(billingUserId);
                    }

                    setStatus({
                        type: 'paid', // Sponsored sessions are treated as paid
                        plan_name: isRecruiterSponsored ? 'Recruiter Sponsored' : 'Guest Session',
                        allowed: isAllowed,
                        remaining_seconds: remainingSeconds,
                        plan_seconds: 6000, // Default allowance for display
                        loading: false
                    });
                    return;
                }

                // If it's the student's own session (billingUserId === user.id), 
                // we fall through to CASE 2 to fetch full subscription details (Pro, etc.)
                // since they have permission to read their own profile.
            } catch (error) {
                console.error('Error in session eligibility check:', error);
                // Fallback to normal check
            }
        }

        // CASE 2: Logged-in User
        if (!billingId) {
            if (!sessionId) setStatus(prev => ({ ...prev, loading: false }));
            return;
        }

        // Check cache first
        const cached = subscriptionCache.get(billingId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setStatus(cached.data);
            return;
        }

        try {
            // Fetch usage limit from service which now uses balance_seconds
            const { remainingSeconds, hasLimit } = await subscriptionService.checkUsageLimit(billingId);

            const subscription = await subscriptionService.getSubscription(billingId);
            const planResponse = subscription?.plan_id ? await supabase
                .from('plans')
                .select('name')
                .eq('id', subscription.plan_id)
                .single() : null;
            const planName = planResponse?.data?.name || 'Free';

            const newStatus: SubscriptionStatus = {
                type: planName !== 'Free' ? 'paid' : 'free',
                plan_name: planName,
                allowed: !hasLimit,
                remaining_seconds: remainingSeconds,
                plan_seconds: (subscription as { plan_seconds: number } | null)?.plan_seconds || 6000,
                plan_id: (subscription as { plan_id: string } | null)?.plan_id || undefined,
                loading: false
            };

            setStatus(newStatus);

            // Cache the result
            subscriptionCache.set(billingId, {
                data: newStatus,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error in checkEligibility:', error);
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [billingId, sessionId, user?.id]);

    const recordUsage = useCallback(async (secondsToAdd: number) => {
        if (!billingId) return;

        try {
            const success = await subscriptionService.trackUsage(billingId, secondsToAdd);

            if (!success) {
                console.error('Error recording usage with credit system');
            } else {
                // Invalidate cache and refresh
                subscriptionCache.delete(billingId);
                checkEligibility();
            }
        } catch (error) {
            console.error('Error in recordUsage:', error);
        }
    }, [billingId, checkEligibility]);

    // Fetch when billingId or sessionId changes
    useEffect(() => {
        const idToTrack = billingId || sessionId;
        if (idToTrack && hasFetchedRef.current !== idToTrack) {
            hasFetchedRef.current = idToTrack as string;
            checkEligibility();
        } else if (!idToTrack) {
            // No ID to track, stop loading
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [billingId, sessionId, checkEligibility]);

    // Function to manually invalidate cache
    const invalidateCache = useCallback(() => {
        const idToTrack = billingId || sessionId;
        if (idToTrack) {
            if (billingId) subscriptionCache.delete(billingId);
            checkEligibility();
        }
    }, [billingId, sessionId, checkEligibility]);

    // Listen for global updates to refresh data immediately
    useEffect(() => {
        const handleGlobalUpdate = () => {
            if (billingId) {
                subscriptionCache.delete(billingId);
                checkEligibility();
            }
        };

        window.addEventListener('subscription-updated', handleGlobalUpdate);
        return () => window.removeEventListener('subscription-updated', handleGlobalUpdate);
    }, [billingId, checkEligibility]);

    return {
        ...status,
        checkEligibility,
        recordUsage,
        invalidateCache
    };
}
