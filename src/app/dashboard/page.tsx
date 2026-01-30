"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {

  Clock,
  FileText,
  Settings,
  LogOut,
  Play,
  Building2,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  Target,
  History,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import { PaymentStatusModal, type PaymentStatus } from "@/components/PaymentStatusModal";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakIndicator } from "@/components/StreakIndicator";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { subscriptionService, badgeService } from "@/services";
import { useFeedback } from "@/context/FeedbackContext";
import { MiniBarChart } from "@/components/MiniBarChart";
import { SkillProgressChart } from "@/components/SkillProgressChart";
import { WeeklyActivityChart } from "@/components/WeeklyActivityChart";
import { PerformanceAnalysisChart } from "@/components/PerformanceAnalysisChart";
import { useAnalytics } from "@/hooks/use-analytics";
import { LowTimeWarningBanner } from "@/components/LowTimeWarningBanner";
import { formatDurationShort } from "@/lib/format-duration";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";

// Type for user metadata
interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  gender?: string;
}

function DashboardContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Type-safe access to user metadata
  const userMetadata = user?.user_metadata as UserMetadata | undefined;

  // Use optimized queries with caching
  const {
    sessions,
    stats,
    fetchSessions,
    fetchStats,
    fetchProfile,
    isCached
  } = useOptimizedQueries();

  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  // const [earnedBadges, setEarnedBadges] = useState<string[]>([]); // Unused
  // const [subscription, setSubscription] = useState<unknown>(null); // Unused
  // const [remainingSeconds, setRemainingSeconds] = useState<number>(3600); // Unused
  const [loading, setLoading] = useState(!isCached.sessions);

  // Use analytics hook for cached data
  const { skillProgress, weeklyActivity, streakData, performanceData } = useAnalytics(user?.id);
  const currentStreak = streakData?.currentStreak || 0;

  const {
    shouldRefreshDashboard,
    isGenerating,
    currentSessionId: generatingSessionId,
  } = useFeedback();

  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    status: PaymentStatus;
    details?: string;
  }>({ isOpen: false, status: "success" });

  const [navigatingSessionId, setNavigatingSessionId] = useState<string | null>(null);

  // Helper to check if a session is currently generating feedback
  const isSessionGenerating = (sessionId: string) => {
    return isGenerating && generatingSessionId === sessionId;
  };

  const loadData = useCallback(async (force = false) => {
    if (!user?.id) return;

    try {
      // Only show loading if we don't have cached data and aren't forcing refresh
      if (!isCached.sessions && !force) {
        setLoading(true);
      }

      // Parallelize loading for better performance
      const [recentSessions] = await Promise.all([
        fetchSessions(force),
        fetchStats(force),
        fetchProfile(force)
      ]);

      // Load additional data not yet in optimized queries
      /* const [remaining, userBadges, userSubscription] = */ await Promise.all([
        subscriptionService.getRemainingSeconds(user.id),
        badgeService.getUserBadges(user.id),
        subscriptionService.getSubscription(user.id)
      ]);

      // setRemainingSeconds(remaining); // Unused
      // setSubscription(userSubscription); // Unused

      // const earnedSlugs = userBadges.map((ub: { badge: { slug: string } }) => ub.badge.slug);
      // setEarnedBadges(earnedSlugs); // Unused

      // Extract scores for mini chart
      if (recentSessions) {
        const scores = recentSessions
          .filter(s => s.score !== null)
          .map(s => s.score as number)
          .slice(0, 5);
        setScoreHistory(scores.length > 0 ? scores : [30, 50, 40, 70, 60]);
      }

      // Trigger catch-up check for badges (especially if they just finished an interview)
      const newlyAwarded = await badgeService.checkAndAwardBadges(user.id);
      if (newlyAwarded.length > 0) {
        // setEarnedBadges(prev => [...prev, ...newlyAwarded.map(b => b.slug)]); // Unused
        newlyAwarded.forEach(b => {
          toast.success(`Achievement Unlocked!`, {
            description: `You've earned the ${b.name} badge!`,
            icon: b.icon_name,
          });
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isCached.sessions, fetchSessions, fetchStats, fetchProfile]);

  // Load data on mount and when navigating back to dashboard
  useEffect(() => {
    if (user?.id) {
      // Only load if not cached or data is missing
      if (!isCached.sessions || !isCached.stats || !isCached.profile) {
        loadData();
      } else {
        setLoading(false);
        // Still sync score history from cache
        const scores = sessions
          .filter(s => s.score !== null)
          .map(s => s.score as number)
          .slice(0, 5);
        if (scores.length > 0) setScoreHistory(scores);
      }
    }
  }, [user?.id, isCached.sessions, isCached.stats, isCached.profile, loadData, sessions]);

  // Refresh data when feedback is ready
  useEffect(() => {
    if (shouldRefreshDashboard) {
      loadData(true); // Force refresh
    }
  }, [shouldRefreshDashboard, loadData]);

  // Use subscription hook for all subscription data
  const { allowed, loading: subscriptionLoading, remaining_seconds, invalidateCache } = useSubscription();

  // Handle payment success redirect
  useEffect(() => {
    const status = searchParams.get('payment') as PaymentStatus | null;
    if (!status) return;

    // Pricing page handles failures/cancellations
    if (status === 'failed' || status === 'cancelled') return;

    setPaymentModal({
      isOpen: true,
      status,
      details: searchParams.get('reason') || undefined
    });

    if (status === 'success') {
      invalidateCache();
      loadData(true);
    }

    // Clear query params
    const newPath = window.location.pathname;
    window.history.replaceState({}, '', newPath);
  }, [searchParams, invalidateCache, loadData]);

  const startInterview = async () => {
    // Check balance before proceeding
    const { remainingSeconds: remaining } = await subscriptionService.checkUsageLimit(user?.id || '');
    if (remaining < 120) {
      toast.error("Insufficient balance", {
        description: "You need at least 2 minutes of interview time to start a new session. Please upgrade your plan.",
        duration: 5000,
        action: {
          label: "Upgrade",
          onClick: () => router.push("/pricing")
        }
      });
      return;
    }
    router.push('/start-interview');
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
            rgba(var(--primary-rgb), 0.05) 25%,
            rgba(var(--primary-rgb), 0.15) 50%,
            rgba(var(--primary-rgb), 0.05) 75%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>


      <DashboardLayout
        headerControls={(
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <StreakIndicator streak={currentStreak} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center h-9 w-9 rounded-full border border-border/40 hover:bg-accent transition-colors active:scale-95 overflow-hidden">
                  <Avatar className="h-full w-full">
                    {authLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <>
                        <AvatarImage src={getAvatarUrl(
                          userMetadata?.avatar_url,
                          user?.id || 'user',
                          'avataaars',
                          null,
                          userMetadata?.gender
                        )} />
                        <AvatarFallback className="text-xs font-bold">{getInitials(userMetadata?.full_name)}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="px-3 py-2 mb-1 border-b border-border/40">
                  <p className="text-sm font-bold truncate text-foreground">{userMetadata?.full_name || "User"}</p>
                  <p className="text-[10px] font-medium truncate text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-border/40" />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      >
        <div className="space-y-4 pb-12">
          {/* Header Section - Greeting and Desktop Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-xs font-medium text-muted-foreground">System Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
                {authLoading ? (
                  <Skeleton className="inline-block h-8 w-32 bg-muted/50 align-middle" />
                ) : (
                  <span className="text-primary">
                    {userMetadata?.full_name?.split(' ')[0] || "User"}
                  </span>
                )}
              </h1>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-primary" />
                Arjuna AI Interview Platform
              </p>
            </div>

            {/* Desktop Header Controls */}
            {/* Desktop Header Controls */}
            <div className="hidden lg:flex items-center gap-2 p-1.5 bg-background/60 backdrop-blur-xl border border-border/40 rounded-full shadow-sm">
              <div className="flex items-center gap-1 px-2 border-r border-border/40 h-8">
                <NotificationBell />
                <ThemeToggle />
                <StreakIndicator streak={currentStreak} />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 hover:bg-accent border border-border/40 rounded-full transition-all duration-300 group">
                    <Avatar className="h-8 w-8 border border-border/40 shadow-sm transition-transform group-hover:scale-105">
                      {authLoading ? (
                        <Skeleton className="h-full w-full" />
                      ) : (
                        <>
                          <AvatarImage src={getAvatarUrl(
                            userMetadata?.avatar_url,
                            user?.id || 'user',
                            'avataaars',
                            null,
                            userMetadata?.gender
                          )} />
                          <AvatarFallback className="text-xs font-bold">{getInitials(userMetadata?.full_name)}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {userMetadata?.full_name?.split(' ')[0] || "User"}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">Account</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 mb-1 border-b border-border/40">
                    <p className="text-sm font-bold truncate text-foreground">{userMetadata?.full_name || "User"}</p>
                    <p className="text-[10px] font-medium truncate text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 border-border/40" />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Low Time Warning Banner */}
          {/* LowTimeWarningBanner */}
          {!subscriptionLoading && !loading && remaining_seconds < 300 && remaining_seconds >= 0 && (
            <LowTimeWarningBanner
              remainingMinutes={Math.floor(remaining_seconds / 60)}
              variant="dashboard"
            />
          )}



          {/* Top Actions & Statistics Section */}
          {/* Top Actions Section */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
            <Button
              className="h-16 sm:h-14 xl:h-14 w-full xl:w-56 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group"
              onClick={startInterview}
              disabled={subscriptionLoading || !allowed}
            >
              <div className="flex flex-row items-center justify-center gap-1">
                <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <Zap className="h-4 w-4 fill-white" />
                </div>
                <span>Start Interview</span>
              </div>
            </Button>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              {/* Interviews Completed */}
              <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">

                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Play className="h-20 w-20 fill-primary/20 text-primary" />
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">Interviews Completed</span>
                <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                  {loading ? <Skeleton className="h-8 w-12 bg-muted/50 rounded-lg" /> : (stats?.totalInterviews || 0)}
                </span>
              </div>

              {/* Time Practiced */}
              <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">

                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Clock className="h-20 w-20 text-accent fill-accent/20" />
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">Time Practiced</span>
                <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                  {loading ? <Skeleton className="h-8 w-24 bg-muted/50 rounded-lg" /> : formatTime(stats?.timePracticed || 0)}
                </span>
              </div>

              {/* Global Rank */}
              <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">

                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Award className="h-20 w-20 text-blue-500 fill-blue-500/20" />
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">Global Rank</span>
                <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                  {loading ? <Skeleton className="h-8 w-16 bg-muted/50 rounded-lg" /> : `#${stats?.rank || 0}`}
                </span>
              </div>

              {/* Average Score */}
              <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">

                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Target className="h-20 w-20 text-primary fill-primary/20" />
                </div>
                <div className="flex flex-col justify-between h-full relative z-10">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Average Score</span>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter flex-shrink-0">
                      {loading ? <Skeleton className="h-8 w-16 bg-muted/50 rounded-lg" /> : `${stats?.averageScore || 0}%`}
                    </span>
                    <div className="h-6 w-10 mb-1 opacity-80 flex-shrink-0">
                      <MiniBarChart
                        data={scoreHistory}
                        height={24}
                        barWidth={3}
                        color="hsl(var(--primary))"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <div className="w-full aspect-square">
              <SkillProgressChart data={skillProgress} loading={loading} />
            </div>
            <div className="w-full aspect-square">
              <WeeklyActivityChart data={weeklyActivity} currentStreak={currentStreak} loading={loading} />
            </div>
            <div className="w-full aspect-square">
              <PerformanceAnalysisChart data={performanceData} loading={loading} />
            </div>
          </div>

          {/* Badge Progress Section */}

          {/* Interview List Section */}
          <div className="space-y-4">
            <div className="flex items-end justify-between px-1 pb-2 border-b border-border/40">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Recent Sessions
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/reports')}
                className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium text-xs gap-1"
              >
                View History
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-48 rounded-[2rem] bg-card/60 border border-border/50 p-6 flex flex-col justify-between overflow-hidden relative">
                    <div className="shimmer-overlay" />
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-20 bg-muted/50 rounded-full" />
                      <Skeleton className="h-4 w-12 bg-muted/50 rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4 bg-muted/50 rounded-md" />
                      <Skeleton className="h-4 w-1/2 bg-muted/50 rounded-md" />
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-10 bg-muted/50 rounded-md" />
                        <Skeleton className="h-8 w-16 bg-muted/50 rounded-md" />
                      </div>
                      <Skeleton className="h-10 w-10 bg-muted/50 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions?.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-2xl py-16 text-center space-y-4">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">No interviews yet</h3>
                  <p className="text-sm text-muted-foreground font-medium">Start your first session to begin generating reports.</p>
                </div>
                <Button
                  onClick={startInterview}
                  className="rounded-xl h-12 px-8 font-semibold text-sm"
                >
                  Start Interview
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.slice(0, 6).map((session) => {
                  const isGeneratingFeedback = isSessionGenerating(session.id);
                  const score = session.score;

                  // Check if the interview was too short by examining the feedback
                  const feedback = session.feedback as { executiveSummary?: string, note?: string } | null;
                  const summaryText = feedback?.executiveSummary || '';

                  const isTooShort = summaryText.includes('too brief') ||
                    summaryText.includes('too short') ||
                    summaryText.includes('Insufficient interview duration') ||
                    feedback?.note === 'Insufficient data for report generation';

                  const isFailed = summaryText.includes('Feedback generation failed') ||
                    summaryText.includes('Invalid feedback structure');

                  // Extract the reason from executiveSummary or note if available
                  let feedbackReason = '';
                  if (isTooShort) {
                    if (feedback?.note === 'Insufficient data for report generation') {
                      feedbackReason = 'Requirements not met';
                    } else if (summaryText) {
                      if (summaryText.includes('too brief')) {
                        feedbackReason = 'Interview too short';
                      } else if (summaryText.includes('too short')) {
                        feedbackReason = 'Session too brief';
                      } else {
                        feedbackReason = 'Insufficient duration';
                      }
                    } else {
                      feedbackReason = 'Requirements not met';
                    }
                  } else if (isFailed) {
                    feedbackReason = 'Analysis failed';
                  }

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setNavigatingSessionId(session.id);
                        if (session.status === 'completed') {
                          if (isTooShort) {
                            toast.info("Interview was too brief", {
                              description: "You can view the feedback, but a longer session is needed for a comprehensive assessment.",
                              duration: 4000
                            });
                          }
                          router.push(`/interview/${session.id}/report`);
                        } else if (session.status === 'in_progress') {
                          // Allow resuming in-progress sessions
                          router.push(`/interview/${session.id}/setup`);
                        }
                      }}
                      className="group relative overflow-hidden rounded-3xl border border-border/80 dark:border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1"
                    >

                      {/* Background Gradient Spot */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                      <div className="p-6 h-full flex flex-col relative z-10">
                        {/* Header: Type Badge & Status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {session.config && (session.config as { companyInterviewConfig?: unknown }).companyInterviewConfig ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                                <Building2 className="h-3 w-3" />
                                Company Specific
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wide">
                                <Play className="h-3 w-3 fill-current" />
                                General
                              </span>
                            )}
                          </div>

                          {/* Date */}
                          <span className="text-[11px] font-medium text-muted-foreground/60 tabular-nums">
                            {new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Title & Role */}
                        <div className="mb-6 space-y-1">
                          <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {session.position || "Untitled Interview"}
                          </h3>
                          <p className="text-xs text-muted-foreground/80 font-medium line-clamp-1">
                            Duration: {session.duration_seconds ? formatDurationShort(session.duration_seconds) : '---'}
                          </p>
                        </div>

                        <div className="mt-auto flex items-end justify-between">
                          {/* Status / Score Indicator */}
                          <div>
                            {/* Status / Score Indicator */}
                            <div>
                              {/* Show loading/analyzing state first if generating feedback */}
                              {isGeneratingFeedback ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground">Analyzing</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">Please wait</span>
                                  </div>
                                </div>
                              ) : (isTooShort || isFailed) ? (
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center border",
                                    isFailed ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"
                                  )}>
                                    {isFailed ? (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-xs font-bold",
                                      isFailed ? "text-red-500" : "text-foreground"
                                    )}>
                                      {feedbackReason}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                      {isFailed ? "Please try again" : "Complete longer session"}
                                    </span>
                                  </div>
                                </div>
                              ) : score !== null ? (
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-0.5 tracking-wider">Score</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className={cn(
                                      "text-3xl font-black tracking-tighter tabular-nums",
                                      score >= 70 ? "text-emerald-500" : score >= 40 ? "text-primary" : "text-rose-500"
                                    )}>
                                      {score}
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground/50">%</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {isGeneratingFeedback ? (
                                    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                  ) : (
                                    <div className="h-10 w-10 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                      <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground">
                                      {session.status === 'in_progress'
                                        ? "In Progress"
                                        : "Analyzing"}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                      {session.status === 'in_progress'
                                        ? "Resume Session"
                                        : "Please wait"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-300 transform group-hover:scale-110",
                            session.status === 'in_progress'
                              ? "bg-muted text-muted-foreground border-border opacity-50"
                              : score !== null
                                ? "bg-foreground text-background border-foreground shadow-lg group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground"
                                : "bg-muted text-muted-foreground border-border",
                            navigatingSessionId === session.id && "bg-primary border-primary"
                          )}>
                            {navigatingSessionId === session.id ? (
                              <div className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                            ) : session.status === 'in_progress' ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <ArrowRight className="h-4 w-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                            )}
                          </div>
                        </div>

                        {/* Progress Bar for Score (Decorative) */}
                        {score !== null && (
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-muted/50">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000 ease-out",
                                score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-primary" : "bg-rose-500"
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      <PaymentStatusModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        status={paymentModal.status}
        details={paymentModal.details}
      />
    </>
  );
}

// Wrap in Suspense to handle useSearchParams properly
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <PremiumLogoLoader text="Loading Dashboard" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}