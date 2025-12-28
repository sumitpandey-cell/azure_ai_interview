import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '@/services/subscription.service';
import { toast } from 'sonner';

interface UseSubscriptionTimerOptions {
    userId: string | undefined;
    onTimeExpired?: () => void;
    warnAt?: number[]; // Minutes to show warnings at [5, 2, 1]
}

interface UseSubscriptionTimerReturn {
    remainingMinutes: number;
    remainingSeconds: number;
    isLowTime: boolean;
    isCriticalTime: boolean;
    isExpired: boolean;
    loading: boolean;
    formatTime: () => string;
}

/**
 * Hook for managing countdown timer based on user's subscription
 * Automatically fetches remaining time and counts down
 */
export function useSubscriptionTimer({
    userId,
    onTimeExpired,
    warnAt = [5, 2, 1],
}: UseSubscriptionTimerOptions): UseSubscriptionTimerReturn {
    const [totalRemainingSeconds, setTotalRemainingSeconds] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());

    // Fetch initial remaining time
    useEffect(() => {
        const fetchRemainingTime = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const remainingSeconds = await subscriptionService.getRemainingMinutes(userId);
                setTotalRemainingSeconds(remainingSeconds);
                console.log(`⏱️ Initial remaining time: ${remainingSeconds} seconds`);
            } catch (error) {
                console.error('Error fetching remaining time:', error);
                // Default to 15 minutes on error
                setTotalRemainingSeconds(15 * 60);
            } finally {
                setLoading(false);
            }
        };

        fetchRemainingTime();
    }, [userId]);

    // Countdown timer
    useEffect(() => {
        if (loading || totalRemainingSeconds <= 0) return;

        const interval = setInterval(() => {
            setTotalRemainingSeconds((prev) => {
                const newValue = Math.max(0, prev - 1);

                // Check if we hit a warning threshold
                const remainingMinutes = Math.ceil(newValue / 60);
                if (warnAt.includes(remainingMinutes) && !warningsShown.has(remainingMinutes)) {
                    setWarningsShown((prev) => new Set(prev).add(remainingMinutes));

                    if (remainingMinutes === 5) {
                        toast.warning('⏰ 5 minutes remaining in your session', {
                            description: 'Your time is running low. Consider upgrading for more time.',
                        });
                    } else if (remainingMinutes === 2) {
                        toast.warning('⏰ 2 minutes remaining!', {
                            description: 'Your session will end soon.',
                        });
                    } else if (remainingMinutes === 1) {
                        toast.error('⏰ 1 minute remaining!', {
                            description: 'Your session will end very soon.',
                        });
                    }
                }

                // Time expired
                if (newValue === 0) {
                    toast.error('⏰ Time expired!', {
                        description: 'Your session time has run out.',
                    });
                    onTimeExpired?.();
                }

                return newValue;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [loading, totalRemainingSeconds, onTimeExpired, warnAt, warningsShown]);

    const remainingMinutes = Math.floor(totalRemainingSeconds / 60);
    const remainingSeconds = totalRemainingSeconds % 60;
    const isLowTime = remainingMinutes < 5 && remainingMinutes > 0;
    const isCriticalTime = remainingMinutes <= 2;
    const isExpired = totalRemainingSeconds === 0;

    const formatTime = useCallback(() => {
        const mins = Math.floor(totalRemainingSeconds / 60);
        const secs = totalRemainingSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, [totalRemainingSeconds]);

    return {
        remainingMinutes,
        remainingSeconds,
        isLowTime,
        isCriticalTime,
        isExpired,
        loading,
        formatTime,
    };
}
