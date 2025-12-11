'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
    type: 'free' | 'paid';
    plan_name?: string;
    allowed: boolean;
    remaining_minutes: number;
    plan_id?: string;
    loading: boolean;
}

export function useSubscription() {
    const { user } = useAuth();
    const [status, setStatus] = useState<SubscriptionStatus>({
        type: 'free',
        allowed: true,
        remaining_minutes: 30,
        loading: true
    });

    const recordUsage = useCallback(async (minutes: number) => {
        if (!user?.id) return;

        try {
            const { error } = await (supabase as any).rpc('increment_usage', {
                user_uuid: user.id,
                minutes_to_add: minutes
            });

            if (error) {
                console.error('Error recording usage:', error);
            } else {
                // Refresh status after recording usage
                checkEligibility();
            }
        } catch (error) {
            console.error('Error in recordUsage:', error);
        }
    }, [user?.id]);

    const checkEligibility = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Call the database function we created
            const { data, error } = await (supabase as any).rpc('check_and_reset_daily_usage', { user_uuid: user.id });

            if (error) {
                console.error('Error checking eligibility:', error);
                return;
            }

            if (data) {
                let planName = 'Free';
                if (data.plan_id) {
                    const { data: planData } = await (supabase as any)
                        .from('plans')
                        .select('name')
                        .eq('id', data.plan_id)
                        .single();
                    if (planData) {
                        planName = planData.name;
                    }
                }

                setStatus({
                    type: data.type,
                    plan_name: planName,
                    allowed: data.allowed,
                    remaining_minutes: data.remaining_minutes,
                    plan_id: data.plan_id,
                    loading: false
                });
            }
        } catch (error) {
            console.error('Error in checkEligibility:', error);
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [user?.id]);

    // Check on mount and when user changes
    useEffect(() => {
        checkEligibility();
    }, [checkEligibility]);

    return {
        ...status,
        checkEligibility,
        recordUsage
    };
}
