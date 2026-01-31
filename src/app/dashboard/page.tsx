"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Settings,
  LogOut,
  ArrowRight,
  History,
  Share2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
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
import dynamic from "next/dynamic";
import { GreetingSection } from "@/components/dashboard/GreetingSection";
import { StatsSection } from "@/components/dashboard/StatsSection";

const SkillProgressChart = dynamic(() => import("@/components/SkillProgressChart").then(mod => mod.SkillProgressChart), {
  loading: () => <Skeleton className="h-full w-full rounded-3xl" />,
  ssr: false
});

const WeeklyActivityChart = dynamic(() => import("@/components/WeeklyActivityChart").then(mod => mod.WeeklyActivityChart), {
  loading: () => <Skeleton className="h-full w-full rounded-3xl" />,
  ssr: false
});

const PerformanceAnalysisChart = dynamic(() => import("@/components/PerformanceAnalysisChart").then(mod => mod.PerformanceAnalysisChart), {
  loading: () => <Skeleton className="h-full w-full rounded-3xl" />,
  ssr: false
});
import { useAnalytics } from "@/hooks/use-analytics";
import { LowTimeWarningBanner } from "@/components/LowTimeWarningBanner";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";
import ReferralModal from "@/components/ReferralModal";
import { SessionCard } from "@/components/SessionCard";

// Type for user metadata
interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  gender?: string;
}

interface SessionFeedback {
  executiveSummary?: string;
  note?: string;
  overall?: { score?: number };
  score?: number;
  status?: string;
}

interface DashboardSession {
  id: string;
  status: string;
  score: number | null;
  feedback?: unknown;
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

  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Helper to check if a session is currently generating feedback
  const isSessionGenerating = useCallback((sessionId: string) => {
    return isGenerating && generatingSessionId === sessionId;
  }, [isGenerating, generatingSessionId]);

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

  const handleSignOut = useCallback(() => signOut(), [signOut]);
  const handleOpenReferralModal = useCallback(() => setIsReferralModalOpen(true), []);

  const startInterview = useCallback(async () => {
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
  }, [user?.id, router]);

  const handleSessionClick = useCallback((session: DashboardSession) => {
    if (isSessionGenerating(session.id)) return;

    if (session.status === 'completed') {
      let score = session.score;
      if (score === null && session.feedback) {
        const fb = session.feedback as SessionFeedback;
        const overall = fb.overall;
        if (overall?.score !== undefined) {
          score = overall.score;
        } else if (typeof fb.score === 'number') {
          score = fb.score;
        } else if (fb.status === 'abandoned' || fb.note === 'Insufficient data for report generation') {
          score = 0;
        }
      }

      const feedback = session.feedback as SessionFeedback;
      const summaryText = feedback?.executiveSummary || '';
      const isTooShort = summaryText.includes('too brief') ||
        summaryText.includes('too short') ||
        summaryText.includes('Insufficient interview duration') ||
        feedback?.note === 'Insufficient data for report generation';

      if (isTooShort) {
        toast.info("Interview was too brief", {
          description: "You can view the feedback, but a longer session is needed for a comprehensive assessment.",
          duration: 4000
        });
      }
      router.push(`/interview/${session.id}/report`);
    } else if (session.status === 'in_progress') {
      router.push(`/interview/${session.id}/setup`);
    }
  }, [router, isSessionGenerating]);

  const memoizedSessionList = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return sessions.slice(0, 6).map((session) => (
      < SessionCard
        key = { session.id }
        session = { session }
        isGeneratingFeedback = { isSessionGenerating(session.id)
  }
        onClick = {() => handleSessionClick(session)
}
      />
    ));
  }, [sessions, isSessionGenerating, handleSessionClick]);

return (
  <>
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
              <DropdownMenuItem onClick={handleOpenReferralModal} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                <Share2 className="h-4 w-4" />
                <span>Share App</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-border/40" />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive">
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
        <GreetingSection
          user={user}
          userMetadata={userMetadata}
          authLoading={authLoading}
          currentStreak={currentStreak}
          onSignOut={handleSignOut}
          onOpenReferralModal={handleOpenReferralModal}
        />

        {/* Low Time Warning Banner */}
        {!subscriptionLoading && !loading && remaining_seconds < 300 && remaining_seconds >= 0 && (
          <LowTimeWarningBanner
            remainingMinutes={Math.floor(remaining_seconds / 60)}
            variant="dashboard"
          />
        )}
        {/* Stats Section */}
        <StatsSection
          loading={loading}
          stats={stats}
          scoreHistory={scoreHistory}
          subscriptionLoading={subscriptionLoading}
          allowed={allowed}
          onStartInterview={startInterview}
        />
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
            {memoizedSessionList}
          </div>
        )}
      </div>
    </DashboardLayout>

    <PaymentStatusModal
      isOpen={paymentModal.isOpen}
      onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
      status={paymentModal.status}
      details={paymentModal.details}
    />
    <ReferralModal
      isOpen={isReferralModalOpen}
      onClose={() => setIsReferralModalOpen(false)}
      userId={user?.id}
      userName={userMetadata?.full_name}
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