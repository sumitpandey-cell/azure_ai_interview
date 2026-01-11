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
  Calendar,
  Settings,
  LogOut,
  Loader2,
  Play,
  TrendingUp,
  Building2,
  Trash2,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Award,
  Zap,
  Target,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { interviewService, profileService, subscriptionService, badgeService } from "@/services";
import type { InterviewSession } from "@/services/interview.service";
import { useFeedback } from "@/context/FeedbackContext";
import { MiniBarChart } from "@/components/MiniBarChart";
import { SkillProgressChart } from "@/components/SkillProgressChart";
import { WeeklyActivityChart } from "@/components/WeeklyActivityChart";
import { PerformanceAnalysisChart } from "@/components/PerformanceAnalysisChart";
import { useAnalytics } from "@/hooks/use-analytics";
import { BadgeProgressWidget } from "@/components/BadgeProgressWidget";
import { LowTimeWarningBanner } from "@/components/LowTimeWarningBanner";
import { Timer } from "lucide-react";
import { formatDuration, formatDurationShort } from "@/lib/format-duration";
import { toast } from "sonner";

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
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(3600); // Initialize to 1 hour (seconds) to prevent banner flash
  const [loading, setLoading] = useState(true);

  // Use analytics hook for cached data
  const { skillProgress, weeklyActivity, streakData, performanceData } = useAnalytics(user?.id);
  const currentStreak = streakData?.currentStreak || 0;

  const {
    shouldRefreshDashboard,
    resetFeedbackState,
    isGenerating,
    currentSessionId: generatingSessionId,
    generateFeedbackInBackground
  } = useFeedback();

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
      const [sessionStats, rank] = await Promise.all([
        interviewService.getSessionStats(user.id),
        interviewService.calculateUserRank(user.id)
      ]);

      setStats({
        totalInterviews: sessionStats.completed,
        timePracticed: sessionStats.totalDuration,
        rank: rank,
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

      // Load badges
      const userBadges = await badgeService.getUserBadges(user.id);
      const earnedSlugs = userBadges.map((ub: any) => ub.badge.slug);
      setEarnedBadges(earnedSlugs);

      // Trigger catch-up check for badges (especially if they just finished an interview)
      const newlyAwarded = await badgeService.checkAndAwardBadges(user.id);
      if (newlyAwarded.length > 0) {
        setEarnedBadges(prev => [...prev, ...newlyAwarded.map(b => b.slug)]);
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

  const { allowed, loading: subscriptionLoading, invalidateCache, remaining_minutes: hookRemainingMinutes } = useSubscription();

  const startInterview = async () => {
    // Check balance before proceeding
    const { remainingMinutes } = await subscriptionService.checkUsageLimit(user?.id || '');
    if (remainingMinutes < 120) {
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

      <DashboardLayout>
        <div className="space-y-4 pb-12 pt-10 sm:pt-0">
          {/* Header Section with Top-Notch Tactical Design */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Online</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tighter italic leading-tight">
                {new Date().getHours() < 12 ? 'MORNING' : new Date().getHours() < 18 ? 'AFTERNOON' : 'EVENING'}, <span className="text-primary not-italic">{userMetadata?.full_name?.split(' ')[0]?.toUpperCase() || "OPERATOR"}</span>
              </h1>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-primary" />
                Arjuna AI Tactical Interface • Sector 7G
              </p>
            </div>

            {/* Premium Header Controls Interface */}
            <div className="flex items-center justify-between sm:justify-end gap-3 p-1.5 sm:p-2 bg-card/30 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-2xl shadow-2xl w-full sm:w-auto">
              <div className="flex items-center gap-1.5 px-2 border-r border-white/10 mr-1">
                <NotificationBell />
                <ThemeToggle />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-3 pl-1 pr-4 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-500 hover:scale-[1.02] active:scale-95">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-all" />
                      <Avatar className="h-9 w-9 border-2 border-primary/20 relative z-10">
                        <AvatarImage src={getAvatarUrl(
                          userMetadata?.avatar_url,
                          user?.id || 'user',
                          'avataaars',
                          null,
                          userMetadata?.gender
                        )} />
                        <AvatarFallback className="text-[10px] font-black text-foreground bg-primary/10">{getInitials(userMetadata?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#09090b] rounded-full z-20" />
                    </div>

                    <div className="flex flex-col items-start">
                      <span className="text-[10px] sm:text-[11px] font-black text-foreground uppercase tracking-wider leading-none">
                        {userMetadata?.full_name?.split(' ')[0] || "User"}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-tight opacity-60">Verified Admin</span>
                    </div>

                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card/80 backdrop-blur-3xl border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Operator Identity</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="text-[11px] font-black uppercase tracking-widest py-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer mb-1 group">
                    <Settings className="mr-3 h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                    Interface Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-[11px] font-black uppercase tracking-widest py-3 rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer group">
                    <LogOut className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Terminate Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Low Time Warning Banner */}
          {!subscriptionLoading && !loading && (hookRemainingMinutes ?? remainingMinutes) < 300 && (hookRemainingMinutes ?? remainingMinutes) >= 0 && (
            <LowTimeWarningBanner
              remainingMinutes={Math.floor((hookRemainingMinutes ?? remainingMinutes) / 60)}
              variant="dashboard"
            />
          )}



          {/* Top Actions Section */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6">
            <Button
              className="h-11 sm:h-12 md:h-14 w-full xl:w-auto px-6 sm:px-10 py-3 text-[10px] sm:text-xs md:text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] font-black uppercase tracking-widest group"
              onClick={startInterview}
              disabled={subscriptionLoading || !allowed}
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 fill-current group-hover:animate-pulse" />
              Initialize Interview
            </Button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Play className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5 sm:mb-1 block">Total Enactments</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-foreground">{stats?.totalInterviews || 0}</span>
              </div>

              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-sm relative overflow-hidden group hover:border-accent/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5 sm:mb-1 block">Practiced</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-foreground">{formatTime(stats?.timePracticed || 0)}</span>
              </div>

              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Award className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5 sm:mb-1 block">Global Standing</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-foreground">#{stats?.rank || 0}</span>
              </div>

              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Target className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5 sm:mb-1 block">Mean Accuracy</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-black text-foreground">{stats?.averageScore || 0}%</span>
                  </div>
                  <div className="pt-2 hidden sm:block">
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
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SkillProgressChart data={skillProgress} />
            <WeeklyActivityChart data={weeklyActivity} currentStreak={currentStreak} />
            <PerformanceAnalysisChart data={performanceData} />
          </div>

          {/* Badge Progress Section */}
          <BadgeProgressWidget
            earnedBadges={earnedBadges}
            totalInterviews={stats.totalInterviews}
            currentStreak={currentStreak}
            averageScore={stats.averageScore}
          />

          {/* Interview List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Recent Deployments</h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Archive of latest operational logs</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/reports')}
                className="h-9 sm:h-10 px-3 sm:px-5 rounded-lg sm:rounded-xl border-border font-black uppercase tracking-widest text-[8px] sm:text-[10px] group transition-all"
              >
                Archive
                <ArrowRight className="h-3 w-3 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-40 sm:h-48 rounded-2xl sm:rounded-2xl bg-card border-2 border-border/50 animate-pulse relative overflow-hidden">
                    <div className="shimmer-overlay" />
                  </div>
                ))}
              </div>
            ) : sessions?.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-2xl py-16 text-center space-y-4">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">No Archive Found</h3>
                  <p className="text-sm text-muted-foreground font-medium">Initiate your first session to begin generating reports.</p>
                </div>
                <Button
                  onClick={startInterview}
                  className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px]"
                >
                  Start New Journey
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => {
                  const isGeneratingFeedback = isSessionGenerating(session.id);
                  const isInsufficientData = (session.feedback as any)?.note === 'Insufficient data for report generation';
                  const score = session.score;

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        if (session.status === 'in_progress') {
                          router.push(`/interview/${session.id}/setup`);
                        } else {
                          router.push(`/interview/${session.id}/report`);
                        }
                      }}
                      className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-primary/5"
                    >
                      {/* Top Bar Decoration */}
                      <div className={cn(
                        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
                        session.status === 'in_progress' ? "from-amber-500 to-amber-300" :
                          score !== null ? (score >= 70 ? "from-emerald-500 to-emerald-300" : score >= 40 ? "from-primary to-accent" : "from-rose-500 to-rose-300") :
                            "from-muted to-muted-foreground/30"
                      )} />

                      <div className="p-4 sm:p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-1">
                              {session.position}
                            </h3>
                            <div className="flex items-center gap-2">
                              {session.config && (session.config as any).companyId ? (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <Building2 className="h-2.5 w-2.5" />
                                  Corporate Path
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-[9px] font-bold uppercase tracking-wider text-primary">
                                  <Play className="h-2.5 w-2.5" />
                                  General Protocol
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mini Gauge or Status */}
                          <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                            {score !== null ? (
                              <>
                                <svg className="h-full w-full rotate-[-90deg]">
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    className="stroke-muted-foreground/10 fill-none"
                                    strokeWidth="4"
                                  />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    className={cn(
                                      "fill-none transition-all duration-1000",
                                      score >= 70 ? "stroke-emerald-500" : score >= 40 ? "stroke-primary" : "stroke-rose-500"
                                    )}
                                    strokeWidth="4"
                                    strokeDasharray={125.6}
                                    strokeDashoffset={125.6 - (125.6 * score) / 100}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic">
                                  {score}%
                                </span>
                              </>
                            ) : (
                              <div className="h-10 w-10 bg-muted/30 rounded-full flex items-center justify-center">
                                {isGeneratingFeedback ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : (
                                  <Clock className="h-5 w-5 text-muted-foreground/30" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-muted/30 rounded-xl p-2.5 border border-border">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block mb-0.5">Timeline</span>
                            <span className="text-[10px] font-bold text-foreground flex items-center gap-1.5 whitespace-nowrap">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="bg-muted/30 rounded-xl p-2.5 border border-border">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block mb-0.5">Uptime</span>
                            <span className="text-[10px] font-bold text-foreground flex items-center gap-1.5 whitespace-nowrap">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {session.duration_seconds ? formatDurationShort(session.duration_seconds) : '---'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2",
                            session.status === 'in_progress' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                              score !== null ? (score >= 70 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-primary/10 text-primary border border-primary/20") :
                                "bg-muted text-muted-foreground/60 border border-border"
                          )}>
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              session.status === 'in_progress' ? "bg-amber-500 animate-pulse" :
                                score !== null ? (score >= 70 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]") :
                                  "bg-muted-foreground"
                            )} />
                            {session.status === 'in_progress' ? "Live Session" :
                              isInsufficientData ? "Null Archive" :
                                score !== null ? "Archived" : "Processing"}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}