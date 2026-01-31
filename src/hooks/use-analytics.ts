import { useState, useEffect, useCallback } from 'react';
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

    const fetchAnalytics = useCallback(async (force = false) => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            // Check which data needs to be fetched (or force it)
            const needsSkillProgress = force || !isSkillProgressCacheValid();
            const needsWeeklyActivity = force || !isWeeklyActivityCacheValid();
            const needsStreakData = force || !isStreakDataCacheValid();
            const needsPerformanceData = force || !isPerformanceDataCacheValid();

            const promises: Promise<void>[] = [];

            if (needsSkillProgress) {
                promises.push(analyticsService.getSkillProgress(userId).then(setSkillProgress));
            }
            if (needsWeeklyActivity) {
                promises.push(analyticsService.getWeeklyActivity(userId).then(setWeeklyActivity));
            }
            if (needsStreakData) {
                promises.push(analyticsService.calculateStreak(userId).then(setStreakData));
            }
            if (needsPerformanceData) {
                promises.push(analyticsService.getPerformanceAnalysis(userId).then(setPerformanceData));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    }, [
        userId,
        isSkillProgressCacheValid,
        isWeeklyActivityCacheValid,
        isStreakDataCacheValid,
        isPerformanceDataCacheValid,
        setSkillProgress,
        setWeeklyActivity,
        setStreakData,
        setPerformanceData
    ]);

    // Fetch analytics on mount and when userId changes
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const refetch = useCallback(() => fetchAnalytics(true), [fetchAnalytics]);

    return {
        skillProgress,
        weeklyActivity,
        streakData,
        performanceData,
        loading,
        error,
        refetch,
    };
}
