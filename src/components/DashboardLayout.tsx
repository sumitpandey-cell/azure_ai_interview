'use client'
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
  Bell,
  User,
  Flame,
  Trophy,
  BellRing,
  Medal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAnalytics } from "@/hooks/use-analytics";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { remaining_minutes, plan_name } = useSubscription();

  // Get streak data from analytics cache
  const { streakData } = useAnalytics(user?.id);
  const streak = streakData?.currentStreak || 0;

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
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Badges", href: "/badges", icon: Medal },
    { name: "Templates", href: "/templates", icon: FileText },
    ...(isAdmin ? [{ name: "Admin Notifications", href: "/admin/notifications", icon: BellRing }] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => pathname === path;

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
        fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen border-none
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}
        bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        flex flex-col flex-shrink-0
      `}
      >
        {/* Logo Section */}
        <div className={`h-20 flex items-center flex-shrink-0 ${sidebarCollapsed ? "px-2 justify-center" : "px-6"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-xl rounded-full"></div>
                <img
                  src="/favicon.ico"
                  alt="Arjuna AI"
                  className="relative h-10 w-10 object-contain drop-shadow-lg"
                />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Arjuna AI
              </span>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-xl rounded-full"></div>
              <img
                src="/arjuna-logo.png"
                alt="Arjuna AI"
                className="relative h-10 w-10 object-contain drop-shadow-lg"
              />
            </div>
          )}

          {/* Mobile Close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden ml-auto p-2 hover:bg-white/10 rounded-lg text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex p-2 hover:bg-white/10 rounded-lg text-white transition-colors ${sidebarCollapsed ? "" : "ml-auto"}`}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150
                ${isActive(item.href)
                  ? "bg-white/10 text-white shadow-lg shadow-black/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white active:scale-95"
                }
                ${sidebarCollapsed ? "justify-center px-2" : ""}
              `}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive(item.href) ? "text-blue-400" : ""}`}
              />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Section: Streak & Upgrade */}
        <div className="p-4 space-y-4 mt-auto">
          {/* Streak Card */}
          {!sidebarCollapsed ? (
            <div className="bg-sidebar-accent rounded-2xl p-4 border border-sidebar-border shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-transparent rounded-lg">
                  <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <p className="text-sidebar-foreground font-bold text-sm">Streak</p>
                  <p className="text-xs text-sidebar-foreground/70">{streak} Day Streak</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${streak} Day Streak`}>
              <div className="p-2 bg-sidebar-accent rounded-lg border border-sidebar-border">
                <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
              </div>
            </div>
          )}

          {/* Upgrade Card */}
          {!sidebarCollapsed ? (
            <div className="bg-sidebar-accent rounded-2xl p-4 border border-sidebar-border shadow-lg text-center relative overflow-hidden">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl mb-3 h-10"
                onClick={() => router.push("/pricing")}
              >
                Upgrade
              </Button>
              <div className="text-xs text-sidebar-foreground/70 font-medium">
                Plan : {plan_name}
                <div className={`text-lg font-bold mt-1 font-mono transition-colors ${remaining_minutes <= 120
                  ? 'text-red-500'
                  : remaining_minutes < 300
                    ? 'text-amber-500'
                    : 'text-sidebar-foreground'
                  }`}>
                  {Math.ceil(remaining_minutes / 60)} min
                  <span className="text-xs text-sidebar-foreground/50 ml-1">/ 100</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${remaining_minutes <= 120
                      ? 'bg-red-500'
                      : remaining_minutes < 300
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                      }`}
                    style={{ width: `${Math.min((remaining_minutes / 6000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
                onClick={() => router.push("/pricing")}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Mobile Toggle */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-background/80 backdrop-blur-md border border-border/40 rounded-xl shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background lg:rounded-l-[2rem] rounded-none overflow-hidden ml-0 h-screen">
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
          <div
            key={pathname}
            className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
