"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  FileText,
  Settings,
  LogOut,
  Loader2,
  Play
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { interviewService, profileService, subscriptionService } from "@/services";
import type { InterviewSession } from "@/services/interview.service";
import { useFeedback } from "@/context/FeedbackContext";
import { MiniBarChart } from "@/components/MiniBarChart";
import { SkillProgressChart } from "@/components/SkillProgressChart";
import { WeeklyActivityChart } from "@/components/WeeklyActivityChart";
import { PerformanceAnalysisChart } from "@/components/PerformanceAnalysisChart";
import { useAnalytics } from "@/hooks/use-analytics";
import { BadgeProgressWidget } from "@/components/BadgeProgressWidget";
import { LowTimeWarningBanner } from "@/components/LowTimeWarningBanner";
import { Timer, Zap } from "lucide-react";
import { formatDuration, formatDurationShort } from "@/lib/format-duration";

// Type for user metadata
interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  gender?: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Type-safe access to user metadata
  const userMetadata = user?.user_metadata as UserMetadata | undefined;

  // Real database data
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    timePracticed: 0,
    rank: 0,
    averageScore: 0,
  });
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(15);
  const [loading, setLoading] = useState(true);

  // Use analytics hook for cached data
  const { skillProgress, weeklyActivity, streakData, performanceData } = useAnalytics(user?.id);
  const currentStreak = streakData?.currentStreak || 0;

  const { shouldRefreshDashboard, resetFeedbackState, isGenerating, currentSessionId: generatingSessionId } = useFeedback();

  // Helper to check if a session is currently generating feedback
  const isSessionGenerating = (sessionId: string) => {
    return isGenerating && generatingSessionId === sessionId;
  };

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Invalidate subscription cache to get fresh data
      if (invalidateCache) {
        invalidateCache();
      }

      // Load recent sessions
      const recentSessions = await interviewService.getSessionHistory(user.id, 5);

      // Sort sessions: generating feedback first, then by date
      const sortedSessions = recentSessions.sort((a, b) => {
        const aGenerating = a.status === 'completed' && !a.feedback;
        const bGenerating = b.status === 'completed' && !b.feedback;

        if (aGenerating && !bGenerating) return -1;
        if (!aGenerating && bGenerating) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSessions(sortedSessions);

      // Extract scores for mini chart (last 5 completed sessions with scores)
      const scores = recentSessions
        .filter(s => s.score !== null)
        .map(s => s.score as number)
        .slice(0, 5);
      setScoreHistory(scores.length > 0 ? scores : [30, 50, 40, 70, 60]); // Default values if no scores

      // Load statistics
      const sessionStats = await interviewService.getSessionStats(user.id);
      setStats({
        totalInterviews: sessionStats.completed,
        timePracticed: sessionStats.totalDuration,
        rank: 0, // TODO: Implement leaderboard
        averageScore: sessionStats.averageScore,
      });

      // Load profile
      const userProfile = await profileService.getProfile(user.id);
      setProfile(userProfile);

      // Load subscription
      const userSubscription = await subscriptionService.getSubscription(user.id);
      setSubscription(userSubscription);

      // Load remaining minutes
      const remaining = await subscriptionService.getRemainingMinutes(user.id);
      setRemainingMinutes(remaining);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when navigating back to dashboard
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]); // Removed hasFetched guard - reload every time we mount

  // Refresh data when feedback is ready
  useEffect(() => {
    if (shouldRefreshDashboard) {
      loadData();
      // Optional: reset state if you only want to refresh once per event
      // resetFeedbackState(); 
    }
  }, [shouldRefreshDashboard]);

  const { allowed, loading: subscriptionLoading, invalidateCache } = useSubscription();

  const startInterview = () => {
    router.push('/start-interview');
  };

  // Helper to render stars based on score
  const renderStars = (score: number | null) => {
    if (score === null) return null;
    const stars = Math.round(score / 20); // 0-5 stars
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Helper to format time (now accepts seconds and formats them)
  const formatTime = (seconds: number) => {
    return formatDurationShort(seconds);
  };

  return (
    <>
      {/* Shimmer animation for generating feedback */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(59, 130, 246, 0.1) 25%,
            rgba(59, 130, 246, 0.2) 50%,
            rgba(59, 130, 246, 0.1) 75%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      <DashboardLayout>
        <div className="space-y-4">
          {/* Header Section with Controls */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-0.5">
                Good morning, {userMetadata?.full_name?.split(' ')[0] || "User"}!
              </h1>
              <p className="text-muted-foreground text-xs">Arjuna AI: Your AI Voice Interviewer.</p>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5 ">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex bg-card items-center gap-1.5 hover:bg-accent border border-border rounded-full px-1.5 py-1 transition-colors">
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={getAvatarUrl(
                        userMetadata?.avatar_url,
                        user?.id || 'user',
                        'avataaars',
                        null,
                        userMetadata?.gender
                      )} />
                      <AvatarFallback className="text-xs font-medium text-foreground">{getInitials(userMetadata?.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground hidden sm:block">
                      {userMetadata?.full_name?.split(' ')[0] || "User"}
                    </span>
                    <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="text-xs">
                    <Settings className="mr-1.5 h-3 w-3" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive text-xs">
                    <LogOut className="mr-1.5 h-3 w-3" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />
            </div>
          </div>

          {/* Low Time Warning Banner */}
          {remainingMinutes < 5 && remainingMinutes > 0 && (
            <LowTimeWarningBanner
              remainingMinutes={remainingMinutes}
              variant="dashboard"
            />
          )}



          {/* Top Actions Section */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
            <Button
              className="h-auto w-full xl:w-auto px-6 xl:px-12 py-3 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md transition-transform hover:scale-105 font-medium"
              onClick={startInterview}
              disabled={subscriptionLoading || !allowed}
            >
              Start Interview
            </Button>

            <div className="grid grid-cols-2 gap-3 md:gap-0 md:flex md:divide-x md:divide-border xl:ml-auto bg-card rounded-xl p-3 md:px-6 md:py-3 shadow-sm border border-border">
              <div className="flex flex-col md:pr-5">
                <span className="text-[10px] text-muted-foreground mb-0.5 font-normal">Interviews:</span>
                <span className="text-xl md:text-2xl font-bold text-foreground">{stats?.totalInterviews || 0}</span>
              </div>

              <div className="flex flex-col md:px-5">
                <span className="text-[10px] text-muted-foreground mb-0.5 font-normal">Time:</span>
                <span className="text-xl md:text-2xl font-bold text-foreground">{formatTime(stats?.timePracticed || 0)}</span>
              </div>

              <div className="flex flex-col md:px-5">
                <span className="text-[10px] text-muted-foreground mb-0.5 font-normal">Rank:</span>
                <span className="text-xl md:text-2xl font-bold text-foreground">#{stats?.rank || 0}</span>
              </div>

              <div className="flex items-center gap-3 md:pl-5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground mb-0.5 font-normal">Stats score:</span>
                  <span className="text-xl md:text-2xl font-bold text-foreground">{stats?.averageScore || 0}%</span>
                </div>
                <div className="flex items-center">
                  <MiniBarChart
                    data={scoreHistory}
                    height={32}
                    barWidth={4}
                    gap={3}
                    color="hsl(var(--primary))"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkillProgressChart data={skillProgress} />
            <WeeklyActivityChart data={weeklyActivity} currentStreak={currentStreak} />
            <PerformanceAnalysisChart data={performanceData} />
          </div>

          {/* Badge Progress Section */}
          <BadgeProgressWidget
            earnedBadges={[]}
            totalInterviews={stats.totalInterviews}
            currentStreak={currentStreak}
            averageScore={stats.averageScore}
          />

          {/* Interview List Section */}
          <div className="bg-card rounded-xl p-3 sm:p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Recent Interviews</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/reports')}
                className="text-muted-foreground hover:text-foreground"
              >
                View All →
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="text-left border-b border-border/50">
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs pl-4">Role</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs">Date</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs">Type</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs">Duration</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs">Score</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs">Feedback</th>
                    <th className="pb-4 pt-2 font-medium text-muted-foreground text-xs text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col gap-2 w-full">
                            {[...Array(5)].map((_, index) => (
                              <div key={index} className="relative overflow-hidden rounded-lg bg-muted/30 animate-pulse h-[50px] w-full">
                                <div className="shimmer-overlay" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : sessions?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-6 w-6 text-muted-foreground/50" />
                          <p className="text-xs">No interviews yet. Start your first interview to see results here!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => {
                      const initials = session.position
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      const scoreColor = (session.score || 0) >= 70 ? "text-green-500" : (session.score || 0) >= 40 ? "text-yellow-500" : "text-red-500";
                      const isGeneratingFeedback = isSessionGenerating(session.id);

                      return (
                        <tr key={session.id} className="group hover:bg-muted/30 transition-colors relative">
                          <td className="py-3 pl-4 relative z-10">
                            {/* Shimmer overlay for generating feedback - moved inside td for valid HTML */}
                            {isGeneratingFeedback && (
                              <div className="shimmer-overlay absolute inset-0 w-full h-full pointer-events-none z-0" />
                            )}
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="h-9 w-9 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {initials}
                              </div>
                              <span className="font-semibold text-foreground text-sm">{session.position}</span>
                            </div>
                          </td>
                          <td className="py-3 relative z-10">
                            <span className="text-sm text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 relative z-10">
                            <span className="text-sm font-medium text-foreground capitalize">
                              {session.interview_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 relative z-10">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {session.duration_seconds ? formatDuration(session.duration_seconds) : '0s'}
                            </div>
                          </td>
                          <td className="py-3 relative z-10">
                            {isGeneratingFeedback ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 shadow-sm border border-blue-200/50">
                                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                <span>Generating...</span>
                              </div>
                            ) : (
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-200/50'
                                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-200/50'
                                }`}>
                                {session.status === 'completed' ? 'Completed' : 'In Progress'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 relative z-10">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold ${session.score !== null ? scoreColor : 'text-muted-foreground'}`}>
                                {session.score !== null ? `${session.score}%` : '—'}
                              </span>
                              {renderStars(session.score)}
                            </div>
                          </td>
                          <td className="py-3 relative z-10">
                            <div className="flex items-center gap-2">
                              {isGeneratingFeedback ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                                  <span>Processing feedback...</span>
                                </div>
                              ) : session.score !== null ? (
                                <>
                                  <ThumbsUp className={`h-4 w-4 ${session.score >= 70 ? "text-green-500 fill-green-500/20" : "text-muted-foreground/30"}`} />
                                  <ThumbsDown className={`h-4 w-4 ${session.score < 70 ? "text-red-500 fill-red-500/20" : "text-muted-foreground/30"}`} />
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right relative z-10">
                            <div className="flex justify-end">
                              {session.status === 'in_progress' ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={isGeneratingFeedback}
                                  onClick={() => {
                                    const stage = (session.config as any)?.currentStage || 'setup';
                                    router.push(`/interview/${session.id}/${stage}`);
                                  }}
                                  className="h-8 px-4 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                                >
                                  <Play className="h-3.5 w-3.5" />
                                  Continue
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={isGeneratingFeedback}
                                  onClick={() => router.push(`/interview/${session.id}/report`)}
                                  className={`h-8 px-4 text-xs font-medium flex items-center gap-1.5 shadow-sm ${isGeneratingFeedback
                                    ? 'bg-blue-300 text-blue-700 pointer-events-none'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                  {isGeneratingFeedback ? 'Analyzing...' : 'Report'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}