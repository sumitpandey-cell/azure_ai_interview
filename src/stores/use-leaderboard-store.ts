import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { leaderboardService, LeaderboardEntry } from '@/services/leaderboard.service';

interface LeaderboardState {
    // Leaderboard data
    rankings: LeaderboardEntry[];
    userRank: number | null;
    userEntry: LeaderboardEntry | null;

    // Filters
    timeFilter: 'all' | 'monthly' | 'weekly';

    // Loading and error states
    loading: boolean;
    error: string | null;

    // Cache management
    lastFetch: number | null;
    cacheValid: boolean;

    // Actions
    fetchLeaderboard: (limit?: number) => Promise<void>;
    fetchUserRank: (userId: string) => Promise<void>;
    setTimeFilter: (filter: 'all' | 'monthly' | 'weekly') => void;
    clearCache: () => void;
    setError: (error: string | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useLeaderboardStore = create<LeaderboardState>()(
    persist(
        (set, get) => ({
            // Initial state
            rankings: [],
            userRank: null,
            userEntry: null,
            timeFilter: 'all',
            loading: false,
            error: null,
            lastFetch: null,
            cacheValid: false,

            // Fetch leaderboard
            fetchLeaderboard: async (limit = 100) => {
                const state = get();

                // Check cache validity
                if (state.cacheValid && state.lastFetch &&
                    Date.now() - state.lastFetch < CACHE_DURATION &&
                    state.rankings.length > 0) {
                    return; // Use cached data
                }

                try {
                    set({ loading: true, error: null });
                    const rankings = await leaderboardService.getGlobalLeaderboard(
                        limit,
                        state.timeFilter
                    );
                    set({
                        rankings,
                        loading: false,
                        lastFetch: Date.now(),
                        cacheValid: true,
                    });
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                    set({
                        error: 'Failed to load leaderboard',
                        loading: false,
                    });
                }
            },

            // Fetch user rank
            fetchUserRank: async (userId: string) => {
                try {
                    const [rank, entry] = await Promise.all([
                        leaderboardService.getUserRank(userId),
                        leaderboardService.getUserLeaderboardEntry(userId),
                    ]);

                    set({
                        userRank: rank,
                        userEntry: entry,
                    });
                } catch (error) {
                    console.error('Error fetching user rank:', error);
                    set({ error: 'Failed to load your ranking' });
                }
            },

            // Set time filter
            setTimeFilter: (filter) => {
                set({
                    timeFilter: filter,
                    cacheValid: false, // Invalidate cache when filter changes
                });
                // Re-fetch with new filter
                get().fetchLeaderboard();
            },

            // Clear cache
            clearCache: () => {
                set({
                    cacheValid: false,
                    lastFetch: null,
                    rankings: [],
                    userRank: null,
                    userEntry: null,
                });
            },

            // Set error
            setError: (error) => {
                set({ error });
            },
        }),
        {
            name: 'leaderboard-store',
            partialize: (state) => ({
                rankings: state.rankings,
                timeFilter: state.timeFilter,
                lastFetch: state.lastFetch,
                cacheValid: false, // Always invalidate on app restart
            }),
        }
    )
);
