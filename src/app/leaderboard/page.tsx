'use client'
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Search, Users, Award, Download, Copy, Check, ArrowRight, Star } from "lucide-react";
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
      ctx.fillText(`${selectedUser?.bayesianScore.toFixed(0)} Pts`, infoX, statsY + 35);

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
    const isSecond = rank === 2;
    const isMe = player.userId === user?.id;
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 640);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1, duration: 0.5 }}
        className={cn(
          "relative flex flex-col items-center transition-all duration-500 group",
          isFirst ? "z-30 scale-100 lg:scale-110" : "z-10 scale-90 lg:scale-95",
          className
        )}
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

            {/* Profile CTA */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare(player, rank)}
              className="w-full mt-3 sm:mt-6 h-8 sm:h-11 text-[9px] sm:text-xs font-bold rounded-lg sm:rounded-xl border-dashed hover:border-solid hover:bg-primary hover:text-primary-foreground group-hover:scale-[1.02] transition-all"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{isMobile ? "View" : "Analyze Insights"}</span>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
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
                {users[1] && (
                  <TopPlayerCard
                    user={users[1]}
                    rank={2}
                    className="flex-1 min-w-0 max-w-[280px]"
                  />
                )}

                {/* 1st Place */}
                {users[0] && (
                  <TopPlayerCard
                    user={users[0]}
                    rank={1}
                    className="flex-1 min-w-0 max-w-[320px] -mb-4 sm:-mb-6"
                  />
                )}

                {/* 3rd Place */}
                {users[2] && (
                  <TopPlayerCard
                    user={users[2]}
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
                <TableHeader>
                  <TableRow className="bg-muted/30 dark:bg-muted/40 hover:bg-muted/30 border-b border-border">
                    <TableHead className="w-[80px] text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Rank</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Candidate</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Score</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Interviews</TableHead>
                    <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Status</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-[10px] uppercase text-muted-foreground tracking-widest px-4">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((leaderboardUser, index) => {
                      const actualRank = users.findIndex(u => u.userId === leaderboardUser.userId) + 1;
                      const isTop3 = actualRank <= 3;
                      const isCurrentUser = leaderboardUser.userId === user?.id;
                      const displayName = isCurrentUser
                        ? (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || leaderboardUser.fullName || "Unknown Candidate")
                        : (leaderboardUser.fullName || "Unknown Candidate");

                      return (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          key={leaderboardUser.userId}
                          className={cn(
                            "cursor-pointer transition-colors border-b border-border/10 last:border-0 group",
                            isCurrentUser ? "bg-primary/[0.05] dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20" : "hover:bg-muted/30"
                          )}
                          onClick={() => handleShare(leaderboardUser, actualRank)}
                        >
                          <TableCell className="text-center py-5">
                            <div className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black shadow-inner transition-transform group-hover:scale-110",
                              actualRank === 1 ? "bg-yellow-500 text-yellow-950 shadow-yellow-500/20" :
                                actualRank === 2 ? "bg-slate-300 text-slate-900 shadow-slate-300/20" :
                                  actualRank === 3 ? "bg-amber-600 text-amber-50 shadow-amber-600/20" :
                                    "text-muted-foreground bg-muted/20"
                            )}>
                              {actualRank}
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-xl">
                                  <AvatarImage src={getAvatarUrl(leaderboardUser.avatarUrl, leaderboardUser.userId, 'avataaars', leaderboardUser.oauthPicture, leaderboardUser.gender)} />
                                  <AvatarFallback className="font-bold">{displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {isCurrentUser && (
                                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                                )}
                              </div>
                              <div>
                                <p className={cn("text-sm font-black tracking-tight", isCurrentUser ? "text-primary" : "text-foreground")}>
                                  {displayName}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                  {leaderboardUser.userId.slice(0, 8)} • Verified
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-5">
                            <div className="flex flex-col items-center">
                              <span className="font-black text-foreground text-sm">{leaderboardUser.bayesianScore.toFixed(0)} pts</span>
                              <div className="h-1 w-12 bg-muted/30 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${leaderboardUser.bayesianScore}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-5">
                            <span className="text-sm font-bold text-foreground/80 bg-muted/20 px-3 py-1 rounded-lg">
                              {leaderboardUser.interviewCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-5">
                            {isTop3 ? (
                              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-[9px] font-black tracking-widest uppercase px-2 py-0.5 shadow-lg shadow-indigo-500/20">
                                Legends
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-border/50">
                                Candidate
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-5 pr-6">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground group-hover:translate-x-1 transition-all"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
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
                          <span className="text-sm sm:text-lg text-slate-500 font-bold">pts</span>
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
