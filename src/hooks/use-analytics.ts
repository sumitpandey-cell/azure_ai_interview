import { useState, useEffect } from 'react';
import { useCacheStore } from '@/stores/use-cache-store';
import { analyticsService } from '@/services/analytics.service';
import type { SkillData, WeeklyActivityData, PerformanceData, StreakData } from '@/services/analytics.service';

interface UseAnalyticsReturn {
    skillProgress: SkillData[];
    weeklyActivity: WeeklyActivityData[];
    streakData: StreakData | null;
    performanceData: PerformanceData[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and cache analytics data
 * Uses Zustand store to prevent redundant database requests
 */
export function useAnalytics(userId: string | undefined): UseAnalyticsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get cache state and actions
    const {
        skillProgress,
        weeklyActivity,
        streakData,
        performanceData,
        isSkillProgressCacheValid,
        isWeeklyActivityCacheValid,
        isStreakDataCacheValid,
        isPerformanceDataCacheValid,
        setSkillProgress,
        setWeeklyActivity,
        setStreakData,
        setPerformanceData,
    } = useCacheStore();

    const fetchAnalytics = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            // Check which data needs to be fetched
            const needsSkillProgress = !isSkillProgressCacheValid();
            const needsWeeklyActivity = !isWeeklyActivityCacheValid();
            const needsStreakData = !isStreakDataCacheValid();
            const needsPerformanceData = !isPerformanceDataCacheValid();

            // Only fetch data that's not cached or expired
            const promises: Promise<any>[] = [];

            if (needsSkillProgress) {
                promises.push(
                    analyticsService.getSkillProgress(userId).then((data) => {
                        setSkillProgress(data);
                        return data;
                    })
                );
            }

            if (needsWeeklyActivity) {
                promises.push(
                    analyticsService.getWeeklyActivity(userId).then((data) => {
                        setWeeklyActivity(data);
                        return data;
                    })
                );
            }

            if (needsStreakData) {
                promises.push(
                    analyticsService.calculateStreak(userId).then((data) => {
                        setStreakData(data);
                        return data;
                    })
                );
            }

            if (needsPerformanceData) {
                promises.push(
                    analyticsService.getPerformanceAnalysis(userId).then((data) => {
                        setPerformanceData(data);
                        return data;
                    })
                );
            }

            // Wait for all fetches to complete
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    // Fetch analytics on mount and when userId changes
    useEffect(() => {
        fetchAnalytics();
    }, [userId]);

    return {
        skillProgress,
        weeklyActivity,
        streakData,
        performanceData,
        loading,
        error,
        refetch: fetchAnalytics,
    };
}
