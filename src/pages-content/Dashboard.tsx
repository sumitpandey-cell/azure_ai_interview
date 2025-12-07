"use client";

import { useState } from "react";
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
  LogOut
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

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Placeholder data - backend removed
  const profile = null;
  const sessions = [];
  const stats = {
    totalInterviews: 0,
    timePracticed: 0,
    rank: 0,
    averageScore: 0,
  };

  const { allowed, loading: subscriptionLoading } = useSubscription();

  const startInterview = () => {
    router.push('/start-interview');
  };

  // Helper to render stars based on score
  const renderStars = (score: number | null) => {
    if (score === null) return <span className="text-muted-foreground">-</span>;
    const stars = Math.round(score / 20); // 0-5 stars
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Helper to format time
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section with Controls */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Good morning, {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || "User"}!
            </h1>
            <p className="text-muted-foreground text-sm">Arjuna AI: Your AI Voice Interviewer.</p>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 ">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex bg-card items-center gap-2 hover:bg-accent border border-border rounded-full px-2 py-1.5 transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={getAvatarUrl(
                      profile?.avatar_url || user?.user_metadata?.avatar_url,
                      user?.id || 'user',
                      'avataaars',
                      null,
                      user?.user_metadata?.gender
                    )} />
                    <AvatarFallback>{getInitials(profile?.full_name || user?.user_metadata?.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || "User"}
                  </span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
          </div>
        </div>

        {/* Top Actions Section */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6">
          <Button
            className="h-auto w-full xl:w-auto px-8 xl:px-16 py-4 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg transition-transform hover:scale-105 font-medium"
            onClick={startInterview}
            disabled={subscriptionLoading || !allowed}
          >
            Start Interview
          </Button>

          <div className="grid grid-cols-2 gap-6 md:gap-0 md:flex md:divide-x md:divide-border xl:ml-auto bg-card rounded-2xl p-6 md:px-8 md:py-5 shadow-sm border border-border">
            <div className="flex flex-col md:pr-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Number of Interviews:</span>
              <span className="text-2xl md:text-4xl font-bold text-foreground">{stats?.totalInterviews || 0}</span>
            </div>

            <div className="flex flex-col md:px-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Total Timing:</span>
              <span className="text-2xl md:text-4xl font-bold text-foreground">{formatTime(stats?.timePracticed || 0)}</span>
            </div>

            <div className="flex flex-col md:px-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Leaderboard Rank:</span>
              <span className="text-2xl md:text-4xl font-bold text-foreground">#{stats?.rank || 0}</span>
            </div>

            <div className="flex flex-col md:pl-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Average Score:</span>
              <span className="text-2xl md:text-4xl font-bold text-foreground">{stats?.averageScore || 0}%</span>
            </div>
          </div>
        </div>

        {/* Interview List Section */}
        <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg font-bold text-foreground">Recent Interviews</h3>
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
                <tr className="text-left border-b border-border">
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm pl-2 sm:pl-4">Role</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Date</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Type</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Duration</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Status</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Score</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Feedback</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm text-right pr-2 sm:pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        <p>No interviews yet. Start your first interview to see results here!</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}