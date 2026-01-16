"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, MessageSquare, ExternalLink, Calendar, Clock, TrendingUp, Filter, SortAsc, SortDesc, Play, BarChart3, CheckCircle2, Target, Timer, Bell, Settings as SettingsIcon, LogOut, ArrowRight, Sparkles, Star, ThumbsUp, ThumbsDown, MoreHorizontal, Trash2, Briefcase, RefreshCw, LineChart as LineChartIcon, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isFixingStuckSessions, setIsFixingStuckSessions] = useState(false);
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

  // Fix stuck sessions function
  const handleFixStuckSessions = async () => {
    if (!user?.id) return;

    if (!confirm('This will complete all stuck sessions and generate missing feedback. Continue?')) {
      return;
    }

    setIsFixingStuckSessions(true);

    try {
      const response = await fetch('/api/fix-stuck-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const result = await response.json();
        const toast = await import('sonner');

        if (result.fixed > 0) {
          toast.toast.success(`Fixed ${result.fixed} stuck sessions`);
          // Reload sessions to reflect changes
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.toast.info('No stuck sessions found');
        }

        if (result.errors.length > 0) {
          console.error('Errors fixing sessions:', result.errors);
        }
      } else {
        throw new Error('Failed to fix stuck sessions');
      }
    } catch (error) {
      console.error('Error fixing stuck sessions:', error);
      const toast = await import('sonner');
      toast.toast.error('Failed to fix stuck sessions');
    } finally {
      setIsFixingStuckSessions(false);
    }
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
      <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-10 pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden pb-12 pt-10 sm:pt-0">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 relative flex-wrap min-w-0">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
              <BarChart3 className="h-3 w-3" />
              Analytics Hub
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                Performance <span className="text-primary italic">Intelligence</span>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg font-medium mt-2 max-w-2xl leading-relaxed">
                Deep-dive analytics and comprehensive insights from your professional journey.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {sessions.some(s => s.status === 'in_progress') && (
              <Button
                onClick={handleFixStuckSessions}
                disabled={isFixingStuckSessions}
                variant="outline"
                className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 font-black uppercase tracking-widest text-[9px] sm:text-[10px]"
              >
                {isFixingStuckSessions ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <SettingsIcon className="h-4 w-4 mr-2" />
                )}
                Restore Sessions
              </Button>
            )}
            <Button asChild className="h-10 sm:h-12 flex-1 sm:flex-none px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl shadow-primary/20">
              <Link href="/start-interview" className="flex items-center gap-2">
                <Play className="h-4 w-4 fill-current" />
                New Session
              </Link>
            </Button>
          </div>

          {/* Decorative Mesh Background */}
          <div className="absolute -top-24 -right-24 h-96 w-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {/* Statistics Section */}
        {completedSessions.length > 0 && (
          <div className="relative group/stats animate-in fade-in slide-in-from-top-4 duration-1000 delay-100">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[3rem] blur opacity-20 group-hover/stats:opacity-40 transition duration-1000" />

            <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-[1.5rem] sm:rounded-2xl p-5 sm:p-8 md:p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 h-full w-1/3 bg-grid-white/5 mask-gradient-to-l pointer-events-none opacity-20" />

              <Tabs defaultValue="overall" className="w-full relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 px-2 sm:px-0">
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 uppercase text-foreground">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Executive Intelligence
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Protocol Performance Metrics</p>
                  </div>
                  <TabsList className="bg-muted/30 p-1 rounded-2xl h-10 sm:h-12 w-fit">
                    <TabsTrigger value="overall" className="rounded-xl px-4 sm:px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">Universal</TabsTrigger>
                    <TabsTrigger value="filtered" className="rounded-xl px-4 sm:px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">Segmented</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overall" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {[
                      { label: "Total Engagements", value: sessions.length, icon: FileText, color: "text-blue-500" },
                      { label: "Victory Rate", value: completedSessions.length, unit: " Sessions", icon: CheckCircle2, color: "text-emerald-500" },
                      { label: "Aggregate Mastery", value: averageScore, unit: "%", icon: Target, color: "text-primary" },
                      { label: "Operational Time", value: formatDurationShort(sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)), icon: Timer, color: "text-amber-500" }
                    ].map((stat, i) => (
                      <div key={i} className="flex flex-col gap-2 group/stat p-5 rounded-3xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-all duration-500">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-background flex items-center justify-center shadow-sm border border-border/50 group-hover/stat:scale-110 transition-transform duration-500", stat.color)}>
                            <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter tabular-nums text-foreground">{stat.value}</span>
                          {stat.unit && <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="filtered" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      { label: "Target Scope", value: filteredAndSortedSessions.length, icon: Filter, color: "text-blue-500" },
                      { label: "Segment Completion", value: filteredCompletedSessions.length, icon: CheckCircle2, color: "text-emerald-500" },
                      { label: "Segment Mastery", value: filteredAverageScore, unit: "%", icon: Target, color: "text-primary" },
                      { label: "Active Engagement", value: formatDurationShort(filteredAndSortedSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)), icon: Timer, color: "text-amber-500" }
                    ].map((stat, i) => (
                      <div key={i} className="flex flex-col gap-2 group/stat p-5 rounded-3xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-all duration-500">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-background flex items-center justify-center shadow-sm border border-border/50 group-hover/stat:scale-110 transition-transform duration-500", stat.color)}>
                            <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black tracking-tighter tabular-nums text-foreground">{stat.value}</span>
                          {stat.unit && <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}

        {/* Visual Analysis Section */}
        {completedSessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            {/* Performance Analysis */}
            <Card className="col-span-1 lg:col-span-2 border-2 border-border/50 shadow-2xl bg-card rounded-[1.5rem] sm:rounded-2xl overflow-hidden group/chart relative">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 blur-3xl rounded-full translate-x-16 -translate-y-16" />
              <CardContent className="p-5 sm:p-8 md:p-10 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 uppercase text-foreground">
                      <LineChartIcon className="h-5 w-5 text-primary" />
                      Performance Trajectory
                    </h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Mastery & Engagement (Last 6 Months)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expertise</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity</span>
                    </div>
                  </div>
                </div>

                <div className="h-[250px] sm:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                        dy={15}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                        domain={[0, 100]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '20px',
                          border: '1px solid hsl(var(--border) / 0.5)',
                          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                          backgroundColor: 'hsl(var(--card) / 0.95)',
                          backdropFilter: 'blur(10px)',
                          padding: '16px'
                        }}
                        cursor={{ stroke: '#A855F7', strokeWidth: 2, strokeDasharray: '5 5' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#A855F7"
                        strokeWidth={4}
                        dot={{ fill: '#A855F7', strokeWidth: 3, r: 5, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }}
                        name="Avg Expertise"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="interviewCount"
                        stroke="#10B981"
                        strokeWidth={4}
                        dot={{ fill: '#10B981', strokeWidth: 3, r: 5, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }}
                        name="Volume"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Expertise Bar Chart */}
            <Card className="col-span-1 border-2 border-border/50 shadow-2xl bg-card rounded-[1.5rem] sm:rounded-2xl overflow-hidden group/top-skills relative">
              <div className="absolute top-0 right-0 h-full w-full bg-grid-white/5 opacity-10 pointer-events-none" />
              <CardContent className="p-5 sm:p-8 md:p-10 relative z-10">
                <div className="mb-10">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase text-foreground">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Specialized Mastery
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Core Competency distribution</p>
                </div>

                <div className="h-[250px] sm:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillProgress.slice(0, 5).map(skill => ({
                      name: skill.name.length > 15 ? skill.name.substring(0, 12) + '...' : skill.name,
                      score: skill.averageScore,
                      fullName: skill.name
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                        dy={15}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 10 }}
                        contentStyle={{
                          borderRadius: '20px',
                          border: '1px solid hsl(var(--border) / 0.5)',
                          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                          backgroundColor: 'hsl(var(--card) / 0.95)',
                          backdropFilter: 'blur(10px)',
                          padding: '16px'
                        }}
                      />
                      <Bar
                        dataKey="score"
                        radius={[10, 10, 0, 0]}
                        barSize={45}
                      >
                        {skillProgress.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#A855F7" : "hsl(var(--primary) / 0.4)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Archive */}
        {sessions.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Card className="border-2 border-border/50 shadow-2xl bg-card rounded-[1.5rem] sm:rounded-2xl overflow-hidden group/empty">
              <CardContent className="p-10 sm:p-20 text-center relative">
                <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />
                <div className="relative z-10 max-w-lg mx-auto space-y-8 px-4">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-primary/10 rounded-[1.5rem] sm:rounded-2xl flex items-center justify-center mx-auto group-hover/empty:scale-110 group-hover/empty:rotate-6 transition-all duration-700">
                    <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-foreground leading-tight">Operational Void Detected</h3>
                    <p className="text-muted-foreground text-sm sm:text-lg font-medium leading-relaxed">
                      No session archives were found in your intelligence database. Initiate your first operational protocol to begin data collection.
                    </p>
                  </div>
                  <Button asChild size="lg" className="h-14 sm:h-16 px-8 sm:px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[12px] shadow-2xl shadow-primary/20 group-hover/empty:scale-105 transition-all duration-300">
                    <Link href="/start-interview" className="flex items-center gap-3">
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                      Launch Primary Protocol
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            {/* Dynamic Filter Station - Mobile Optimized */}
            <Card className="border-2 border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 h-full w-40 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Mobile Header with Filter Toggle */}
                  <div className="flex items-center justify-between sm:hidden">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Filter className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Filters</span>
                      {(statusFilter !== 'all' || positionFilter !== 'all' || searchQuery || sortBy !== 'date-desc') && (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                      className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest"
                    >
                      {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Desktop Header */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Filter className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter Station</span>
                  </div>

                  {/* Filter Controls - Collapsible on mobile, always visible on desktop */}
                  <div className={cn(
                    "space-y-3 sm:space-y-0",
                    !isFilterExpanded && "hidden sm:block"
                  )}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {/* Search - Full width on mobile */}
                      <div className="relative group flex-1">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="Search Directives..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-11 sm:h-12 bg-background/50 border-border/50 rounded-xl font-bold text-sm focus:ring-primary focus:border-primary transition-all duration-300"
                        />
                      </div>

                      {/* Filter Row - 2 columns on mobile, all in a row on desktop */}
                      <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-11 sm:h-12 bg-background/50 border-border/50 rounded-xl font-bold text-xs sm:text-sm min-w-0 sm:min-w-[140px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">
                                {statusFilter === 'all' ? 'Status' : statusFilter === 'completed' ? 'Done' : 'Active'}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-2xl">
                            <SelectItem value="all" className="font-bold py-2.5 text-xs sm:text-sm">All Status</SelectItem>
                            <SelectItem value="completed" className="font-bold py-2.5 text-xs sm:text-sm text-emerald-500">Completed</SelectItem>
                            <SelectItem value="in-progress" className="font-bold py-2.5 text-xs sm:text-sm text-blue-500">In Progress</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                          <SelectTrigger className="h-11 sm:h-12 bg-background/50 border-border/50 rounded-xl font-bold text-xs sm:text-sm min-w-0 sm:min-w-[140px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">
                                {positionFilter === 'all' ? 'Role' : positionFilter.length > 12 ? `${positionFilter.substring(0, 12)}...` : positionFilter}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-2xl max-h-[300px]">
                            <SelectItem value="all" className="font-bold py-2.5 text-xs sm:text-sm">All Roles</SelectItem>
                            {uniquePositions.map(position => (
                              <SelectItem key={position} value={position} className="font-bold py-2.5 text-xs sm:text-sm">{position}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="h-11 sm:h-12 bg-background/50 border-border/50 rounded-xl font-bold text-xs sm:text-sm col-span-2 sm:col-span-1 min-w-0 sm:min-w-[140px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <SortAsc className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">
                                {sortBy === 'date-desc' ? 'Newest' :
                                  sortBy === 'date-asc' ? 'Oldest' :
                                    sortBy === 'score-desc' ? 'Top Score' : 'Low Score'}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-2xl">
                            <SelectItem value="date-desc" className="font-bold py-2.5 text-xs sm:text-sm">Newest First</SelectItem>
                            <SelectItem value="date-asc" className="font-bold py-2.5 text-xs sm:text-sm">Oldest First</SelectItem>
                            <SelectItem value="score-desc" className="font-bold py-2.5 text-xs sm:text-sm">Highest Score</SelectItem>
                            <SelectItem value="score-asc" className="font-bold py-2.5 text-xs sm:text-sm">Lowest Score</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(statusFilter !== 'all' || positionFilter !== 'all' || searchQuery || sortBy !== 'date-desc') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatusFilter('all');
                          setPositionFilter('all');
                          setSearchQuery('');
                          setSortBy('date-desc');
                        }}
                        className="h-9 w-full sm:w-auto px-4 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intelligence Archives List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-6">
                <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase flex items-center gap-3 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Archives
                  <span className="text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary tracking-widest">
                    {filteredAndSortedSessions.length} RECORDS
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredAndSortedSessions.map((session, index) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (session.status === 'completed' && session.score !== null) {
                        router.push(`/interview/${session.id}/report`);
                      } else {
                        router.push(`/interview/${session.id}/live`);
                      }
                    }}
                    className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-[1.5rem] sm:rounded-2xl opacity-0 group-hover:opacity-10 blur-md transition duration-500" />

                    <Card className="border-2 border-border/50 shadow-sm bg-card/80 hover:bg-card rounded-[1.5rem] sm:rounded-[1.5rem] transition-all duration-500 overflow-hidden cursor-pointer group-hover:shadow-2xl group-hover:shadow-primary/5 group-hover:-translate-y-1">
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row items-stretch">
                          {/* Main Content Area */}
                          <div className="flex-1 flex items-center gap-4 p-4 sm:p-6 min-w-0">
                            {/* Visual Gauge */}
                            <div className="shrink-0 relative h-14 w-14 sm:h-20 sm:w-20">
                              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" className="fill-none stroke-muted/20" strokeWidth="8" />
                                <circle
                                  cx="50" cy="50" r="45"
                                  strokeLinecap="round"
                                  className={cn(
                                    "fill-none transition-all duration-1000",
                                    (session.score || 0) >= 80 ? "stroke-emerald-500" :
                                      (session.score || 0) >= 60 ? "stroke-primary" : "stroke-rose-500"
                                  )}
                                  strokeWidth="8"
                                  strokeDasharray={`${(session.score || 0) * 2.827}, 282.7`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base sm:text-xl font-black tracking-tighter text-foreground">{session.score || 0}</span>
                              </div>
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                <h4 className="text-base sm:text-xl font-black tracking-tight text-foreground truncate max-w-full">
                                  {session.position}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="h-5 rounded-md border-primary/20 bg-primary/5 text-primary text-[7px] font-black uppercase tracking-widest px-2">
                                    {session.interview_type.replace('_', ' ')}
                                  </Badge>
                                  {session.status === 'completed' ? (
                                    <Badge className="h-5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[7px] font-black uppercase tracking-widest px-2">
                                      COMPLETE
                                    </Badge>
                                  ) : (
                                    <Badge className="h-5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[7px] font-black uppercase tracking-widest px-2 animate-pulse">
                                      LIVE
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                  <Clock className="h-3 w-3" />
                                  {formatDurationShort(session.duration_seconds || 0)}
                                </div>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "h-2.5 w-2.5",
                                        i < (Math.round((session.score || 0) / 20)) ? "fill-primary text-primary" : "text-muted/30"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Hub - Stacks on mobile, stays right on desktop */}
                          <div className="flex items-center gap-3 p-3 sm:p-4 lg:p-6 bg-muted/20 lg:bg-transparent lg:border-l border-border/50 border-t lg:border-t-0">
                            <Button
                              className="h-11 sm:h-12 flex-1 lg:flex-none px-6 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (session.status === 'completed' && session.score !== null) {
                                  router.push(`/interview/${session.id}/report`);
                                } else {
                                  router.push(`/interview/${session.id}/live`);
                                }
                              }}
                            >
                              {session.status === 'completed' && session.score !== null ? "Access Intel" : "Resume Protocol"}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
                              onClick={(e) => handleDeleteInterview(session.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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