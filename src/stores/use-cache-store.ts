import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SkillData, WeeklyActivityData, PerformanceData, StreakData } from '@/services/analytics.service';
import type { Json } from '@/integrations/supabase/types';

interface InterviewSession {
  id: string;
  interview_type: string;
  position: string;
  score: number | null;
  status: string;
  created_at: string;
  duration_seconds: number | null;
  completed_at: string | null;
  user_id: string;
  config?: Json; // JSONB field for storing interview configuration
  feedback?: Json;
  transcript?: Json;
}

interface LeaderboardUser {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  oauthPicture?: string | null;
  interviewCount: number;
  averageScore: number;
  bayesianScore: number;
  gender?: string;
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

  // Leaderboard cache
  leaderboard: LeaderboardUser[];
  leaderboardLastFetch: number | null;
  leaderboardCacheValid: boolean;

  // Individual session cache
  sessionDetails: Record<string, InterviewSession>;
  sessionDetailsLastFetch: Record<string, number>;
  sessionDetailsCacheValid: Record<string, boolean>;

  // Analytics cache
  skillProgress: SkillData[];
  skillProgressLastFetch: number | null;
  skillProgressCacheValid: boolean;

  weeklyActivity: WeeklyActivityData[];
  weeklyActivityLastFetch: number | null;
  weeklyActivityCacheValid: boolean;

  streakData: StreakData | null;
  streakDataLastFetch: number | null;
  streakDataCacheValid: boolean;

  performanceData: PerformanceData[];
  performanceDataLastFetch: number | null;
  performanceDataCacheValid: boolean;

  // Cache actions
  setSessions: (sessions: InterviewSession[]) => void;
  invalidateSessions: () => void;
  setStats: (stats: { totalInterviews: number; averageScore: number; timePracticed: number; rank: number }) => void;
  invalidateStats: () => void;
  setProfile: (profile: { full_name: string | null; avatar_url: string | null; streak_count: number; last_activity_date: string | null }) => void;
  invalidateProfile: () => void;
  setStreak: (streak: number) => void;
  invalidateStreak: () => void;
  setLeaderboard: (leaderboard: LeaderboardUser[]) => void;
  invalidateLeaderboard: () => void;
  setSessionDetail: (sessionId: string, session: InterviewSession) => void;
  invalidateSessionDetail: (sessionId: string) => void;

  // Analytics cache actions
  setSkillProgress: (data: SkillData[]) => void;
  invalidateSkillProgress: () => void;
  setWeeklyActivity: (data: WeeklyActivityData[]) => void;
  invalidateWeeklyActivity: () => void;
  setStreakData: (data: StreakData) => void;
  invalidateStreakData: () => void;
  setPerformanceData: (data: PerformanceData[]) => void;
  invalidatePerformanceData: () => void;
  invalidateAllAnalytics: () => void;

  invalidateAllCache: () => void;

  // Cache validation
  isSessionsCacheValid: () => boolean;
  isStatsCacheValid: () => boolean;
  isProfileCacheValid: () => boolean;
  isStreakCacheValid: () => boolean;
  isLeaderboardCacheValid: () => boolean;
  isSessionDetailCacheValid: (sessionId: string) => boolean;

  // Analytics cache validation
  isSkillProgressCacheValid: () => boolean;
  isWeeklyActivityCacheValid: () => boolean;
  isStreakDataCacheValid: () => boolean;
  isPerformanceDataCacheValid: () => boolean;

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

      leaderboard: [],
      leaderboardLastFetch: null,
      leaderboardCacheValid: false,

      // Analytics initial state
      skillProgress: [],
      skillProgressLastFetch: null,
      skillProgressCacheValid: false,

      weeklyActivity: [],
      weeklyActivityLastFetch: null,
      weeklyActivityCacheValid: false,

      streakData: null,
      streakDataLastFetch: null,
      streakDataCacheValid: false,

      performanceData: [],
      performanceDataLastFetch: null,
      performanceDataCacheValid: false,

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

      setLeaderboard: (leaderboard) => set({
        leaderboard,
        leaderboardLastFetch: Date.now(),
        leaderboardCacheValid: true
      }),

      invalidateLeaderboard: () => set({
        leaderboardCacheValid: false,
        leaderboard: []
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

      // Analytics cache setters
      setSkillProgress: (data) => set({
        skillProgress: data,
        skillProgressLastFetch: Date.now(),
        skillProgressCacheValid: true
      }),

      invalidateSkillProgress: () => set({
        skillProgressCacheValid: false,
        skillProgress: []
      }),

      setWeeklyActivity: (data) => set({
        weeklyActivity: data,
        weeklyActivityLastFetch: Date.now(),
        weeklyActivityCacheValid: true
      }),

      invalidateWeeklyActivity: () => set({
        weeklyActivityCacheValid: false,
        weeklyActivity: []
      }),

      setStreakData: (data) => set({
        streakData: data,
        streakDataLastFetch: Date.now(),
        streakDataCacheValid: true
      }),

      invalidateStreakData: () => set({
        streakDataCacheValid: false,
        streakData: null
      }),

      setPerformanceData: (data) => set({
        performanceData: data,
        performanceDataLastFetch: Date.now(),
        performanceDataCacheValid: true
      }),

      invalidatePerformanceData: () => set({
        performanceDataCacheValid: false,
        performanceData: []
      }),

      invalidateAllAnalytics: () => set({
        skillProgressCacheValid: false,
        weeklyActivityCacheValid: false,
        streakDataCacheValid: false,
        performanceDataCacheValid: false,
        skillProgress: [],
        weeklyActivity: [],
        streakData: null,
        performanceData: []
      }),

      invalidateAllCache: () => set({
        sessionsCacheValid: false,
        statsCacheValid: false,
        profileCacheValid: false,
        streakCacheValid: false,
        leaderboardCacheValid: false,
        sessionDetailsCacheValid: {},
        sessions: [],
        stats: null,
        profile: null,
        streak: null,
        leaderboard: [],
        sessionDetails: {},
        sessionDetailsLastFetch: {},
        // Analytics
        skillProgressCacheValid: false,
        weeklyActivityCacheValid: false,
        streakDataCacheValid: false,
        performanceDataCacheValid: false,
        skillProgress: [],
        weeklyActivity: [],
        streakData: null,
        performanceData: []
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
        if (!state.profileCacheValid || !state.profileLastFetch) return false;
        return Date.now() - state.profileLastFetch < CACHE_DURATION;
      },

      isStreakCacheValid: () => {
        const state = get();
        if (!state.streakCacheValid || !state.streakLastFetch) return false;
        return Date.now() - state.streakLastFetch < CACHE_DURATION;
      },

      isLeaderboardCacheValid: () => {
        const state = get();
        if (!state.leaderboardCacheValid || !state.leaderboardLastFetch) return false;
        return Date.now() - state.leaderboardLastFetch < CACHE_DURATION;
      },

      isSessionDetailCacheValid: (sessionId) => {
        const state = get();
        if (!state.sessionDetailsCacheValid[sessionId] || !state.sessionDetailsLastFetch[sessionId]) {
          return false;
        }
        return Date.now() - state.sessionDetailsLastFetch[sessionId] < CACHE_DURATION;
      },

      // Analytics cache validation
      isSkillProgressCacheValid: () => {
        const state = get();
        if (!state.skillProgressCacheValid || !state.skillProgressLastFetch) return false;
        return Date.now() - state.skillProgressLastFetch < CACHE_DURATION;
      },

      isWeeklyActivityCacheValid: () => {
        const state = get();
        if (!state.weeklyActivityCacheValid || !state.weeklyActivityLastFetch) return false;
        return Date.now() - state.weeklyActivityLastFetch < CACHE_DURATION;
      },

      isStreakDataCacheValid: () => {
        const state = get();
        if (!state.streakDataCacheValid || !state.streakDataLastFetch) return false;
        return Date.now() - state.streakDataLastFetch < CACHE_DURATION;
      },

      isPerformanceDataCacheValid: () => {
        const state = get();
        if (!state.performanceDataCacheValid || !state.performanceDataLastFetch) return false;
        return Date.now() - state.performanceDataLastFetch < CACHE_DURATION;
      },

      // Event handlers for cache invalidation
      onInterviewCreated: () => {
        // Invalidate sessions, stats, and leaderboard when new interview is created
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          leaderboardCacheValid: false
        });
      },

      onInterviewCompleted: (sessionId) => {
        const state = get();
        // Invalidate all related caches when interview is completed
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          leaderboardCacheValid: false,
          sessionDetailsCacheValid: {
            ...state.sessionDetailsCacheValid,
            [sessionId]: false
          },
          // Invalidate analytics cache
          skillProgressCacheValid: false,
          weeklyActivityCacheValid: false,
          streakDataCacheValid: false,
          performanceDataCacheValid: false
        });
      },

      onInterviewUpdated: (sessionId) => {
        const state = get();
        // Invalidate specific session and general caches
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          leaderboardCacheValid: false,
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
        leaderboardLastFetch: state.leaderboardLastFetch,
        leaderboardCacheValid: false,
        sessionDetailsLastFetch: state.sessionDetailsLastFetch,
        sessionDetailsCacheValid: {}, // Always invalidate on app restart
      }),
    }
  )
);