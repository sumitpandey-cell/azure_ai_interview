"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, MessageSquare, ExternalLink, Calendar, Clock, TrendingUp, Filter, SortAsc, SortDesc, Play, BarChart3, CheckCircle2, Target, Timer, Bell, Settings as SettingsIcon, LogOut, ArrowRight, Sparkles, Star, ThumbsUp, ThumbsDown, MoreHorizontal, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ReportsPageSkeleton } from "@/components/ReportsPageSkeleton";
import { interviewService } from "@/services/interview.service";
import { formatDuration, formatDurationShort } from "@/lib/format-duration";
import { useAnalytics } from "@/hooks/use-analytics";
import { useFeedback } from "@/context/FeedbackContext";

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
  const handleDeleteInterview = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      setSessions(sessions.filter(s => s.id !== sessionId));

      // Show success message
      const toast = await import('sonner');
      toast.toast.success('Interview deleted successfully');
    } catch (error) {
      console.error('Error deleting interview:', error);
      const toast = await import('sonner');
      toast.toast.error('Failed to delete interview');
    }
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
      <div className="space-y-6 pb-8">
        {/* Header Section with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              Interview Reports
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </h2>
            <p className="text-muted-foreground text-sm">
              View insights and analysis from your completed interviews
            </p>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {sessions.some(s => s.status === 'in_progress') && (
              <Button
                onClick={handleFixStuckSessions}
                disabled={isFixingStuckSessions}
                variant="outline"
                size="sm"
                className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
              >
                {isFixingStuckSessions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Fixing...
                  </>
                ) : (
                  <>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Fix Stuck Sessions
                  </>
                )}
              </Button>
            )}
          </div>

        </div>

        {/* Statistics Section */}
        {completedSessions.length > 0 && (
          <div className="bg-card rounded-2xl px-8 py-5 shadow-sm border border-border">
            <Tabs defaultValue="overall" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-foreground">Statistics</h3>
                <TabsList className="grid w-full sm:w-[280px] grid-cols-2">
                  <TabsTrigger value="overall">Overall</TabsTrigger>
                  <TabsTrigger value="filtered">Filtered</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overall" className="mt-0">
                <div className="grid grid-cols-2 gap-6 md:flex md:divide-x md:divide-border md:gap-0">
                  <div className="flex flex-col md:pr-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Total Interviews</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">{sessions.length}</span>
                  </div>

                  <div className="flex flex-col md:px-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Completed</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">{completedSessions.length}</span>
                  </div>

                  <div className="flex flex-col md:px-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Average Score</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">{averageScore}%</span>
                  </div>

                  <div className="flex flex-col md:pl-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Practice Time</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">
                      {formatDurationShort(sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0))}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="filtered" className="mt-0">
                <div className="grid grid-cols-2 gap-6 md:flex md:divide-x md:divide-border md:gap-0">
                  <div className="flex flex-col md:pr-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Showing</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">{filteredAndSortedSessions.length}</span>
                  </div>

                  <div className="flex flex-col md:px-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Completed</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">{filteredCompletedSessions.length}</span>
                  </div>

                  <div className="flex flex-col md:px-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Average Score</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">{filteredAverageScore}%</span>
                  </div>

                  <div className="flex flex-col md:pl-8">
                    <span className="text-sm text-muted-foreground mb-1 font-normal">Practice Time</span>
                    <span className="text-2xl md:text-4xl font-bold text-foreground">
                      {formatDurationShort(filteredAndSortedSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0))}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Charts & Analysis Section */}
        {completedSessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Analysis - 6 Month Trend */}
            <Card className="col-span-1 lg:col-span-2 border-none shadow-sm bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Performance Analysis</h3>
                    <p className="text-sm text-muted-foreground">Interview Count & Average Score (Last 6 Months)</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
                        domain={[0, 100]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        label={{ value: 'Count', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                        cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Avg Score"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="interviewCount"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Interviews"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Skill Progress - Top Skills */}
            <Card className="col-span-1 border-none shadow-sm bg-card">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground">Top Skills</h3>
                  <p className="text-sm text-muted-foreground">Average Performance by Skill</p>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillProgress.slice(0, 5).map(skill => ({
                      name: skill.name.length > 15 ? skill.name.substring(0, 12) + '...' : skill.name,
                      score: skill.averageScore,
                      fullName: skill.name
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        dy={10}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                        formatter={(value: any, name: any, props: any) => [
                          `${value}%`,
                          props.payload.fullName
                        ]}
                      />
                      <Bar
                        dataKey="score"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {sessions.length === 0 ? (
          <Card className="border-none shadow-md bg-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Interview Reports Yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete your first interview to see detailed reports and analytics here.
              </p>
              <Button asChild>
                <Link href="/start-interview">Start Your First Interview</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            {/* Filters Section */}
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center">
                <div className="flex items-center gap-2 mb-2 lg:mb-0">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Filters:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 flex-1 w-full">
                  <Input
                    placeholder="Search by position or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full lg:w-64 bg-background"
                  />

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-40 bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="w-full lg:w-40 bg-background">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {uniquePositions.map(position => (
                        <SelectItem key={position} value={position}>{position}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-48 bg-background">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="score-desc">Highest Score</SelectItem>
                      <SelectItem value="score-asc">Lowest Score</SelectItem>
                      <SelectItem value="duration-desc">Longest Duration</SelectItem>
                      <SelectItem value="duration-asc">Shortest Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(statusFilter !== 'all' || positionFilter !== 'all' || searchQuery || sortBy !== 'date-desc') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPositionFilter('all');
                      setSearchQuery('');
                      setSortBy('date-desc');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {filteredAndSortedSessions.length !== sessions.length && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Showing {filteredAndSortedSessions.length} of {sessions.length} interviews
                </div>
              )}
            </CardContent>

            {/* Separator Line */}
            <div className="border-t border-border" />

            {/* Reports List Section */}
            <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold mb-4 sm:mb-6 text-foreground">All Interview Reports</h3>

              {/* Table View */}
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
                    {filteredAndSortedSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (session.status === 'completed' && session.score !== null) {
                            router.push(`/interview/${session.id}/report`);
                          } else {
                            router.push(`/interview/${session.id}/active`);
                          }
                        }}
                      >
                        <td className="py-3 sm:py-4 pl-2 sm:pl-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full font-medium bg-primary/10 text-primary items-center justify-center">
                              {session.position.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{session.position}</span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 text-muted-foreground text-sm">
                          {new Date(session.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 sm:py-4 text-foreground text-sm font-medium capitalize">
                          {session.interview_type.replace('_', ' ')}
                        </td>
                        <td className="py-3 sm:py-4 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(session.duration_seconds || 0)}</span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4">
                          {getStatusBadge(session.status, session.score)}
                        </td>
                        <td className="py-3 sm:py-4">
                          <span className={`text-lg font-bold ${(session.score || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                            (session.score || 0) >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                            {session.score !== null ? `${session.score}%` : '-'}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {renderStars(session.score)}
                            <div className="flex gap-1 ml-2 border-l pl-3 border-border">
                              <ThumbsUp className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 text-right pr-2 sm:pr-4 flex justify-end">
                          {session.status === 'completed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`rounded-full border-border hover:bg-accent hover:text-accent-foreground px-3 sm:px-6 text-xs sm:text-sm h-7 sm:h-9 ${session.score !== null ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (session.status === 'completed' && session.score === null) {
                                  generateFeedbackInBackground(session.id);
                                }
                                router.push(`/interview/${session.id}/report`);
                              }}
                            >
                              {session.score !== null ? 'Report' : 'Generate Report'}
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => router.push(`/interview/${session.id}/live`)}
                              className="h-8 px-4 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Continue
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}