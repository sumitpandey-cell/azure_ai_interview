'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2, Search, TrendingUp, Users, Award, Settings as SettingsIcon, LogOut, Share2, Download, Copy, Check, Crown, ArrowRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
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
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, leaderboard, fetchLeaderboard, isCached } = useOptimizedQueries();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);

        // Check if we have cached data
        if (isCached.leaderboard && leaderboard.length > 0) {
          console.log('📦 Using cached leaderboard data');
          setUsers(leaderboard);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        console.log('🔄 Fetching fresh leaderboard data');
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

  const handleNativeShare = async () => {
    try {
      const shareData = {
        title: `${selectedUser?.fullName || 'Candidate'} - ArjunaAI Interview Profile`,
        text: `Check out this interview profile on ArjunaAI! Global Rank #${selectedRank} with a score of ${selectedUser?.bayesianScore.toFixed(0)}%`,
        url: `${window.location.origin}/p/${selectedUser?.userId}`,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Success",
          description: "Shared successfully!",
        });
      } else {
        // Fallback to copy link
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard!",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast({
          title: "Error",
          description: "Failed to share.",
          variant: "destructive",
        });
      }
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



  const TopPlayerCard = ({ user, rank, className }: { user: LeaderboardUser; rank: number; className?: string }) => {
    const isFirst = rank === 1;

    return (
      <div className={cn(
        "relative flex flex-col items-center transition-all duration-700",
        isFirst ? "scale-100 lg:scale-110 z-20 mb-8" : "scale-90 lg:scale-100 z-10 opacity-80 hover:opacity-100 hover:scale-105",
        className
      )}>
        {/* Visual Rank Indicator */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
          {rank === 1 ? (
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500 blur-lg opacity-50 animate-pulse" />
              <div className="relative h-12 w-12 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl border border-yellow-200/50">
                <Crown className="w-6 h-6 text-black fill-black/20" />
              </div>
            </div>
          ) : (
            <div className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm border shadow-lg backdrop-blur-md",
              rank === 2 ? "bg-slate-300 border-slate-100 text-slate-800" : "bg-amber-600 border-amber-400 text-white"
            )}>
              #{rank}
            </div>
          )}
        </div>

        <div className={cn(
          "relative w-full rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 bg-card/40 backdrop-blur-xl group/podium",
          rank === 1 ? "border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)]" :
            rank === 2 ? "border-slate-400/30" : "border-amber-700/30"
        )}>
          {/* Animated Background Mesh */}
          <div className={cn(
            "absolute inset-0 opacity-10 pointer-events-none group-hover/podium:opacity-20 transition-opacity duration-700",
            rank === 1 ? "bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.4),transparent_70%)]" :
              rank === 2 ? "bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.4),transparent_70%)]" :
                "bg-[radial-gradient(circle_at_50%_0%,rgba(180,83,9,0.4),transparent_70%)]"
          )} />

          <div className="p-6 sm:p-8 flex flex-col items-center pt-10 sm:pt-12 relative z-10">
            {/* Avatar Cluster */}
            <div className="relative mb-6">
              <div className={cn(
                "w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1.5 border-2 relative",
                rank === 1 ? "border-yellow-500 ring-8 ring-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.4)]" :
                  rank === 2 ? "border-slate-400 ring-8 ring-slate-400/10" :
                    "border-amber-700 ring-8 ring-amber-700/10"
              )}>
                <Avatar className="w-full h-full rounded-full border-2 border-background shadow-inner">
                  <AvatarImage
                    src={getAvatarUrl(user.avatarUrl, user.userId, 'avataaars', user.oauthPicture, user.gender)}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-black bg-muted uppercase">
                    {user.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isFirst && (
                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-black border-2 border-yellow-500 rounded-xl flex items-center justify-center animate-bounce">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
              )}
            </div>

            {/* Intel Display */}
            <div className="text-center space-y-2 w-full">
              <h3 className="text-foreground font-black text-lg sm:text-xl uppercase tracking-tighter truncate w-full">
                {user.fullName || "Archive Lost"}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-slate-400" : "bg-amber-600")} />
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{rank === 1 ? "Alpha Protocol" : rank === 2 ? "Beta Sector" : "Gamma Tier"}</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-6 sm:mt-8">
              <div className="bg-background/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-border/50 text-center space-y-0.5 sm:space-y-1">
                <p className="text-[7px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Mastery</p>
                <p className={cn("text-lg sm:text-xl font-black tracking-tight", rank === 1 ? "text-yellow-500" : "text-foreground")}>
                  {user.bayesianScore.toFixed(0)}%
                </p>
              </div>
              <div className="bg-background/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-border/50 text-center space-y-0.5 sm:space-y-1">
                <p className="text-[7px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Sessions</p>
                <p className="text-lg sm:text-xl font-black tracking-tight text-foreground">{user.interviewCount}</p>
              </div>
            </div>

            {/* Action Module */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare(user, rank)}
              className={cn(
                "w-full mt-4 sm:mt-6 h-10 sm:h-11 rounded-xl bg-transparent font-black uppercase tracking-widest text-[8px] sm:text-[9px] transition-all duration-300",
                rank === 1 ? "border-yellow-500/30 text-yellow-600 hover:bg-yellow-500 hover:text-black hover:border-yellow-500" :
                  "border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              )}
            >
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
              <span className="truncate">Access Dossier</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 sm:space-y-12 pb-12 pt-10 sm:pt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
              <Trophy className="h-3 w-3" />
              Global Arena
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                Executive <span className="text-primary italic">Standings</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg font-medium mt-2 max-w-2xl leading-relaxed">
                Compete with the elite, track your trajectory, and dominate the global hierarchy.
              </p>
            </div>
            {!loading && users.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Active Protocols: <span className="text-foreground">{users.length} Candidates</span>
                </p>
              </div>
            )}
          </div>

          {user && users.find(u => u.userId === user.id) && (() => {
            const userRank = users.findIndex(u => u.userId === user.id) + 1;
            const userScore = users.find(u => u.userId === user.id)?.bayesianScore.toFixed(0);

            return (
              <div className="relative group/user-stat overflow-hidden w-full sm:w-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-3xl blur opacity-20 group-hover/user-stat:opacity-40 transition duration-500" />
                <div className="relative flex flex-row items-center justify-around sm:justify-start gap-3 sm:gap-6 bg-card/50 backdrop-blur-xl border-2 border-border/50 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-2xl">
                  <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
                    <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Current Rank</p>
                    <div className="flex items-baseline justify-center sm:justify-start gap-1">
                      <span className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground">#{userRank}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-primary">/{users.length}</span>
                    </div>
                  </div>
                  <div className="h-10 sm:h-12 w-px bg-border/50" />
                  <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
                    <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Mastery Score</p>
                    <div className="flex items-baseline justify-center sm:justify-start gap-1">
                      <span className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground">{userScore}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="hidden md:flex h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center text-primary shadow-inner">
                    <Award className="h-7 w-7" />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Decorative Mesh Background */}
          <div className="absolute -top-24 -right-24 h-96 w-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {loading ? (
          <LeaderboardPageSkeleton />
        ) : users.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg text-muted-foreground">
                No data available yet. Start interviewing to appear here!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium Section - Redesigned for Mobile */}
            <div className="w-full mt-8">
              <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-8 lg:gap-12 pb-4">
                {/* Mobile Rank 1 stays middle in desktop but shows first on stacking if not careful */}
                {/* On mobile: 1, then 2 & 3 side by side? Or stack 1, 2, 3? */}
                {/* Let's do: Rank 1 big on top, Rank 2 & 3 smaller below on mobile */}
                <div className="w-full md:hidden space-y-8">
                  <TopPlayerCard user={users[0]} rank={1} className="w-full max-w-[280px] mx-auto" />
                  <div className="flex gap-4 px-2">
                    {users[1] && <TopPlayerCard user={users[1]} rank={2} className="flex-1" />}
                    {users[2] && <TopPlayerCard user={users[2]} rank={3} className="flex-1" />}
                  </div>
                </div>

                {/* Desktop Podium: 2 - 1 - 3 */}
                <div className="hidden md:flex flex-row items-end justify-center gap-8 lg:gap-12 w-full">
                  {users[1] && <TopPlayerCard user={users[1]} rank={2} className="w-[260px]" />}
                  <TopPlayerCard user={users[0]} rank={1} className="w-[260px]" />
                  {users[2] && <TopPlayerCard user={users[2]} rank={3} className="w-[260px]" />}
                </div>
              </div>
            </div>

            {/* Filters & Search Station */}
            <Card className="border-2 border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden p-4 sm:p-6 relative">
              <div className="absolute top-0 right-0 h-full w-40 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
              <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 items-start xl:items-center relative z-10">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Candidate Lookup</span>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      placeholder="Locate Dossier..."
                      className="pl-12 h-11 sm:h-12 w-full bg-background/50 border-border/50 rounded-xl sm:rounded-2xl font-bold focus:ring-primary focus:border-primary transition-all duration-300 outline-none text-xs sm:text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Select>
                    <SelectTrigger className="h-11 sm:h-12 bg-background/50 border-border/50 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Protocol Sector" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border shadow-2xl">
                      <SelectItem value="all" className="font-bold py-3">All Sectors</SelectItem>
                      <SelectItem value="frontend" className="font-bold py-3">Frontend Architecture</SelectItem>
                      <SelectItem value="backend" className="font-bold py-3">Backend Core</SelectItem>
                      <SelectItem value="fullstack" className="font-bold py-3">Universal Stack</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-11 sm:h-12 flex-1 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[8px] sm:text-[9px] border-border/50 bg-background/50 text-muted-foreground hover:bg-muted transition-all">
                      Temporal (Monthly)
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            {/* Rankings Intel */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
                  Global <span className="text-primary italic">Hierarchy</span>
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
                  Live Sync
                </div>
              </div>

              <Card className="border-2 border-border/50 shadow-2xl bg-card/30 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-border/50 hover:bg-transparent">
                        <TableHead className="w-[60px] sm:w-[100px] py-4 sm:py-6 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rank</TableHead>
                        <TableHead className="py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Candidate Profile</TableHead>
                        <TableHead className="py-4 sm:py-6 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mastery</TableHead>
                        <TableHead className="py-4 sm:py-6 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sessions</TableHead>
                        <TableHead className="py-4 sm:py-6 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
                        <TableHead className="py-4 sm:py-6 text-right pr-6 sm:pr-12 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Protocol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((leaderboardUser, index) => {
                        const actualRank = users.findIndex(u => u.userId === leaderboardUser.userId) + 1;
                        const isTop3 = actualRank <= 3;
                        const isCurrentUser = leaderboardUser.userId === user?.id;

                        return (
                          <TableRow
                            key={leaderboardUser.userId}
                            className={cn(
                              "group/row transition-all duration-300 border-b border-border/30 hover:bg-primary/[0.02]",
                              isCurrentUser && "bg-primary/[0.05] border-l-4 border-l-primary"
                            )}
                          >
                            <TableCell className="py-6 text-center">
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center mx-auto text-sm font-black transition-transform group-hover/row:scale-110",
                                actualRank === 1 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" :
                                  actualRank === 2 ? "bg-slate-400 text-black" :
                                    actualRank === 3 ? "bg-amber-700 text-white" :
                                      "bg-muted text-muted-foreground"
                              )}>
                                {actualRank}
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 border-2 border-background shadow-xl rounded-xl">
                                    <AvatarImage src={getAvatarUrl(leaderboardUser.avatarUrl, leaderboardUser.userId, 'avataaars', leaderboardUser.oauthPicture, leaderboardUser.gender)} />
                                    <AvatarFallback className="rounded-xl font-black">{leaderboardUser.fullName?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {isTop3 && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                                      <Star className="h-2 w-2 text-white fill-current" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-sm uppercase tracking-tight text-foreground group-hover/row:text-primary transition-colors">
                                    {leaderboardUser.fullName}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    ID: {leaderboardUser.userId.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-6 text-center">
                              <div className="inline-flex flex-col">
                                <span className="text-lg font-black tracking-tighter text-foreground">
                                  {leaderboardUser.bayesianScore.toFixed(0)}
                                </span>
                                <span className="text-[8px] font-black uppercase text-primary tracking-widest opacity-70">Mastery</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-6 text-center">
                              <span className="text-sm font-bold text-muted-foreground tabular-nums">
                                {leaderboardUser.interviewCount}
                              </span>
                            </TableCell>
                            <TableCell className="py-6 text-center">
                              {isTop3 ? (
                                <Badge className={cn(
                                  "h-6 rounded-md border-none px-3 text-[8px] font-black uppercase tracking-[0.1em]",
                                  actualRank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                                    actualRank === 2 ? "bg-slate-500/20 text-slate-600" :
                                      "bg-amber-700/20 text-amber-700"
                                )}>
                                  Elite Rank
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="h-6 rounded-md px-3 text-[8px] font-black uppercase tracking-[0.1em] border-border text-muted-foreground">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-6 text-right pr-12">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleShare(leaderboardUser, actualRank)}
                                className="h-10 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-white transition-all duration-300"
                              >
                                View Dossier
                                <ArrowRight className="h-3 w-3 ml-2" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No users found matching "{searchQuery}"
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Scoring Information Footer */}
        {!loading && users.length > 0 && (
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative group/formula">
            <div className="absolute top-0 right-0 h-full w-64 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none transition-opacity group-hover/formula:opacity-20" />
            <CardContent className="p-6 sm:p-8 md:p-12">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="lg:w-1/3 space-y-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Award className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-foreground uppercase">Ranking <span className="text-primary italic">Mechanics</span></h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      Our proprietary algorithm synthesizes raw performance metrics with operational experience to generate a fair, battle-tested standing.
                    </p>
                  </div>
                </div>

                <div className="flex-1 grid sm:grid-cols-2 gap-8 w-full">
                  <div className="space-y-6">
                    <div className="bg-background/50 rounded-2xl p-6 border border-border/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Weighted Protocol</h4>
                      </div>
                      <code className="text-[10px] font-black bg-primary/10 px-3 py-2 rounded-lg text-primary block w-fit">
                        Score = Avg × (1 + log₁₀(n) / 10)
                      </code>
                      <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-wide">
                        Your performance is amplified by a reliability bonus derived from cumulative field experience.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Performance", value: "Primary" },
                        { label: "Experience", value: "Log Scale" },
                        { label: "Integrity", value: "Verified" },
                        { label: "Volatility", value: "Balanced" }
                      ].map((stat, i) => (
                        <div key={i} className="bg-background/30 rounded-xl p-3 border border-border/30">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/20 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Operational Pro-Tip</span>
                      </div>
                      <p className="text-xs font-bold text-foreground leading-relaxed italic">
                        "Precision over Persistence. High-caliber performance in fewer sessions outweighs high attrition rates."
                      </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-primary/10">
                      <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em]">Tier 1 Requirement: 90%+ Mastery</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                          Elite Talent
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
                        <p className="text-2xl sm:text-3xl font-black text-white leading-none">
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
