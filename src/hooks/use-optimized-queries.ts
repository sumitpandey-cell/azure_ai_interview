import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

// Type definitions
type InterviewSession = Tables<'interview_sessions'>;
type Profile = Tables<'profiles'>;

interface Stats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  totalDuration: number;
  recentActivity: number;
}

interface CacheState {
  sessions: boolean;
  stats: boolean;
  profile: boolean;
  sessionDetails: Map<string, boolean>;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const cache = {
  sessions: { data: null as InterviewSession[] | null, timestamp: 0 },
  stats: { data: null as Stats | null, timestamp: 0 },
  profile: { data: null as Profile | null, timestamp: 0 },
  sessionDetails: new Map<string, { data: InterviewSession | null; timestamp: number }>(),
};

// Helper to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export function useOptimizedQueries() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cacheState, setCacheState] = useState<CacheState>({
    sessions: false,
    stats: false,
    profile: false,
    sessionDetails: new Map(),
  });

  // Fetch all interview sessions for the current user
  const fetchSessions = useCallback(async (): Promise<InterviewSession[]> => {
    if (!user) {
      console.warn('No user logged in');
      return [];
    }

    // Check cache first
    if (isCacheValid(cache.sessions.timestamp) && cache.sessions.data) {
      setSessions(cache.sessions.data);
      setCacheState(prev => ({ ...prev, sessions: true }));
      return cache.sessions.data;
    }

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessions = data || [];

      // Update cache
      cache.sessions = { data: sessions, timestamp: Date.now() };
      setSessions(sessions);
      setCacheState(prev => ({ ...prev, sessions: true }));

      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }, [user]);

  // Fetch a specific session detail
  const fetchSessionDetail = useCallback(async (sessionId: string): Promise<InterviewSession | null> => {
    if (!user) {
      console.warn('No user logged in');
      return null;
    }

    // Check cache first
    const cachedSession = cache.sessionDetails.get(sessionId);
    if (cachedSession && isCacheValid(cachedSession.timestamp)) {
      setCacheState(prev => {
        const newMap = new Map(prev.sessionDetails);
        newMap.set(sessionId, true);
        return { ...prev, sessionDetails: newMap };
      });
      return cachedSession.data;
    }

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Update cache
      cache.sessionDetails.set(sessionId, { data, timestamp: Date.now() });
      setCacheState(prev => {
        const newMap = new Map(prev.sessionDetails);
        newMap.set(sessionId, true);
        return { ...prev, sessionDetails: newMap };
      });

      return data;
    } catch (error) {
      console.error('Error fetching session detail:', error);
      return null;
    }
  }, [user]);

  // Fetch user statistics
  const fetchStats = useCallback(async (): Promise<Stats | null> => {
    if (!user) {
      console.warn('No user logged in');
      return null;
    }

    // Check cache first
    if (isCacheValid(cache.stats.timestamp) && cache.stats.data) {
      setStats(cache.stats.data);
      setCacheState(prev => ({ ...prev, stats: true }));
      return cache.stats.data;
    }

    try {
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
      const sessionsWithScores = completedSessions.filter(s => s.score !== null);

      const stats: Stats = {
        totalInterviews: sessions?.length || 0,
        completedInterviews: completedSessions.length,
        averageScore: sessionsWithScores.length > 0
          ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.score || 0), 0) / sessionsWithScores.length)
          : 0,
        totalDuration: sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0,
        recentActivity: sessions?.filter(s => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(s.created_at) > weekAgo;
        }).length || 0,
      };

      // Update cache
      cache.stats = { data: stats, timestamp: Date.now() };
      setStats(stats);
      setCacheState(prev => ({ ...prev, stats: true }));

      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }, [user]);

  // Fetch user profile
  const fetchProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) {
      console.warn('No user logged in');
      return null;
    }

    // Check cache first
    if (isCacheValid(cache.profile.timestamp) && cache.profile.data) {
      setProfile(cache.profile.data);
      setCacheState(prev => ({ ...prev, profile: true }));
      return cache.profile.data;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Update cache
      cache.profile = { data, timestamp: Date.now() };
      setProfile(data);
      setCacheState(prev => ({ ...prev, profile: true }));

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, [user]);

  // Delete an interview session
  const deleteInterviewSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate caches
      cache.sessions.timestamp = 0;
      cache.stats.timestamp = 0;
      cache.sessionDetails.delete(sessionId);

      // Update local state optimistically
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setCacheState(prev => {
        const newMap = new Map(prev.sessionDetails);
        newMap.delete(sessionId);
        return { ...prev, sessions: false, stats: false, sessionDetails: newMap };
      });

      // Refetch to ensure consistency
      await fetchSessions();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }, [user, fetchSessions, fetchStats]);

  // Update an interview session
  const updateInterviewSession = useCallback(async (
    sessionId: string,
    updates: Partial<InterviewSession>
  ): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate caches
      cache.sessions.timestamp = 0;
      cache.stats.timestamp = 0;
      cache.sessionDetails.delete(sessionId);

      // Update local state optimistically
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
      setCacheState(prev => {
        const newMap = new Map(prev.sessionDetails);
        newMap.delete(sessionId);
        return { ...prev, sessions: false, stats: false, sessionDetails: newMap };
      });
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }, [user]);

  // Invalidate all caches
  const invalidateCache = useCallback(() => {
    cache.sessions.timestamp = 0;
    cache.stats.timestamp = 0;
    cache.profile.timestamp = 0;
    cache.sessionDetails.clear();
    setCacheState({
      sessions: false,
      stats: false,
      profile: false,
      sessionDetails: new Map(),
    });
  }, []);

  return {
    // Data
    sessions,
    stats,
    profile,

    // Fetch functions
    fetchSessions,
    fetchStats,
    fetchProfile,
    fetchSessionDetail,

    // Mutation functions
    deleteInterviewSession,
    updateInterviewSession,

    // Cache utilities
    invalidateCache,
    isCached: {
      sessions: cacheState.sessions,
      stats: cacheState.stats,
      profile: cacheState.profile,
      sessionDetail: (sessionId: string) => cacheState.sessionDetails.get(sessionId) || false,
    },
  };
}