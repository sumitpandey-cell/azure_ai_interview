'use client'
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Search, TrendingUp, Users, Award, Download, Copy, Check, ArrowRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeaderboardPageSkeleton } from "@/components/LeaderboardPageSkeleton";

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

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, leaderboard, fetchLeaderboard, isCached } = useOptimizedQueries();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);

        // Check if we have cached data
        if (isCached.leaderboard && leaderboard.length > 0) {
          setUsers(leaderboard);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const data = await fetchLeaderboard();
        setUsers(data);
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
    };

    loadLeaderboard();
  }, [fetchLeaderboard, leaderboard, isCached.leaderboard, toast]);

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = (user: LeaderboardUser, rank: number) => {
    setSelectedUser(user);
    setSelectedRank(rank);
    setShareModalOpen(true);
  };

  const handleDownloadCard = async () => {
    const cardElement = document.getElementById('share-card');
    if (!cardElement) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2;
      const width = 800;
      const height = 600;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // 1. Background (Deep Space Dark)
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#020617'); // slate-950
      bgGradient.addColorStop(1, '#0f172a'); // slate-900
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Ambient Glows
      // Top Right Purple Glow
      const glow1 = ctx.createRadialGradient(width, 0, 0, width, 0, 400);
      glow1.addColorStop(0, 'rgba(99, 102, 241, 0.15)'); // indigo-500
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // Bottom Left Blue Glow
      const glow2 = ctx.createRadialGradient(0, height, 0, 0, height, 400);
      glow2.addColorStop(0, 'rgba(59, 130, 246, 0.15)'); // blue-500
      glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // 2. Glass Card Container
      const cardX = 60;
      const cardY = 60;
      const cardW = width - 120;
      const cardH = height - 120;
      const radius = 32;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;

      // Card Background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)'; // slate-800/70
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      // Card Border (Gradient)
      const borderGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 3. Header
      // Logo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ArjunaAI', cardX + 40, cardY + 50);

      // Verified Badge
      ctx.textAlign = 'right';
      ctx.fillStyle = '#4ade80'; // green-400
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText('✓ Verified Profile', cardX + cardW - 40, cardY + 50);

      // 4. Content - Two Column Layout
      const contentY = cardY + 100;

      // Left Column: Avatar & Rank
      const avatarX = cardX + 80;
      const avatarY = contentY + 60;
      const avatarSize = 120;

      // Glowing Ring behind Avatar
      ctx.save();
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Avatar Image Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Avatar Placeholder/Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);

      // Initials
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedUser?.fullName?.charAt(0) || 'U', avatarX, avatarY);
      ctx.restore();

      // Rank Badge below Avatar
      const rankY = avatarY + 80;
      const rankText = `Global Rank #${selectedRank}`;
      ctx.font = 'bold 14px Inter, sans-serif';
      const rankWidth = ctx.measureText(rankText).width + 30;

      ctx.fillStyle = 'rgba(250, 204, 21, 0.1)'; // yellow-400/10
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)'; // yellow-400/50
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(avatarX - rankWidth / 2, rankY - 15, rankWidth, 30, 15);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15'; // yellow-400
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rankText, avatarX, rankY);

      // Right Column: Info & Stats
      const infoX = cardX + 180;
      const infoY = contentY + 20;

      // Name
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText(selectedUser?.fullName || 'Anonymous', infoX, infoY);

      // Title
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Interview Candidate', infoX, infoY + 30);

      // Stats Row
      const statsY = infoY + 80;
      const statGap = 120;

      // Stat 1: Score
      ctx.fillStyle = '#818cf8'; // indigo-400
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('SCORE', infoX, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText(`${selectedUser?.bayesianScore.toFixed(0)}%`, infoX, statsY + 35);

      // Stat 2: Interviews
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('INTERVIEWS', infoX + statGap, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText(`${selectedUser?.interviewCount}`, infoX + statGap, statsY + 35);

      // Stat 3: Skills
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('SKILLS', infoX + statGap * 2, statsY);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText('3', infoX + statGap * 2, statsY + 35);

      // 5. Recommendation Banner
      const bannerY = cardY + cardH - 100;
      const bannerX = cardX + 30;
      const bannerW = cardW - 60;

      // Gradient Banner
      const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY);
      bannerGrad.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // emerald-500/20
      bannerGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

      ctx.fillStyle = bannerGrad;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, 60, 16);
      ctx.fill();
      ctx.stroke();

      // Banner Content
      ctx.fillStyle = '#34d399'; // emerald-400
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Hire Recommendation:', bannerX + 25, bannerY + 30);

      ctx.fillStyle = '#ffffff';
      ctx.fillText('Highly Recommended', bannerX + 230, bannerY + 30);

      // 6. Footer
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Verified by ArjunaAI Platform', width / 2, height - 30);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arjuna-profile-${selectedUser?.fullName?.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Premium card downloaded.",
        });
      });
    } catch (error) {
      console.error('Error downloading card:', error);
      toast({
        title: "Error",
        description: "Failed to download card.",
        variant: "destructive",
      });
    }
  };



  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/p/${selectedUser?.userId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    });
  };



  const TopPlayerCard = ({ user: player, rank, className }: { user: LeaderboardUser; rank: number; className?: string }) => {
    const isFirst = rank === 1;
    const isMe = player.userId === user?.id;
    const displayName = isMe
      ? (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || player.fullName || "Unknown Candidate")
      : (player.fullName || "Unknown Candidate");

    return (
      <div className={cn(
        "relative flex flex-col items-center transition-all duration-300",
        isFirst ? "scale-100 lg:scale-110 z-20 mb-8" : "scale-95 lg:scale-100 z-10 opacity-70 hover:opacity-100 hover:scale-105",
        className
      )}>
        {/* Visual Rank Indicator */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
          <div className={cn(
            "flex items-center justify-center h-8 px-4 rounded-full text-xs font-bold shadow-sm border bg-card",
            rank === 1 ? "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400" :
              rank === 2 ? "text-slate-600 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400" :
                "text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-500"
          )}>
            #{rank}
          </div>
        </div>

        <Card className={cn(
          "w-full overflow-hidden border transition-all duration-300 bg-card",
          rank === 1 ? "border-yellow-400/50 shadow-lg shadow-yellow-500/5 ring-1 ring-yellow-500/20" : "border-border shadow-sm"
        )}>
          {rank === 1 && <div className="h-1 w-full bg-yellow-500" />}

          <CardContent className="p-6 flex flex-col items-center pt-8">
            {/* Avatar Cluster */}
            <div className="relative mb-4">
              <div className={cn(
                "w-20 h-20 rounded-full p-1 border-2 relative bg-background",
                rank === 1 ? "border-yellow-500" : "border-muted/40"
              )}>
                <Avatar className="w-full h-full rounded-full">
                  <AvatarImage
                    src={getAvatarUrl(player.avatarUrl, player.userId, 'avataaars', player.oauthPicture, player.gender)}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl font-bold bg-muted/50">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isFirst && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Intel Display */}
            <div className="text-center space-y-1 w-full mb-5">
              <h3 className="text-foreground font-bold text-base truncate w-full px-2">
                {displayName}
              </h3>
              <div className={cn(
                "inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                rank === 1 ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" : "bg-muted text-muted-foreground"
              )}>
                {rank === 1 ? "Market Leader" : rank === 2 ? "Runner Up" : "Top Performer"}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Score</p>
                <div className="flex items-center justify-center gap-1">
                  <p className={cn("text-lg font-bold tracking-tight", rank === 1 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground")}>
                    {player.bayesianScore.toFixed(0)}
                  </p>
                  <span className="text-xs text-muted-foreground font-medium">%</span>
                </div>
              </div>
              <div className="text-center border-l border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Interviews</p>
                <p className="text-lg font-bold tracking-tight text-foreground">{player.interviewCount}</p>
              </div>
            </div>

            {/* Action Module */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(player, rank)}
              className="w-full mt-4 h-9 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
            >
              <Users className="h-3.5 w-3.5 mr-2" />
              View Profile
            </Button>
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
              <Card className="flex flex-row items-center gap-6 p-4 sm:p-5 border-primary/20 bg-primary/5 shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Rank</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">#{userRank}</span>
                    <span className="text-xs text-muted-foreground">/{users.length}</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{userScore}</span>
                    <span className="text-xs text-muted-foreground">%</span>
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
            {/* Podium Section */}
            <div className="w-full mt-4 mb-12">
              <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-8 pb-4">
                {/* Mobile: Stacked */}
                <div className="w-full md:hidden space-y-6">
                  <TopPlayerCard user={users[0]} rank={1} className="w-full max-w-[280px] mx-auto" />
                  <div className="flex gap-4 px-2">
                    {users[1] && <TopPlayerCard user={users[1]} rank={2} className="flex-1" />}
                    {users[2] && <TopPlayerCard user={users[2]} rank={3} className="flex-1" />}
                  </div>
                </div>

                {/* Desktop: 2 - 1 - 3 Layout */}
                <div className="hidden md:flex flex-row items-end justify-center gap-6 w-full">
                  {users[1] && <TopPlayerCard user={users[1]} rank={2} className="w-[240px]" />}
                  <TopPlayerCard user={users[0]} rank={1} className="w-[260px]" />
                  {users[2] && <TopPlayerCard user={users[2]} rank={3} className="w-[240px]" />}
                </div>
              </div>
            </div>

            {/* Filters & Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border rounded-lg p-1.5 mb-6">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidate..."
                  className="pl-9 bg-transparent border-none shadow-none focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="h-6 w-px bg-border/60 hidden sm:block" />
                <Select>
                  <SelectTrigger className="w-full sm:w-[180px] border-none shadow-none bg-transparent">
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
            <Card className="border shadow-sm overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[80px] text-center font-bold text-xs uppercase text-muted-foreground">Rank</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">Candidate</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase text-muted-foreground">Score</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase text-muted-foreground">Interviews</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-xs uppercase text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((leaderboardUser) => {
                    const actualRank = users.findIndex(u => u.userId === leaderboardUser.userId) + 1;
                    const isTop3 = actualRank <= 3;
                    const isCurrentUser = leaderboardUser.userId === user?.id;
                    const displayName = isCurrentUser
                      ? (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || leaderboardUser.fullName || "Unknown Candidate")
                      : (leaderboardUser.fullName || "Unknown Candidate");

                    return (
                      <TableRow
                        key={leaderboardUser.userId}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isCurrentUser && "bg-muted/30 hover:bg-muted/40"
                        )}
                      >
                        <TableCell className="text-center py-4">
                          <div className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
                            actualRank === 1 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                              actualRank === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                                actualRank === 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500" :
                                  "text-muted-foreground bg-muted/50"
                          )}>
                            {actualRank}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarImage src={getAvatarUrl(leaderboardUser.avatarUrl, leaderboardUser.userId, 'avataaars', leaderboardUser.oauthPicture, leaderboardUser.gender)} />
                              <AvatarFallback className="text-xs">{displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={cn("text-sm font-bold", isCurrentUser ? "text-foreground" : "text-foreground/90")}>
                                {displayName} {isCurrentUser && "(You)"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {leaderboardUser.userId.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="font-bold text-foreground">{leaderboardUser.bayesianScore.toFixed(0)}%</div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="text-sm text-foreground">
                            {leaderboardUser.interviewCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          {isTop3 ? (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Top 3
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleShare(leaderboardUser, actualRank)}
                          >
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No matches for &quot;{searchQuery}&quot;
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Footer Info */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Ranking System</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Scores are calculated using a Bayesian average that balances your raw interview performance with your consistency over time (logarithmic scale).
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Pro Tip</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    &quot;High-caliber performance in fewer sessions outweighs high attrition rates. Focus on quality.&quot;
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Share Modal */}
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-slate-950 border-white/10">
            <DialogHeader className="p-6 pb-2 sr-only">
              <DialogTitle>Share Interview Profile</DialogTitle>
              <DialogDescription>
                Download or share this professional card showcasing interview achievements.
              </DialogDescription>
            </DialogHeader>

            <div id="share-card" className="relative w-full h-auto min-h-[600px] sm:min-h-0 sm:aspect-[1.4/1] bg-[#020617] overflow-hidden flex flex-col justify-between p-6 sm:p-10">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

              {/* Card Header: Platform Branding */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 ring-1 ring-white/20">
                    <span className="text-white font-extrabold text-xl sm:text-2xl">A</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-none mb-1">
                      ArjunaAI
                    </h2>
                    <p className="text-[10px] sm:text-xs font-medium text-indigo-300/60 tracking-widest uppercase">Interview AI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">Verified Profile</span>
                </div>
              </div>

              {/* Profile Main Content */}
              <div className="relative z-10 my-6">
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 sm:gap-10 items-center">
                  {/* Left Column: Avatar & Rank */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      {/* Animated Glow Rings */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60 blur-md group-hover:opacity-100 transition duration-1000"></div>
                      <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl"></div>

                      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-slate-900 overflow-hidden shadow-2xl bg-slate-800">
                        <Avatar className="h-full w-full">
                          <AvatarImage
                            src={getAvatarUrl(
                              selectedUser?.avatarUrl || null,
                              selectedUser?.userId || selectedUser?.fullName || 'user',
                              'avataaars',
                              selectedUser?.oauthPicture
                            )}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-4xl sm:text-5xl font-black bg-slate-800 text-slate-400">
                            {selectedUser?.fullName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Rank Overlay Badge */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[10px] sm:text-xs font-black px-4 py-1 rounded-full shadow-lg border border-white/20 whitespace-nowrap uppercase tracking-tighter">
                        Rank #{selectedRank}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Name & Stats */}
                  <div className="text-center md:text-left">
                    <div className="mb-6">
                      <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 leading-tight tracking-tighter drop-shadow-sm">
                        {selectedUser?.fullName || "Anonymous"}
                      </h1>
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border-indigo-500/20 text-[10px] uppercase font-bold tracking-widest">
                          Top Talent
                        </Badge>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] uppercase font-bold tracking-widest">
                          Interview Candidate
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 shadow-inner">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mb-1">Score</p>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-white leading-none">
                            {selectedUser?.bayesianScore.toFixed(0)}
                          </span>
                          <span className="text-sm sm:text-lg text-slate-500 font-bold">%</span>
                        </div>
                      </div>
                      <div className="border-x border-white/10 px-3 sm:px-6">
                        <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mb-1">Interviews</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white leading-none">
                          {selectedUser?.interviewCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mb-1">Skills</p>
                        <p className="text-2xl sm:text-3xl font-black text-white leading-none">3</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Footer & Recommendation */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/20 to-transparent px-4 py-2 rounded-xl border-l-4 border-emerald-500">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Recommendation</span>
                    <span className="text-sm sm:text-base font-bold text-white">
                      {selectedUser?.bayesianScore && selectedUser.bayesianScore >= 80
                        ? "🚀 Highly Recommended"
                        : selectedUser?.bayesianScore && selectedUser.bayesianScore >= 60
                          ? "✅ Recommended"
                          : "🕒 Under Review"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end text-[10px] font-medium text-slate-500">
                  <span>ArjunaAi Professional Interview Profile</span>
                  <span className="text-slate-600">ID: {selectedUser?.userId.slice(0, 12).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 bg-slate-900 border-t border-white/5">
              <Button
                onClick={handleDownloadCard}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/20 font-bold h-12 rounded-xl border border-white/10"
              >
                <Download className="h-5 w-5 mr-3" />
                Get Premium Card
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full border-white/10 bg-slate-800/50 hover:bg-slate-800 text-slate-200 h-12 rounded-xl font-bold"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-3 text-emerald-500" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-3" />
                    Share Profile Link
                  </>
                )}
              </Button>
            </div>

            {/* View Full Profile on ArjunaAi Button (Outside the share-card div so it's not in the export) */}
            <div className="px-6 pb-6 bg-slate-900 border-t border-white/5">
              <button
                className="w-full bg-white hover:bg-slate-200 text-black font-black py-4 rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                onClick={() => window.open(`/p/${selectedUser?.userId}`, '_blank')}
              >
                View Professional Profile Page
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </DashboardLayout >
  );
};

export default Leaderboard;
