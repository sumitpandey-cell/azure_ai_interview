"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Download, MessageSquare, ExternalLink, Calendar, Clock, TrendingUp, Filter, SortAsc, SortDesc, Play, BarChart3, CheckCircle2, Target, Timer, Bell, Settings as SettingsIcon, LogOut, ArrowRight, Sparkles, Star, ThumbsUp, ThumbsDown, MoreHorizontal, Trash2, Briefcase, LineChart as LineChartIcon, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReportsPageSkeleton } from "@/components/ReportsPageSkeleton";
import { interviewService } from "@/services/interview.service";
import { formatDuration, formatDurationShort } from "@/lib/format-duration";
import { useAnalytics } from "@/hooks/use-analytics";
import { useFeedback } from "@/context/FeedbackContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface InterviewSession {
  id: string;
  position: string;
  interview_type: string;
  score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  config?: any; // JSONB field for storing interview configuration
}

export default function Reports() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { sessions: cachedSessions, profile: cachedProfile, fetchSessions, fetchProfile, isCached } = useOptimizedQueries();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Get analytics data from cache
  const { skillProgress, performanceData, streakData } = useAnalytics(user?.id);
  const currentStreak = streakData?.currentStreak || 0;
  const { generateFeedbackInBackground } = useFeedback();

  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || hasLoaded) return;

      try {
        setLoading(true);
        setError(null);

        // Use cached sessions if available, otherwise fetch
        let sessionsData = cachedSessions;
        if (!isCached.sessions || cachedSessions.length === 0) {
          console.log('🔄 Fetching sessions data...');
          sessionsData = await fetchSessions();
        } else {
          console.log('📦 Using cached sessions data');
        }

        // Use cached profile if available, otherwise fetch
        let profileData = cachedProfile;
        if (!isCached.profile || !cachedProfile) {
          console.log('🔄 Fetching profile data...');
          profileData = await fetchProfile();
        } else {
          console.log('📦 Using cached profile data');
        }

        setSessions(sessionsData);
        setProfile(profileData);
        setHasLoaded(true);
      } catch (err) {
        console.error('Error loading reports data:', err);
        setError('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, hasLoaded, cachedSessions, cachedProfile, isCached.sessions, isCached.profile, fetchSessions, fetchProfile]);

  // Sync cached data with local state
  useEffect(() => {
    if (cachedSessions.length > 0 && sessions.length === 0) {
      setSessions(cachedSessions);
    }
  }, [cachedSessions, sessions.length]);

  useEffect(() => {
    if (cachedProfile && !profile) {
      setProfile(cachedProfile);
    }
  }, [cachedProfile, profile]);

  // Delete interview function
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      // Update local state
      setSessions(sessions.filter(s => s.id !== deleteId));

      // Show success message
      const toast = await import('sonner');
      toast.toast.success('Interview deleted successfully');
    } catch (error) {
      console.error('Error deleting interview:', error);
      const toast = await import('sonner');
      toast.toast.error('Failed to delete interview');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleDeleteInterview = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(sessionId);
    setIsDeleteDialogOpen(true);
  };

  // Filtered and sorted sessions - optimized to reduce re-calculations
  const filteredAndSortedSessions = useMemo(() => {
    if (!sessions.length) return [];

    let filtered = sessions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        if (statusFilter === 'completed') return session.status === 'completed' && session.score !== null;
        if (statusFilter === 'in-progress') return session.status === 'in_progress' || (session.status === 'completed' && session.score === null);
        return session.status === statusFilter;
      });
    }

    // Apply position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(session =>
        session.position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(session =>
        session.position.toLowerCase().includes(query) ||
        session.interview_type.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'score-asc':
          return (a.score || 0) - (b.score || 0);
        case 'score-desc':
          return (b.score || 0) - (a.score || 0);
        case 'duration-asc':
          return (a.duration_seconds || 0) - (b.duration_seconds || 0);
        case 'duration-desc':
          return (b.duration_seconds || 0) - (a.duration_seconds || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [sessions, statusFilter, positionFilter, sortBy, searchQuery]);

  // Get unique positions for filter dropdown - memoized
  const uniquePositions = useMemo(() => {
    if (!sessions.length) return [];
    const positions = [...new Set(sessions.map(s => s.position))];
    return positions.sort();
  }, [sessions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const getStatusBadge = (status: string, score: number | null) => {
    switch (status) {
      case 'completed':
        return score !== null ? (
          <Badge variant="secondary" className="font-normal px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="font-normal px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Report Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="font-normal px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-normal px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </Badge>
        );
    }
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

  if (loading) {
    return (
      <DashboardLayout>
        <ReportsPageSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Error Loading Reports</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.score !== null);
  const averageScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length)
    : 0;

  const filteredCompletedSessions = filteredAndSortedSessions.filter(s => s.status === 'completed' && s.score !== null);
  const filteredAverageScore = filteredCompletedSessions.length > 0
    ? Math.round(filteredCompletedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / filteredCompletedSessions.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto sm:pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden pb-12 sm:pt-0">
        {/* Header Section */}
        {/* Header Section */}
        {/* Header Section */}
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Performance Reports
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Detailed analysis of your interview sessions and performance metrics.
          </p>
        </div>

        {/* Action Buttons & Statistics Overview */}
        <div className="flex flex-col xl:flex-row items-stretch gap-4 mb-10">

          {completedSessions.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1">
              {[
                { label: "Total Sessions", value: sessions.length, unit: "", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Completed", value: completedSessions.length, unit: "", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Average Score", value: averageScore, unit: "%", icon: Target, color: "text-primary", bg: "bg-primary/10" },
                { label: "Practice Time", value: formatDurationShort(sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)), icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" }
              ].map((stat, i) => (
                <div key={i} className="bg-card/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20 sm:h-24">
                  <div className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 opacity-[0.08] group-hover:opacity-15 transition-opacity pointer-events-none">
                    <stat.icon className={cn("h-16 w-16 sm:h-20 sm:w-20", stat.color)} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10 truncate">{stat.label}</span>
                  <div className="flex items-baseline gap-0.5 relative z-10">
                    <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tighter">{stat.value}</span>
                    {stat.unit && <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/60">{stat.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports List Section */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center bg-muted/5">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Reports Found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              You haven't completed any interviews yet. Start a new session to begin tracking your performance.
            </p>
            <Button asChild variant="outline" className="h-11 px-8 rounded-full border-primary/20 hover:bg-primary/5 text-primary">
              <Link href="/start-interview">Start Your First Interview</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="bg-card p-4 rounded-2xl border border-border/40 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Input */}
                <div className="relative w-full sm:flex-1 sm:max-w-xs">
                  <Input
                    placeholder="Search role, company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-muted/20 border-border/30 hover:bg-muted/30 focus:bg-muted/30 transition-colors rounded-xl font-medium text-sm"
                  />
                  <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 w-full sm:w-[140px] bg-muted/20 border-border/30 hover:bg-muted/30 rounded-xl font-medium text-sm">
                      <SelectValue placeholder="Status: All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Status: All</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="h-11 w-full sm:w-[140px] bg-muted/20 border-border/30 hover:bg-muted/30 rounded-xl font-medium text-sm">
                      <SelectValue placeholder="Role: All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Role: All</SelectItem>
                      {uniquePositions.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-11 w-full sm:w-[140px] bg-muted/20 border-border/30 hover:bg-muted/30 rounded-xl font-medium text-sm">
                      <SelectValue placeholder="Newest First" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="score-desc">Highest Score</SelectItem>
                    </SelectContent>
                  </Select>

                  {(statusFilter !== 'all' || positionFilter !== 'all' || searchQuery || sortBy !== 'date-desc') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStatusFilter('all');
                        setPositionFilter('all');
                        setSearchQuery('');
                        setSortBy('date-desc');
                      }}
                      className="h-11 w-11 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Structured Table List */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-x-auto no-scrollbar">
              <div className="min-w-[850px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/40 bg-muted/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div className="col-span-4">Role & Protocol</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Performance</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/40">
                  {filteredAndSortedSessions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      No sessions match your filters.
                    </div>
                  ) : filteredAndSortedSessions.map((session, i) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        if (session.status === 'completed' && session.score !== null) {
                          router.push(`/interview/${session.id}/report`);
                        } else {
                          router.push(`/interview/${session.id}/live`);
                        }
                      }}
                      className="group grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-muted/20 active:bg-muted/30 transition-colors cursor-pointer"
                    >
                      {/* Role & Protocol */}
                      <div className="col-span-4 flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${session.score && session.score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          session.score && session.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {session.position.substring(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground text-sm truncate">
                            {session.position}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize truncate font-medium">
                            {session.interview_type.replace('_', ' ')} Protocol
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/40" />
                        {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {/* Duration */}
                      <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                        {formatDurationShort(session.duration_seconds || 0)}
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        {session.status === 'completed' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 animate-pulse">
                            <Play className="h-3 w-3" />
                            In Progress
                          </div>
                        )}
                      </div>

                      {/* Performance */}
                      <div className="col-span-2 flex items-center justify-end gap-3">
                        {session.score !== null ? (
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black shrink-0 ${session.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                              session.score >= 60 ? 'text-amber-600 dark:text-amber-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                              {session.score}%
                            </span>
                            <div className={`h-1.5 w-16 rounded-full bg-muted overflow-hidden`}>
                              <div
                                className={`h-full rounded-full ${session.score >= 80 ? 'bg-emerald-500' :
                                  session.score >= 60 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${session.score}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/60">Report Pending</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Pagination or Footer Info could go here */}
        <div className="flex justify-center text-xs text-muted-foreground font-medium pt-4">
          Showing {filteredAndSortedSessions.length} records
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[1.5rem] sm:rounded-2xl p-6 sm:p-10 border-2 border-border/50 shadow-2xl bg-card/95 backdrop-blur-xl animate-in zoom-in-95 max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-rose-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight">Delete Archive?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base font-medium text-muted-foreground mt-2">
              You are about to permanently purge this intelligence archive. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 sm:mt-10 gap-2 sm:gap-4 flex-col sm:flex-row">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-border hover:bg-muted transition-all">
              Abort Purge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all"
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}