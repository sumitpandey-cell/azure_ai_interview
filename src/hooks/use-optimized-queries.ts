import { useCallback } from 'react';
import { useCacheStore } from '@/stores/use-cache-store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CompanyTemplate } from '@/types/company-types';
import { PerformanceHistory, PerformanceMetrics } from '@/types/performance-types';
import { interviewService } from '@/services/interview.service';
import { companyService } from '@/services/company.service';
import { profileService } from '@/services/profile.service';
import { templateService } from '@/services/template.service';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export function useOptimizedQueries() {
  const { user } = useAuth();
  const {
    sessions,
    stats,
    profile,
    leaderboard,
    sessionDetails,
    setSessions,
    setStats,
    setProfile,
    setLeaderboard,
    setSessionDetail,
    isSessionsCacheValid,
    isStatsCacheValid,
    isProfileCacheValid,
    isLeaderboardCacheValid,
    isSessionDetailCacheValid,
    onInterviewCreated,
    onInterviewCompleted,
    onInterviewUpdated,
  } = useCacheStore();

  // Optimized sessions fetch
  const fetchSessions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return [];

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isSessionsCacheValid() && sessions.length > 0) {
      return sessions;
    }

    try {
      const data = await interviewService.getUserSessions(user.id);

      if (data && data.length > 0) {
        setSessions(data);
        return data;
      }

      return sessions;
    } catch (error) {
      console.error("Error in fetchSessions:", error);
      toast.error("Failed to load sessions");
      return sessions;
    }
  }, [user?.id, sessions, isSessionsCacheValid, setSessions]);

  // Optimized stats calculation
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return null;

    // Return cached stats if valid and not forcing refresh
    if (!forceRefresh && isStatsCacheValid() && stats) {
      return stats;
    }

    try {
      // Get fresh sessions data for stats calculation
      const sessionsData = await fetchSessions(forceRefresh);

      // Calculate stats
      const totalInterviews = sessionsData.length;
      const completedSessions = sessionsData.filter(s => s.status === 'completed' && s.score !== null);
      const averageScore = completedSessions.length > 0
        ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length)
        : 0;
      // Only count duration from completed interviews to avoid inflating practice time
      const timePracticed = completedSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

      // Calculate REAL leaderboard rank using Bayesian scoring
      const rank = await interviewService.calculateUserRank(user.id);

      const calculatedStats = {
        totalInterviews,
        averageScore,
        timePracticed,
        rank
      };

      setStats(calculatedStats);
      return calculatedStats;
    } catch (error) {
      console.error("Error calculating stats:", error);
      return stats;
    }
  }, [user?.id, stats, isStatsCacheValid, setStats, fetchSessions]);

  // Optimized profile fetch
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return null;

    // Return cached profile if valid and not forcing refresh
    if (!forceRefresh && isProfileCacheValid() && profile) {
      return profile;
    }

    try {
      const data = await profileService.getProfile(user.id);

      if (data) {
        // If avatar_url is null, try to get it from user metadata (OAuth picture)
        const profileData = {
          full_name: data.full_name,
          avatar_url: data.avatar_url || user.user_metadata?.picture || null,
          streak_count: data.streak_count,
          last_activity_date: data.last_activity_date
        };
        setProfile(profileData);
        return profileData;
      }

      return profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return profile;
    }
  }, [user?.id, user?.user_metadata?.picture, profile, isProfileCacheValid, setProfile]);

  // Optimized single session fetch
  const fetchSessionDetail = useCallback(async (sessionId: string, forceRefresh = false) => {
    if (!sessionId) return null;

    // Return cached session if valid and not forcing refresh
    if (!forceRefresh && isSessionDetailCacheValid(sessionId) && sessionDetails[sessionId]) {
      return sessionDetails[sessionId];
    }

    try {
      const data = await interviewService.getSessionById(sessionId);

      if (data) {
        setSessionDetail(sessionId, data as unknown as Parameters<typeof setSessionDetail>[1]);
        return data;
      }

      return sessionDetails[sessionId] || null;
    } catch (error) {
      console.error("Error in fetchSessionDetail:", error);
      return sessionDetails[sessionId] || null;
    }
  }, [sessionDetails, isSessionDetailCacheValid, setSessionDetail]);

  // Optimized leaderboard fetch with pagination support
  const fetchLeaderboard = useCallback(async (limit = 100, page = 0, forceRefresh = false) => {
    const offset = page * limit;

    // Return cached leaderboard if valid and not forcing refresh (only for first page)
    if (!forceRefresh && page === 0 && isLeaderboardCacheValid() && leaderboard.length > 0) {
      // For cached data, we might not have the totalUsers stored in cache yet, 
      // but we know it's at least the length of the cached list.
      // In a real app, you might want to cache the total count too.
      return { users: leaderboard, totalUsers: leaderboard.length };
    }

    try {
      // 1. Fetch paginated data using RPC
      const { data, error } = await (supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }> }).rpc('get_leaderboard_paginated', {
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error("RPC Error in fetchLeaderboard:", error);
        throw error;
      }

      if (!data) {
        console.warn("fetchLeaderboard: No data returned from RPC");
        return { users: [], totalUsers: 0 };
      }

      // 2. Fetch current user context for picture/gender
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      const currentUserOAuthPicture = currentUser?.user_metadata?.picture || currentUser?.user_metadata?.avatar_url;
      const currentUserGender = currentUser?.user_metadata?.gender;

      interface LeaderboardData {
        user_id: string;
        full_name: string;
        avatar_url: string;
        interview_count: number;
        average_score: number;
        bayesian_score: number;
        total_users: number;
      }

      const results = data as unknown as LeaderboardData[];
      const totalUsers = results.length > 0 ? Number(results[0].total_users) : 0;

      // 3. Format data to match LeaderboardUser interface
      const formattedData = results.map((item) => ({
        userId: item.user_id,
        fullName: item.full_name || "Anonymous",
        avatarUrl: item.avatar_url,
        interviewCount: Number(item.interview_count || 0),
        averageScore: Number(item.average_score || 0),
        bayesianScore: Number(item.bayesian_score || 0),
        oauthPicture: item.user_id === currentUser?.id ? currentUserOAuthPicture : null,
        gender: item.user_id === currentUser?.id ? currentUserGender : undefined,
      }));

      if (page === 0 && formattedData.length > 0) {
        setLeaderboard(formattedData);
      }

      return { users: formattedData, totalUsers };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error("Error in fetchLeaderboard:", error);
      const isRlsError = error?.code === '42501' || error?.message?.includes('row-level security');
      if (!isRlsError) {
        toast.error("Failed to load leaderboard data");
      }
      if (page === 0) setLeaderboard([]);
      return { users: [], totalUsers: 0 };
    }
  }, [leaderboard, isLeaderboardCacheValid, setLeaderboard]);

  // Fetch all company templates
  const fetchCompanyTemplates = useCallback(async () => {
    try {
      const companies = await companyService.getCompanies();
      return companies as CompanyTemplate[];
    } catch (error) {
      console.error('Error in fetchCompanyTemplates:', error);
      toast.error('Failed to load company templates');
      return [];
    }
  }, []);

  // Fetch company template by slug
  const fetchCompanyTemplateBySlug = useCallback(async (slug: string) => {
    try {
      const company = await companyService.getCompanyBySlug(slug);
      return company as CompanyTemplate | null;
    } catch (error) {
      console.error('Error in fetchCompanyTemplateBySlug:', error);
      return null;
    }
  }, []);

  // Create interview session with cache invalidation
  const createInterviewSession = useCallback(async (sessionData: {
    position: string;
    interview_type: string;
    difficulty?: string;
    duration_seconds?: number;
    jobDescription?: string;
    config?: Json;
  }) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const session = await interviewService.createSession({
        userId: user.id,
        interviewType: sessionData.interview_type,
        position: sessionData.position,
        difficulty: sessionData.difficulty || (sessionData.config as Record<string, unknown> | undefined)?.difficulty as string | undefined,
        jobDescription: sessionData.jobDescription || (sessionData.config as Record<string, unknown> | undefined)?.jobDescription as string | undefined,
        config: (sessionData.config as Json) || {},
      });

      if (!session) {
        throw new Error('You already have an active interview session. Please complete or abandon it first.');
      }

      // Invalidate cache since we added a new interview
      onInterviewCreated();

      return session;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw error;
    }
  }, [user?.id, onInterviewCreated]);

  // Complete interview session with cache invalidation
  const completeInterviewSession = useCallback(async (
    sessionId: string,
    updateData: {
      score?: number;
      feedback?: Json;
      transcript?: Json;
      durationSeconds?: number;
      totalHintsUsed?: number;
      averagePerformanceScore?: number;
    }
  ) => {
    try {
      const session = await interviewService.completeSession(sessionId, updateData);

      if (!session) {
        throw new Error('Failed to complete interview session');
      }

      // Invalidate cache since we updated an interview
      onInterviewCompleted(sessionId);

      return session;
    } catch (error) {
      console.error('Error completing interview session:', error);
      throw error;
    }
  }, [onInterviewCompleted]);

  // Update interview session with cache invalidation
  const updateInterviewSession = useCallback(async (
    sessionId: string,
    updateData: Parameters<typeof interviewService.updateSession>[1]
  ) => {
    try {
      const session = await interviewService.updateSession(sessionId, updateData);

      if (!session) {
        throw new Error('Failed to update interview session');
      }

      // Invalidate cache since we updated an interview
      onInterviewUpdated(sessionId);

      return session;
    } catch (error) {
      console.error('Error updating interview session:', error);
      throw error;
    }
  }, [onInterviewUpdated]);

  // Delete interview session with cache invalidation
  const deleteInterviewSession = useCallback(async (sessionId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {

      const success = await interviewService.deleteSession(sessionId);

      if (!success) {
        throw new Error('Failed to delete interview session');
      }

      // Invalidate cache since we deleted an interview
      onInterviewUpdated(sessionId);

      return true;
    } catch (error) {
      console.error('Error deleting interview session:', error);
      throw error;
    }
  }, [onInterviewUpdated, user?.id]);

  // Fetch recent performance metrics from last 3 interviews
  const fetchRecentPerformanceMetrics = useCallback(async (): Promise<PerformanceHistory> => {
    if (!user?.id) {
      return {
        recentInterviews: [],
        averageScores: {
          technicalKnowledge: 0,
          communication: 0,
          problemSolving: 0,
          adaptability: 0,
          overall: 0,
        },
        trend: 'insufficient_data',
      };
    }

    try {

      // Fetch last 3 completed interviews with feedback
      const data = await interviewService.getRecentPerformanceMetrics(user.id, 3);

      if (!data || data.length === 0) {
        return {
          recentInterviews: [],
          averageScores: {
            technicalKnowledge: 0,
            communication: 0,
            problemSolving: 0,
            adaptability: 0,
            overall: 0,
          },
          trend: 'insufficient_data',
        };
      }


      // Extract performance metrics from each session
      const recentInterviews: PerformanceMetrics[] = data.map((session) => {
        const feedback = session.feedback as Record<string, unknown> | null;
        const skills = (feedback?.skills as Array<{ name: string; score?: number; feedback?: string }>) || [];

        return {
          sessionId: session.id,
          position: session.position,
          interviewType: session.interview_type,
          completedAt: session.completed_at || '',
          skills: skills.map((skill) => ({
            name: skill.name,
            score: skill.score || 0,
            feedback: skill.feedback || '',
          })),
          overallScore: session.score || 0,
        };
      });

      // Calculate average scores across all interviews
      const totalInterviews = recentInterviews.length;
      let techSum = 0, commSum = 0, probSum = 0, adaptSum = 0, overallSum = 0;

      recentInterviews.forEach((interview) => {
        interview.skills.forEach((skill) => {
          const skillName = skill.name.toLowerCase();
          if (skillName.includes('technical')) techSum += skill.score;
          else if (skillName.includes('communication')) commSum += skill.score;
          else if (skillName.includes('problem')) probSum += skill.score;
          else if (skillName.includes('adaptability')) adaptSum += skill.score;
        });
        overallSum += interview.overallScore;
      });

      const averageScores = {
        technicalKnowledge: Math.round(techSum / totalInterviews),
        communication: Math.round(commSum / totalInterviews),
        problemSolving: Math.round(probSum / totalInterviews),
        adaptability: Math.round(adaptSum / totalInterviews),
        overall: Math.round(overallSum / totalInterviews),
      };

      // Determine trend (comparing most recent to oldest in the set)
      let trend: PerformanceHistory['trend'] = 'insufficient_data';
      if (totalInterviews >= 2) {
        const recentScore = recentInterviews[0].overallScore;
        const oldestScore = recentInterviews[totalInterviews - 1].overallScore;
        const difference = recentScore - oldestScore;

        if (difference > 5) trend = 'improving';
        else if (difference < -5) trend = 'declining';
        else trend = 'consistent';
      }


      return {

        recentInterviews,
        averageScores,
        trend,
      };
    } catch (error) {
      console.error('Error in fetchRecentPerformanceMetrics:', error);
      return {
        recentInterviews: [],
        averageScores: {
          technicalKnowledge: 0,
          communication: 0,
          problemSolving: 0,
          adaptability: 0,
          overall: 0,
        },
        trend: 'insufficient_data',
      };
    }
  }, [user?.id]);

  // Fetch all general templates with caching
  const fetchTemplates = useCallback(async () => {
    try {
      const templates = await templateService.getAllTemplates();
      return templates;
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
      toast.error('Failed to load templates');
      return [];
    }
  }, []);

  // Fetch popular templates with caching
  const fetchPopularTemplates = useCallback(async () => {
    try {
      const templates = await templateService.getPopularTemplates();
      return templates;
    } catch (error) {
      console.error('Error in fetchPopularTemplates:', error);
      return [];
    }
  }, []);

  // Fetch single template by ID
  const fetchTemplateById = useCallback(async (id: string) => {
    try {
      const template = await templateService.getTemplateById(id);
      return template;
    } catch (error) {
      console.error('Error in fetchTemplateById:', error);
      return null;
    }
  }, []);

  // Search templates
  const searchTemplates = useCallback(async (query: string) => {
    try {
      const templates = await templateService.searchTemplates(query);
      return templates;
    } catch (error) {
      console.error('Error in searchTemplates:', error);
      return [];
    }
  }, []);

  return {
    // Data
    sessions,
    stats,
    profile,
    leaderboard,
    sessionDetails,

    // Optimized fetch functions
    fetchSessions,
    fetchStats,
    fetchProfile,
    fetchSessionDetail,
    fetchLeaderboard,
    fetchCompanyTemplates,
    fetchCompanyTemplateBySlug,
    fetchRecentPerformanceMetrics,
    fetchTemplates,
    fetchPopularTemplates,
    fetchTemplateById,
    searchTemplates,

    // CRUD operations with cache invalidation
    createInterviewSession,
    completeInterviewSession,
    updateInterviewSession,
    deleteInterviewSession,

    // Cache status
    isCached: {
      sessions: isSessionsCacheValid(),
      stats: isStatsCacheValid(),
      profile: isProfileCacheValid(),
      leaderboard: isLeaderboardCacheValid(),
      sessionDetail: (sessionId: string) => isSessionDetailCacheValid(sessionId),
    }
  };
}