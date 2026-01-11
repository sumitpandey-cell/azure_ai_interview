'use client';

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Trophy,
  BellRing,
  Medal,
  Map,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAnalytics } from "@/hooks/use-analytics";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useFeedback } from "@/context/FeedbackContext";

interface DashboardLayoutProps {
  children: ReactNode;
  headerControls?: ReactNode;
}

export function DashboardLayout({ children, headerControls }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { remaining_minutes, plan_name, invalidateCache, loading: subscriptionLoading } = useSubscription();
  const { currentSession } = useInterviewStore();
  const { generateFeedbackInBackground, isGenerating, currentSessionId: generatingSessionId } = useFeedback();

  const isCurrentSessionGenerating = isGenerating && generatingSessionId === currentSession?.id;
  const hasFeedback = !!currentSession?.feedback || !!currentSession?.score;
  const isCompleted = currentSession?.status === 'completed';
  const isActive = (path: string) => pathname === path;
  const showReportAction = isCompleted && !isActive('/start-interview') && !isActive('/live');

  // Force refresh subscription data when returning to dashboard
  useEffect(() => {
    invalidateCache();
  }, [invalidateCache]);

  // Get streak data from analytics cache
  const { streakData, refetch: refetchAnalytics } = useAnalytics(user?.id);
  const streak = streakData?.currentStreak || 0;

  // Force refresh analytical data when returning to dashboard or mounting
  useEffect(() => {
    if (user?.id) {
      refetchAnalytics();
    }
  }, [user?.id, refetchAnalytics]);

  // Initialize sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Check if user is admin
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user?.email || '');

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Roadmap", href: "/roadmap", icon: Map },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Badges", href: "/badges", icon: Medal },
    { name: "Templates", href: "/templates", icon: FileText },
    ...(isAdmin ? [{ name: "Admin Notifications", href: "/admin/notifications", icon: BellRing }] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];



  return (
    <div className="flex h-screen bg-sidebar text-foreground font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen
          transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}
        bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        flex flex-col flex-shrink-0
      `}
      >
        {/* Logo Section */}
        <div className={`h-20 flex items-center flex-shrink-0 transition-all duration-500 ${sidebarCollapsed ? "px-2 justify-center" : "px-6"}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-4 group cursor-default">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/50 transition-all duration-700 animate-pulse"></div>
                <div className="relative h-12 w-12 bg-card/40 backdrop-blur-xl border border-sidebar-border rounded-2xl flex items-center justify-center p-2.5 shadow-2xl">
                  <img
                    src="/favicon.ico"
                    alt="Arjuna AI"
                    className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-foreground tracking-tighter leading-tight">
                  ARJUNA<span className="text-primary italic">AI</span>
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] -mt-0.5">Tactical Interface</span>
              </div>
            </div>
          ) : (
            <div className="relative flex-shrink-0 group">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse"></div>
              <div className="relative h-12 w-12 bg-card/40 backdrop-blur-xl border border-sidebar-border rounded-2xl flex items-center justify-center p-2.5 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <img
                  src="/favicon.ico"
                  alt="Arjuna AI"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Mobile Close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden ml-auto p-2 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex items-center justify-center h-10 w-10 border border-sidebar-border/50 hover:bg-sidebar-accent hover:border-sidebar-border rounded-xl text-muted-foreground hover:text-foreground transition-all duration-300 ${sidebarCollapsed ? "" : "ml-auto"}`}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-3 py-6 overflow-y-auto scrollbar-hide">
          <div className={`${sidebarCollapsed ? "hidden" : "block"} px-4 mb-4`}>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Operational Menu</p>
          </div>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                group relative flex items-center gap-4 rounded-[1.25rem] transition-all duration-500
                ${isActive(item.href)
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(168,85,247,0.05)] border border-primary/20"
                  : "text-sidebar-foreground/60 hover:text-foreground hover:bg-sidebar-accent border border-transparent"
                }
                ${sidebarCollapsed ? "w-12 h-12 justify-center mx-auto p-0" : "px-5 py-2.5"}
              `}
              title={sidebarCollapsed ? item.name : undefined}
            >
              {/* Active Indicator Glow */}
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[4px_0_12px_rgba(168,85,247,0.8)]" />
              )}

              <item.icon
                className={`h-5 w-5 flex-shrink-0 transition-all duration-500 
                  ${isActive(item.href)
                    ? "text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110"
                    : "group-hover:text-primary group-hover:scale-110"
                  }`}
              />

              {!sidebarCollapsed && (
                <span className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isActive(item.href) ? "translate-x-1" : "group-hover:translate-x-1"}`}>
                  {item.name}
                </span>
              )}

              {/* Hover Ambient Detail */}
              {!sidebarCollapsed && !isActive(item.href) && (
                <ChevronRight className="h-3 w-3 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Section: Upgrade */}
        <div className="p-4 space-y-4 mt-auto">


          {/* Report Action Card */}
          {!sidebarCollapsed && showReportAction ? (
            <div className="bg-sidebar-accent rounded-2xl p-4 border border-sidebar-border shadow-lg text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sidebar-foreground font-bold text-sm truncate w-32">{currentSession?.position || "Latest Interview"}</p>
                    <p className="text-[10px] text-sidebar-foreground/50">Report Status</p>
                  </div>
                </div>

                <Button
                  className={`w-full h-10 text-[10px] uppercase tracking-widest font-bold rounded-xl shadow-lg transition-all active:scale-95 ${isCurrentSessionGenerating
                    ? 'bg-primary/20 text-primary cursor-not-allowed hover:bg-primary/20'
                    : hasFeedback
                      ? 'bg-primary hover:opacity-90 text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  disabled={isCurrentSessionGenerating}
                  onClick={() => {
                    if (hasFeedback) {
                      router.push(`/interview/${currentSession?.id}/report`);
                    } else if (currentSession?.id) {
                      generateFeedbackInBackground(currentSession.id);
                      router.push(`/interview/${currentSession.id}/report`);
                    }
                  }}
                >
                  {isCurrentSessionGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : hasFeedback ? (
                    "View Report"
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </div>
            </div>
          ) : sidebarCollapsed && showReportAction ? (
            <div className="flex justify-center group" title={hasFeedback ? "View Report" : "Generate Report"}>
              <button
                onClick={() => {
                  if (hasFeedback) {
                    router.push(`/interview/${currentSession?.id}/report`);
                  } else if (currentSession?.id) {
                    generateFeedbackInBackground(currentSession.id);
                    router.push(`/interview/${currentSession.id}/report`);
                  }
                }}
                disabled={isCurrentSessionGenerating}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 relative ${isCurrentSessionGenerating
                  ? 'bg-primary/10 border-primary/20 text-primary animate-pulse'
                  : hasFeedback
                    ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
              >
                <FileText className="h-5 w-5" />
                {isCurrentSessionGenerating && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 border-2 border-sidebar rounded-full animate-bounce" />
                )}
              </button>
            </div>
          ) : null}

          {/* Upgrade Card */}
          {!sidebarCollapsed ? (
            <div className="bg-sidebar-accent/50 rounded-2xl p-1.5 border border-sidebar-border shadow-xl text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Button
                className="relative z-10 w-full bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl mb-2 h-8 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                onClick={() => router.push("/pricing")}
                disabled={subscriptionLoading}
              >
                Upgrade Plan
              </Button>
              <div className="text-[10px] text-sidebar-foreground/70 font-medium px-1">
                {subscriptionLoading ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-2.5 w-14 bg-sidebar-foreground/10 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-sidebar-foreground/20 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    Plan : {plan_name}
                    <div className={`text-base font-bold mt-0.5 font-mono transition-colors ${remaining_minutes <= 120
                      ? 'text-red-500'
                      : remaining_minutes < 300
                        ? 'text-amber-500'
                        : 'text-sidebar-foreground'
                      }`}>
                      {Math.ceil(remaining_minutes / 60)} min
                      <span className="text-[10px] text-sidebar-foreground/50 ml-1">/ 100</span>
                    </div>
                  </>
                )}
                {/* Progress bar */}
                <div className="mt-1.5 h-1 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${subscriptionLoading ? 'bg-primary/10' :
                      remaining_minutes <= 120
                        ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : remaining_minutes < 300
                          ? 'bg-accent shadow-[0_0_8px_rgba(255,195,77,0.5)]'
                          : 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      }`}
                    style={{ width: subscriptionLoading ? '40%' : `${Math.min((remaining_minutes / 6000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                size="icon"
                className="bg-primary hover:opacity-90 text-primary-foreground rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                onClick={() => router.push("/pricing")}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Fixed Top Header Bar - Mobile Only */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-lg">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="h-10 w-10 flex items-center justify-center bg-card/50 border border-border/50 rounded-xl shadow-sm group active:scale-90 transition-all duration-300"
          >
            <Menu className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
          </button>

          {/* Header Controls from Page */}
          {headerControls}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent lg:rounded-l-[2rem] rounded-none overflow-hidden ml-0 h-screen relative">
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden bg-background backdrop-blur-[2px] pt-20 lg:pt-6 relative z-10 w-full">
          <div
            key={pathname}
            className="w-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out"
          >
            {children}
          </div>
        </main >
      </div >
    </div >
  );
}
