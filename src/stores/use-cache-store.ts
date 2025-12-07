import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InterviewSession {
  id: string;
  interview_type: string;
  position: string;
  score: number | null;
  status: string;
  created_at: string;
  duration_minutes: number | null;
  completed_at: string | null;
  user_id: string;
  config?: any; // JSONB field for storing interview configuration
  feedback?: any;
  transcript?: any;
}

interface CacheState {
  // Sessions cache
  sessions: InterviewSession[];
  sessionsLastFetch: number | null;
  sessionsCacheValid: boolean;

  // Stats cache
  stats: {
    totalInterviews: number;
    averageScore: number;
    timePracticed: number;
    rank: number;
  } | null;
  statsLastFetch: number | null;
  statsCacheValid: boolean;

  // Profile cache
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    streak_count: number;
    last_activity_date: string | null;
  } | null;
  profileLastFetch: number | null;
  profileCacheValid: boolean;

  // Streak cache
  streak: number | null;
  streakLastFetch: number | null;
  streakCacheValid: boolean;

  // Individual session cache
  sessionDetails: Record<string, InterviewSession>;
  sessionDetailsLastFetch: Record<string, number>;
  sessionDetailsCacheValid: Record<string, boolean>;

  // Cache actions
  setSessions: (sessions: InterviewSession[]) => void;
  invalidateSessions: () => void;
  setStats: (stats: any) => void;
  invalidateStats: () => void;
  setProfile: (profile: { full_name: string | null; avatar_url: string | null; streak_count: number; last_activity_date: string | null }) => void;
  invalidateProfile: () => void;
  setStreak: (streak: number) => void;
  invalidateStreak: () => void;
  setSessionDetail: (sessionId: string, session: InterviewSession) => void;
  invalidateSessionDetail: (sessionId: string) => void;
  invalidateAllCache: () => void;

  // Cache validation
  isSessionsCacheValid: () => boolean;
  isStatsCacheValid: () => boolean;
  isProfileCacheValid: () => boolean;
  isStreakCacheValid: () => boolean;
  isSessionDetailCacheValid: (sessionId: string) => boolean;

  // Event tracking for cache invalidation
  onInterviewCreated: () => void;
  onInterviewCompleted: (sessionId: string) => void;
  onInterviewUpdated: (sessionId: string) => void;
  onProfileUpdated: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      sessionsLastFetch: null,
      sessionsCacheValid: false,

      stats: null,
      statsLastFetch: null,
      statsCacheValid: false,

      profile: null,
      profileLastFetch: null,
      profileCacheValid: false,

      streak: null,
      streakLastFetch: null,
      streakCacheValid: false,

      sessionDetails: {},
      sessionDetailsLastFetch: {},
      sessionDetailsCacheValid: {},

      // Cache setters
      setSessions: (sessions) => set({
        sessions,
        sessionsLastFetch: Date.now(),
        sessionsCacheValid: true
      }),

      invalidateSessions: () => set({
        sessionsCacheValid: false,
        sessions: []
      }),

      setStats: (stats) => set({
        stats,
        statsLastFetch: Date.now(),
        statsCacheValid: true
      }),

      invalidateStats: () => set({
        statsCacheValid: false,
        stats: null
      }),

      setProfile: (profile) => set({
        profile,
        profileLastFetch: Date.now(),
        profileCacheValid: true
      }),

      invalidateProfile: () => set({
        profileCacheValid: false,
        profile: null
      }),

      setStreak: (streak) => set({
        streak,
        streakLastFetch: Date.now(),
        streakCacheValid: true
      }),

      invalidateStreak: () => set({
        streakCacheValid: false,
        streak: null
      }),

      setSessionDetail: (sessionId, session) => set((state) => ({
        sessionDetails: { ...state.sessionDetails, [sessionId]: session },
        sessionDetailsLastFetch: { ...state.sessionDetailsLastFetch, [sessionId]: Date.now() },
        sessionDetailsCacheValid: { ...state.sessionDetailsCacheValid, [sessionId]: true }
      })),

      invalidateSessionDetail: (sessionId) => set((state) => {
        const newDetails = { ...state.sessionDetails };
        const newLastFetch = { ...state.sessionDetailsLastFetch };
        const newValid = { ...state.sessionDetailsCacheValid };

        delete newDetails[sessionId];
        delete newLastFetch[sessionId];
        delete newValid[sessionId];

        return {
          sessionDetails: newDetails,
          sessionDetailsLastFetch: newLastFetch,
          sessionDetailsCacheValid: newValid
        };
      }),

      invalidateAllCache: () => set({
        sessionsCacheValid: false,
        statsCacheValid: false,
        profileCacheValid: false,
        streakCacheValid: false,
        sessionDetailsCacheValid: {},
        sessions: [],
        stats: null,
        profile: null,
        streak: null,
        sessionDetails: {},
        sessionDetailsLastFetch: {},
      }),

      // Cache validation
      isSessionsCacheValid: () => {
        const state = get();
        if (!state.sessionsCacheValid || !state.sessionsLastFetch) return false;
        return Date.now() - state.sessionsLastFetch < CACHE_DURATION;
      },

      isStatsCacheValid: () => {
        const state = get();
        if (!state.statsCacheValid || !state.statsLastFetch) return false;
        return Date.now() - state.statsLastFetch < CACHE_DURATION;
      },

      isProfileCacheValid: () => {
        const state = get();
        return Date.now() - state.profileLastFetch < CACHE_DURATION;
      },

      isStreakCacheValid: () => {
        const state = get();
        if (!state.streakCacheValid || !state.streakLastFetch) return false;
        return Date.now() - state.streakLastFetch < CACHE_DURATION;
      },

      isSessionDetailCacheValid: (sessionId) => {
        const state = get();
        if (!state.sessionDetailsCacheValid[sessionId] || !state.sessionDetailsLastFetch[sessionId]) {
          return false;
        }
        return Date.now() - state.sessionDetailsLastFetch[sessionId] < CACHE_DURATION;
      },

      // Event handlers for cache invalidation
      onInterviewCreated: () => {
        const state = get();
        // Invalidate sessions and stats when new interview is created
        set({
          sessionsCacheValid: false,
          statsCacheValid: false
        });
      },

      onInterviewCompleted: (sessionId) => {
        const state = get();
        // Invalidate all related caches when interview is completed
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          sessionDetailsCacheValid: {
            ...state.sessionDetailsCacheValid,
            [sessionId]: false
          }
        });
      },

      onInterviewUpdated: (sessionId) => {
        const state = get();
        // Invalidate specific session and general caches
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          sessionDetailsCacheValid: {
            ...state.sessionDetailsCacheValid,
            [sessionId]: false
          }
        });
      },

      onProfileUpdated: () => {
        // Invalidate profile cache when profile is updated
        set({
          profileCacheValid: false
        });
      },
    }),
    {
      name: 'cache-storage',
      // Only persist cache flags and timestamps, not the actual data
      partialize: (state) => ({
        sessionsLastFetch: state.sessionsLastFetch,
        sessionsCacheValid: false, // Always invalidate on app restart
        statsLastFetch: state.statsLastFetch,
        statsCacheValid: false, // Always invalidate on app restart
        profileLastFetch: state.profileLastFetch,
        profileCacheValid: false,
        streakLastFetch: state.streakLastFetch,
        streakCacheValid: false,
        sessionDetailsLastFetch: state.sessionDetailsLastFetch,
        sessionDetailsCacheValid: {}, // Always invalidate on app restart
      }),
    }
  )
);