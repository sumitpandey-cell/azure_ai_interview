import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Campaign, TopCandidate, Stats } from '@/types/recruiter-types';
import { recruiterService } from '@/services/recruiter/recruiter.service';

interface RecruiterState {
    campaigns: Campaign[];
    topCandidates: TopCandidate[];
    stats: Stats;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchDashboardData: (userId: string, force?: boolean) => Promise<void>;
    clearError: () => void;
}

const DEFAULT_STATS: Stats = {
    activeCampaigns: 0,
    totalApplicants: 0,
    interviewsThisWeek: 0,
    avgScore: 0
};

export const useRecruiterStore = create<RecruiterState>()(
    persist(
        (set, get) => ({
            campaigns: [],
            topCandidates: [],
            stats: DEFAULT_STATS,
            loading: false,
            error: null,
            lastFetched: null,

            fetchDashboardData: async (userId: string, force = false) => {
                const { lastFetched, loading } = get();

                // Cache for 5 minutes unless forced
                const CACHE_TIME = 5 * 60 * 1000;
                if (!force && lastFetched && (Date.now() - lastFetched < CACHE_TIME)) {
                    return;
                }

                if (loading) return;

                set({ loading: true, error: null });

                try {
                    const data = await recruiterService.fetchDashboardData(userId);

                    if (data) {
                        set({
                            campaigns: data.campaigns,
                            stats: data.stats,
                            topCandidates: data.topCandidates,
                            lastFetched: Date.now(),
                            loading: false
                        });
                    } else {
                        set({ loading: false });
                    }
                } catch (error: any) {
                    set({
                        error: error?.message || 'Failed to fetch recruiter dashboard data',
                        loading: false
                    });
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'recruiter-storage',
            partialize: (state) => ({
                campaigns: state.campaigns,
                topCandidates: state.topCandidates,
                stats: state.stats,
                lastFetched: state.lastFetched
            }),
        }
    )
);
