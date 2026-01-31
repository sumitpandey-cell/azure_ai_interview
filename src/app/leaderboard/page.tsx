'use client'
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Search, Award, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { LeaderboardPageSkeleton } from "@/components/LeaderboardPageSkeleton";
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useMemo, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardUser {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  oauthPicture?: string | null;
  interviewCount: number;
  averageScore: number;
  bayesianScore: number;
  gender?: string;
}

const ITEMS_PER_PAGE = 50;

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [podiumUsers, setPodiumUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, fetchLeaderboard } = useOptimizedQueries();

  const loadLeaderboard = useCallback(async (page: number, force = false) => {
    try {
      setLoading(true);

      // Fetch fresh data
      const result = await fetchLeaderboard(ITEMS_PER_PAGE, page, force);

      if (result) {
        setUsers(result.users);
        setTotalUsers(result.totalUsers);

        // Always store page 0 as podium users if they aren't set
        if (page === 0) {
          setPodiumUsers(result.users.slice(0, 3));
        } else if (podiumUsers.length === 0) {
          // If we started on another page but have no podium, fetch it
          const topResult = await fetchLeaderboard(3, 0, false);
          setPodiumUsers(topResult.users);
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchLeaderboard, podiumUsers.length, toast]);

  useEffect(() => {
    loadLeaderboard(currentPage);
  }, [loadLeaderboard, currentPage]);

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredUsersWithRank = useMemo(() => {
    // Associate each user with their global rank based on current page
    const usersWithRank = users.map((u, i) => ({
      ...u,
      rank: (currentPage * ITEMS_PER_PAGE) + i + 1
    }));

    if (!searchQuery) return usersWithRank;

    const query = searchQuery.toLowerCase();
    return usersWithRank.filter(u =>
      u.fullName?.toLowerCase().includes(query)
    );
  }, [users, searchQuery, currentPage]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredUsersWithRank.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each row
    overscan: 10,
  });

  // Re-usable Row Component for virtualization
  const LeaderboardRow = React.memo(({
    leaderboardUser,
    style
  }: {
    leaderboardUser: LeaderboardUser & { rank: number };
    index: number;
    style?: React.CSSProperties
  }) => {
    const isTop3 = leaderboardUser.rank <= 3;
    const isCurrentUser = leaderboardUser.userId === user?.id;
    const displayName = isCurrentUser
      ? (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || leaderboardUser.fullName || "Unknown Candidate")
      : (leaderboardUser.fullName || "Unknown Candidate");

    return (
      <div
        key={leaderboardUser.userId}
        className={cn(
          "flex items-center transition-colors border-b border-border/10 last:border-0 group h-[80px]",
          isCurrentUser ? "bg-primary/[0.05] dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20" : "hover:bg-muted/30"
        )}
        style={style}
      >
        <div className="flex-[0.5] min-w-[80px] flex items-center justify-center">
          <div className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black shadow-inner transition-transform group-hover:scale-110",
            leaderboardUser.rank === 1 ? "bg-yellow-500 text-yellow-950 shadow-yellow-500/20" :
              leaderboardUser.rank === 2 ? "bg-slate-300 text-slate-900 shadow-slate-300/20" :
                leaderboardUser.rank === 3 ? "bg-amber-600 text-amber-50 shadow-amber-600/20" :
                  "text-muted-foreground bg-muted/20"
          )}>
            {leaderboardUser.rank}
          </div>
        </div>

        <div className="flex-[2] min-w-0 px-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-background shadow-xl">
              <AvatarImage src={getAvatarUrl(leaderboardUser.avatarUrl, leaderboardUser.userId, 'avataaars', leaderboardUser.oauthPicture, leaderboardUser.gender)} />
              <AvatarFallback className="font-bold">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-black tracking-tight truncate", isCurrentUser ? "text-primary" : "text-foreground")}>
              {displayName}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
              {leaderboardUser.userId.slice(0, 8)} • Verified
            </p>
          </div>
        </div>

        <div className="flex-1 text-center flex flex-col items-center justify-center">
          <span className="font-black text-foreground text-sm">{leaderboardUser.bayesianScore.toFixed(0)} pts</span>
          <div className="h-1 w-12 bg-muted/30 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (leaderboardUser.bayesianScore / 100) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-1 text-center flex items-center justify-center">
          <span className="text-sm font-bold text-foreground/80 bg-muted/20 px-3 py-1 rounded-lg">
            {leaderboardUser.interviewCount}
          </span>
        </div>

        <div className="flex-1 text-center flex items-center justify-center pr-4">
          {isTop3 ? (
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-[9px] font-black tracking-widest uppercase px-2 py-0.5 shadow-lg shadow-indigo-500/20">
              Legends
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-border/50">
              Candidate
            </Badge>
          )}
        </div>
      </div>
    );
  });
  LeaderboardRow.displayName = "LeaderboardRow";





  const TopPlayerCard = ({ user: player, rank, className }: { user: LeaderboardUser; rank: number; className?: string }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isMe = player.userId === user?.id;
    const displayName = isMe
      ? (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || player.fullName || "Unknown Candidate")
      : (player.fullName || "Unknown Candidate");

    const getRankStyles = () => {
      if (isFirst) return {
        border: "border-yellow-500/50 shadow-yellow-500/20",
        glow: "bg-yellow-500/10",
        text: "text-yellow-600 dark:text-yellow-400",
        badge: "bg-yellow-500 text-yellow-950",
        icon: <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
      };
      if (isSecond) return {
        border: "border-slate-300/50 shadow-slate-300/20",
        glow: "bg-slate-300/10",
        text: "text-slate-600 dark:text-slate-300",
        badge: "bg-slate-300 text-slate-900",
        icon: <Award className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
      };
      return {
        border: "border-amber-600/50 shadow-amber-600/20",
        glow: "bg-amber-600/10",
        text: "text-amber-700 dark:text-amber-500",
        badge: "bg-amber-600 text-amber-50",
        icon: <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
      };
    };

    const styles = getRankStyles();

    return (
      <div
        className={cn(
          "relative flex flex-col items-center group transition-all duration-700 ease-out",
          isFirst ? "z-30 scale-100 lg:scale-110" : "z-10 scale-90 lg:scale-95",
          className
        )}
        style={{ animationDelay: `${rank * 100}ms` }}
      >
        {/* Animated Background Glow */}
        <div className={cn(
          "absolute inset-0 blur-3xl opacity-20 transition-all duration-700 group-hover:opacity-40",
          styles.glow
        )} />

        <Card className={cn(
          "w-full overflow-hidden border-2 transition-all duration-500 bg-background/60 backdrop-blur-xl relative z-10",
          styles.border,
          "hover:shadow-2xl hover:translate-y-[-4px]"
        )}>
          {/* Top Rank Banner */}
          <div className={cn("h-1.5 w-full", isFirst ? "bg-yellow-500" : isSecond ? "bg-slate-300" : "bg-amber-600")} />

          <CardContent className="p-3 sm:p-6 flex flex-col items-center pt-6 sm:pt-10">
            {/* Rank Badge */}
            <div className={cn(
              "absolute top-2 right-2 sm:top-4 sm:right-4 h-6 w-6 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[10px] sm:text-sm shadow-inner",
              styles.badge
            )}>
              {rank}
            </div>

            {/* Avatar Section */}
            <div className="relative mb-3 sm:mb-6">
              <div className={cn(
                "w-14 h-14 sm:w-24 sm:h-24 rounded-full p-1 sm:p-1.5 border-2 sm:border-4 relative transition-transform duration-500 group-hover:rotate-6",
                isFirst ? "border-yellow-500" : isSecond ? "border-slate-300" : "border-amber-600"
              )}>
                <Avatar className="w-full h-full rounded-full ring-2 sm:ring-4 ring-black/5 dark:ring-white/5">
                  <AvatarImage
                    src={getAvatarUrl(player.avatarUrl, player.userId, 'avataaars', player.oauthPicture, player.gender)}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-sm sm:text-2xl font-black bg-muted/30">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Floating Rank Icon */}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-background rounded-full p-1 sm:p-1.5 shadow-xl border border-border">
                  {styles.icon}
                </div>
              </div>
            </div>

            {/* Candidate Info */}
            <div className="text-center space-y-1 w-full mb-3 sm:mb-6">
              <h3 className="text-foreground font-black text-[10px] sm:text-xl truncate w-full px-1 tracking-tight group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <div className={cn(
                "inline-flex text-[7px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg border",
                isFirst ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400" :
                  isSecond ? "bg-slate-300/10 border-slate-300/30 text-slate-600 dark:text-slate-300" :
                    "bg-amber-600/10 border-amber-600/30 text-amber-700 dark:text-amber-500"
              )}>
                {isFirst ? "MVP" : isSecond ? "Pro" : "Elite"}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-px bg-border/20 w-full rounded-xl sm:rounded-2xl overflow-hidden border border-border/20">
              <div className="bg-background/40 p-2 sm:p-3 text-center backdrop-blur-md">
                <p className="hidden sm:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Score</p>
                <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                  <span className={cn("text-[10px] sm:text-xl font-black tabular-nums", styles.text)}>
                    {player.bayesianScore.toFixed(0)} pts
                  </span>
                </div>
              </div>
              <div className="bg-background/40 p-2 sm:p-3 text-center backdrop-blur-md border-l border-border/20">
                <p className="hidden sm:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Interviews</p>
                <p className="text-[10px] sm:text-xl font-black tabular-nums text-foreground">
                  {player.interviewCount}
                </p>
              </div>
            </div>


          </CardContent>
        </Card>
      </div>
    );
  };
  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Leaderboard
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              See how you stack up against the global network of developers.
            </p>

            {!loading && users.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {users.slice(0, 3).map((u, i) => (
                    <Avatar key={i} className="inline-block h-6 w-6 ring-2 ring-background">
                      <AvatarImage src={getAvatarUrl(u.avatarUrl, u.userId, 'avataaars', u.oauthPicture, u.gender)} />
                      <AvatarFallback>{u.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground ml-2">
                  <span className="font-semibold text-foreground">{users.length}</span> Active Candidates
                </p>
              </div>
            )}
          </div>

          {user && users.find(u => u.userId === user.id) && (() => {
            const userRank = users.findIndex(u => u.userId === user.id) + 1;
            const userScore = users.find(u => u.userId === user.id)?.bayesianScore.toFixed(0);

            return (
              <Card className="flex flex-row items-center gap-6 p-4 sm:p-5 border-primary/30 dark:border-primary/20 bg-primary/[0.03] dark:bg-primary/5 shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Rank</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">#{userRank}</span>
                    <span className="text-xs text-muted-foreground">/{users.length}</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">{userScore}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                </div>
              </Card>

            );
          })()}
        </div>

        {loading ? (
          <LeaderboardPageSkeleton />
        ) : users.length === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-20 text-center">
              <Trophy className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-lg text-muted-foreground">
                No data available yet. Start interviewing to appear here!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium Section - Premium Horizontal Layout */}
            <div className="w-full mt-12 mb-16 relative overflow-visible">
              {/* Podium Decorative Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[400px] bg-primary/5 blur-[100px] -z-10 pointer-events-none" />

              <div className="flex flex-row items-end justify-center gap-2 sm:gap-6 lg:gap-10 w-full max-w-6xl mx-auto px-2">
                {/* 2nd Place */}
                {podiumUsers[1] && (
                  <TopPlayerCard
                    user={podiumUsers[1]}
                    rank={2}
                    className="flex-1 min-w-0 max-w-[280px]"
                  />
                )}

                {/* 1st Place */}
                {podiumUsers[0] && (
                  <TopPlayerCard
                    user={podiumUsers[0]}
                    rank={1}
                    className="flex-1 min-w-0 max-w-[320px] -mb-4 sm:-mb-6"
                  />
                )}

                {/* 3rd Place */}
                {podiumUsers[2] && (
                  <TopPlayerCard
                    user={podiumUsers[2]}
                    rank={3}
                    className="flex-1 min-w-0 max-w-[280px]"
                  />
                )}
              </div>

              {/* Podium Floor Shadow */}
              <div className="mt-8 h-4 w-4/5 mx-auto bg-foreground/5 dark:bg-foreground/5 blur-xl rounded-[100%]" />
            </div>

            {/* Filters & Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card dark:bg-card/50 border border-border/80 dark:border-border rounded-xl p-1.5 mb-6 shadow-sm">

              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidate..."
                  className="pl-9 bg-muted/40 dark:bg-transparent border-none shadow-none focus-visible:ring-0 rounded-lg h-9 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="h-6 w-px bg-border/60 hidden sm:block" />
                <Select>
                  <SelectTrigger className="w-full sm:w-[130px] border-none shadow-none bg-muted/40 dark:bg-transparent rounded-lg h-9 font-bold text-xs">

                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="fullstack">Fullstack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rankings Table */}
            <Card className="border border-border/80 dark:border-border shadow-md dark:shadow-sm overflow-hidden bg-card dark:bg-card">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-card">
                  <TableRow className="bg-muted/30 dark:bg-muted/40 hover:bg-muted/30 border-b border-border">
                    <TableHead className="w-[80px] text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Rank</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Candidate</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Score</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Interviews</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>

              <div
                ref={parentRef}
                className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <div className="w-full">
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                      <LeaderboardRow
                        key={filteredUsersWithRank[virtualRow.index].userId}
                        leaderboardUser={filteredUsersWithRank[virtualRow.index]}
                        index={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {!loading && filteredUsersWithRank.length === 0 && (
                  <div className="py-20 text-center text-muted-foreground">
                    No matches for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </Card>

            {/* Pagination Controls */}
            {!loading && totalUsers > ITEMS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-card/50 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">
                  Showing <span className="text-foreground font-black">{currentPage * ITEMS_PER_PAGE + 1}</span> to <span className="text-foreground font-black">{Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalUsers)}</span> of <span className="text-foreground font-black">{totalUsers}</span> candidates
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-border/50 bg-background/50 hover:bg-primary/5 active:scale-95 transition-all"
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0}
                  >
                    <ChevronsLeft className="h-4 w-4 text-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-border/50 bg-background/50 hover:bg-primary/5 active:scale-95 transition-all"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 text-foreground" />
                  </Button>

                  <div className="flex items-center px-4 font-black text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-border/50 bg-background/50 hover:bg-primary/5 active:scale-95 transition-all"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4 text-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-border/50 bg-background/50 hover:bg-primary/5 active:scale-95 transition-all"
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronsRight className="h-4 w-4 text-foreground" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Card className="p-6 border border-border/80 dark:border-border shadow-sm bg-card/80 dark:bg-card">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-foreground">Ranking System</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                    Scores are calculated using a Bayesian average that balances your raw interview performance with your consistency over time (logarithmic scale).
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border border-border/80 dark:border-border shadow-sm bg-card/80 dark:bg-card">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-foreground">Pro Tip</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic font-medium">
                    &quot;High-caliber performance in fewer sessions outweighs high attrition rates. Focus on quality over raw volume.&quot;
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}



      </div >
    </DashboardLayout >
  );
};

export default Leaderboard;
