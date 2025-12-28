import { useCallback } from 'react';
import { useCacheStore } from '@/stores/use-cache-store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CompanyTemplate } from '@/types/company-types';
import { PerformanceHistory, PerformanceMetrics } from '@/types/performance-types';
import { interviewService } from '@/services/interview.service';
import { companyService } from '@/services/company.service';
import { profileService } from '@/services/profile.service';
import { leaderboardService } from '@/services/leaderboard.service';
import { templateService, Template } from '@/services/template.service';
import { supabase } from '@/integrations/supabase/client';

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
    onProfileUpdated,
  } = useCacheStore();

  // Optimized sessions fetch
  const fetchSessions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return [];

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isSessionsCacheValid() && sessions.length > 0) {
      console.log('📦 Using cached sessions data');
      return sessions;
    }

    console.log('🔄 Fetching sessions from database');
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
      console.log('📦 Using cached stats data');
      return stats;
    }

    console.log('🔄 Calculating stats from database');
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
      console.log('📦 Using cached profile data');
      return profile;
    }

    console.log('🔄 Fetching profile from database');
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
      console.log(`📦 Using cached session detail for ${sessionId}`);
      return sessionDetails[sessionId];
    }

    console.log(`🔄 Fetching session detail from database: ${sessionId}`);
    try {
      const data = await interviewService.getSessionById(sessionId);

      if (data) {
        setSessionDetail(sessionId, data as any);
        return data;
      }

      return sessionDetails[sessionId] || null;
    } catch (error) {
      console.error("Error in fetchSessionDetail:", error);
      return sessionDetails[sessionId] || null;
    }
  }, [sessionDetails, isSessionDetailCacheValid, setSessionDetail]);

  // Optimized leaderboard fetch
  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    // Return cached leaderboard if valid and not forcing refresh
    if (!forceRefresh && isLeaderboardCacheValid() && leaderboard.length > 0) {
      console.log('📦 Using cached leaderboard data');
      return leaderboard;
    }

    console.log('🔄 Fetching leaderboard from database');
    try {
      // 1. Fetch all completed interview sessions with scores
      const { data: sessions, error: sessionsError } = await supabase
        .from("interview_sessions")
        .select("user_id, score")
        .not("score", "is", null)
        .eq("status", "completed");

      if (sessionsError) throw sessionsError;

      // 2. Aggregate scores by user
      const userStats: Record<string, { totalScore: number; count: number }> = {};

      sessions?.forEach((session) => {
        if (!userStats[session.user_id]) {
          userStats[session.user_id] = { totalScore: 0, count: 0 };
        }
        userStats[session.user_id].totalScore += session.score || 0;
        userStats[session.user_id].count += 1;
      });

      // 3. Calculate Weighted Score (rewards both performance and experience)
      const rankedUsers = Object.entries(userStats).map(([userId, stats]) => {
        const avgScore = stats.totalScore / stats.count;
        const experienceMultiplier = 1 + (Math.log10(stats.count) / 10);
        const weightedScore = avgScore * experienceMultiplier;

        return {
          userId,
          interviewCount: stats.count,
          averageScore: avgScore,
          bayesianScore: weightedScore,
        };
      });

      // 4. Sort by Bayesian Score
      const sortedUsers = rankedUsers.sort((a, b) => b.bayesianScore - a.bayesianScore);

      // 5. Fetch profiles for all ranked users
      if (sortedUsers.length > 0) {
        const userIds = sortedUsers.map((u) => u.userId);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Get current user's OAuth picture if they're in the leaderboard
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const currentUserOAuthPicture = currentUser?.user_metadata?.picture || currentUser?.user_metadata?.avatar_url;
        const currentUserGender = currentUser?.user_metadata?.gender;

        // Merge profile data
        const finalLeaderboard = sortedUsers.map((user) => {
          const profile = profiles?.find((p) => p.id === user.userId);
          const oauthPicture = user.userId === currentUser?.id ? currentUserOAuthPicture : null;
          const gender = user.userId === currentUser?.id ? currentUserGender : undefined;

          return {
            ...user,
            fullName: profile?.full_name || "Anonymous",
            avatarUrl: profile?.avatar_url ?? null,
            oauthPicture: oauthPicture,
            gender: gender,
          };
        });

        setLeaderboard(finalLeaderboard);
        return finalLeaderboard;
      } else {
        setLeaderboard([]);
        return [];
      }
    } catch (error) {
      console.error("Error in fetchLeaderboard:", error);
      toast.error("Failed to load leaderboard data");
      return leaderboard;
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
    duration_seconds?: number;
    config?: any;
  }) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const session = await interviewService.createSession({
        userId: user.id,
        interviewType: sessionData.interview_type,
        position: sessionData.position,
        config: sessionData.config || {},
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      // Invalidate cache since we added a new interview
      onInterviewCreated();

      console.log('✅ Interview session created, cache invalidated');
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
      feedback?: any;
      transcript?: any;
      durationMinutes?: number;
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

      console.log(`✅ Interview ${sessionId} completed, cache invalidated`);
      return session;
    } catch (error) {
      console.error('Error completing interview session:', error);
      throw error;
    }
  }, [onInterviewCompleted]);

  // Update interview session with cache invalidation
  const updateInterviewSession = useCallback(async (
    sessionId: string,
    updateData: Partial<any>
  ) => {
    try {
      const session = await interviewService.updateSession(sessionId, updateData);

      if (!session) {
        throw new Error('Failed to update interview session');
      }

      // Invalidate cache since we updated an interview
      onInterviewUpdated(sessionId);

      console.log(`✅ Interview ${sessionId} updated, cache invalidated`);
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
      console.log(`🗑️ Attempting to delete session ${sessionId}`);

      const success = await interviewService.deleteSession(sessionId);

      if (!success) {
        throw new Error('Failed to delete interview session');
      }

      // Invalidate cache since we deleted an interview
      onInterviewUpdated(sessionId);

      console.log(`✅ Interview ${sessionId} deleted successfully, cache invalidated`);
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
      console.log('🔍 Fetching recent performance metrics for user:', user.id);

      // Fetch last 3 completed interviews with feedback
      const data = await interviewService.getRecentPerformanceMetrics(user.id, 3);

      if (!data || data.length === 0) {
        console.log('📊 No previous interview data found');
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

      console.log(`📊 Found ${data.length} previous interviews with feedback`);

      // Extract performance metrics from each session
      const recentInterviews: PerformanceMetrics[] = data.map((session) => {
        const feedback = session.feedback as any;
        const skills = feedback?.skills || [];

        return {
          sessionId: session.id,
          position: session.position,
          interviewType: session.interview_type,
          completedAt: session.completed_at || '',
          skills: skills.map((skill: any) => ({
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

      console.log('📈 Performance metrics calculated:', {
        totalInterviews,
        averageScores,
        trend,
      });

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