'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2, Search, TrendingUp, Users, Award, Settings as SettingsIcon, LogOut, Share2, Download, Copy, Check, Crown, ArrowRight } from "lucide-react";
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
        "relative flex flex-col items-center transition-all duration-500",
        isFirst ? "scale-100 sm:scale-110 z-20 mb-4 sm:mb-8" : "scale-95 z-10 hover:scale-100",
        className
      )}>
        {/* Crown for 1st Place - Moved inside to center relative to card */}
        {isFirst && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-bounce duration-1000">
            <Crown className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </div>
        )}

        <div className={cn(
          "relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border backdrop-blur-md transition-all duration-300",
          rank === 1 ? "bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-xl shadow-yellow-500/10 dark:from-yellow-500/10 dark:to-black/60 dark:border-yellow-500/50 dark:shadow-[0_0_30px_rgba(234,179,8,0.2)]" :
            rank === 2 ? "bg-gradient-to-b from-slate-50 to-white border-slate-200 shadow-xl shadow-slate-500/10 dark:from-slate-400/10 dark:to-black/60 dark:border-slate-400/50 dark:shadow-[0_0_30px_rgba(148,163,184,0.2)]" :
              "bg-gradient-to-b from-orange-50 to-white border-orange-200 shadow-xl shadow-orange-500/10 dark:from-amber-700/10 dark:to-black/60 dark:border-amber-700/50 dark:shadow-[0_0_30px_rgba(180,83,9,0.2)]"
        )}>
          {/* Glow Effect */}
          <div className={cn(
            "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
            rank === 1 ? "from-transparent via-yellow-500 to-transparent" :
              rank === 2 ? "from-transparent via-slate-400 to-transparent" :
                "from-transparent via-amber-700 to-transparent"
          )} />

          <div className="p-3 sm:p-6 flex flex-col items-center pt-6 sm:pt-8">
            {/* Rank Badge */}
            <div className={cn(
              "absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border",
              rank === 1 ? "bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-500/20 dark:border-yellow-500 dark:text-yellow-400" :
                rank === 2 ? "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-400/20 dark:border-slate-400 dark:text-slate-300" :
                  "bg-orange-100 border-orange-200 text-orange-700 dark:bg-amber-700/20 dark:border-amber-700 dark:text-amber-500"
            )}>
              #{rank}
            </div>

            {/* Avatar Ring */}
            <div className="relative mb-1.5 sm:mb-4 mt-1 sm:mt-2">
              <div className={cn(
                "w-12 h-12 sm:w-24 sm:h-24 rounded-full p-1 border-2",
                rank === 1 ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]" :
                  rank === 2 ? "border-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.3)]" :
                    "border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.3)]"
              )}>
                <Avatar className="w-full h-full rounded-full">
                  <AvatarImage
                    src={getAvatarUrl(
                      user.avatarUrl,
                      user.userId || user.fullName || 'user',
                      'avataaars',
                      user.oauthPicture,
                      user.gender
                    )}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs sm:text-xl font-bold bg-muted">
                    {user.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isFirst && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Top 1 🔥
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="text-gray-900 dark:text-white font-bold text-xs sm:text-lg text-center mb-1 truncate w-full px-1">
              {user.fullName || "Anonymous"}
            </h3>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-1 sm:gap-4 w-full my-1.5 sm:my-4 bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg sm:rounded-xl p-1.5 sm:p-3">
              <div className="text-center border-r border-gray-200 dark:border-white/10">
                <p className="text-[7px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sessions</p>
                <p className="text-gray-900 dark:text-white font-bold text-xs sm:text-lg">{user.interviewCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</p>
                <div className={cn(
                  "font-bold text-xs sm:text-lg",
                  rank === 1 ? "text-yellow-600 dark:text-yellow-400" : "text-gray-900 dark:text-white"
                )}>
                  {user.bayesianScore.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => handleShare(user, rank)}
              className={cn(
                "w-full py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-1 sm:gap-2",
                rank === 1 ? "bg-yellow-100 border-yellow-200 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/50 dark:text-yellow-400 dark:hover:bg-yellow-500 dark:hover:text-black" :
                  "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              )}
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex flex-col items-start justify-start text-left space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Global Standings
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl">
              Compete, grow, and see where you rank among the best.
            </p>
            {!loading && users.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Total Candidates: <span className="font-semibold text-foreground">{users.length}</span>
              </p>
            )}
          </div>
          {user && users.find(u => u.userId === user.id) && (() => {
            const userRank = users.findIndex(u => u.userId === user.id) + 1;
            const userScore = users.find(u => u.userId === user.id)?.bayesianScore.toFixed(1);

            // Debug logging
            console.log('Leaderboard Debug:', {
              totalUsers: users.length,
              currentUserId: user.id,
              userRank,
              userScore,
              allUsers: users.map((u, idx) => ({
                rank: idx + 1,
                userId: u.userId,
                name: u.fullName,
                score: u.bayesianScore,
                interviews: u.interviewCount
              }))
            });

            return (
              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl px-6 py-4 shadow-lg">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Rank</p>
                  <p className="text-3xl font-black text-foreground">
                    #{userRank}
                  </p>
                </div>
                <div className="h-12 w-px bg-indigo-500/20"></div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Score</p>
                  <p className="text-3xl font-black text-foreground">
                    {userScore}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
            );
          })()}
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
            {/* Podium Section */}
            <div className="w-full mt-8">
              <div className="flex flex-row items-end justify-center gap-3 sm:gap-8 md:gap-12 h-full pb-4 px-2">
                {users[1] && <TopPlayerCard user={users[1]} rank={2} className="w-[30%] sm:w-[260px]" />}
                <TopPlayerCard user={users[0]} rank={1} className="w-[30%] sm:w-[260px]" />
                {users[2] && <TopPlayerCard user={users[2]} rank={3} className="w-[30%] sm:w-[260px]" />}
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-2 rounded-xl shadow-sm border border-border">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar px-2">
                <Select>
                  <SelectTrigger className="w-[160px] bg-muted border-none text-foreground font-medium h-9">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="frontend">Frontend Dev</SelectItem>
                    <SelectItem value="backend">Backend Dev</SelectItem>
                    <SelectItem value="fullstack">Full Stack</SelectItem>
                  </SelectContent>
                </Select>
                <button className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 whitespace-nowrap">
                  Timeframe (Monthly)
                </button>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sort by (Score-High to Low)"
                  className="pl-10 bg-muted border-none text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Full Rankings List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground px-2">All Rankings</h3>

              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                        <TableHead className="w-[80px] text-center font-semibold text-muted-foreground">Rank</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">User</TableHead>
                        <TableHead className="text-center font-semibold text-muted-foreground">Score</TableHead>
                        <TableHead className="text-center font-semibold text-muted-foreground">Interviews</TableHead>
                        <TableHead className="text-center font-semibold text-muted-foreground">Badge</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground pr-6">Action</TableHead>
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
                              "hover:bg-muted/50 transition-colors border-b border-border last:border-none",
                              isCurrentUser && "bg-indigo-50/60 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500"
                            )}
                          >
                            <TableCell className="text-center py-4">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm",
                                actualRank === 1 ? "bg-yellow-100 text-yellow-700" :
                                  actualRank === 2 ? "bg-slate-100 text-slate-700" :
                                    actualRank === 3 ? "bg-amber-100 text-amber-700" :
                                      "bg-muted text-muted-foreground"
                              )}>
                                {actualRank}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                  <AvatarImage src={getAvatarUrl(
                                    leaderboardUser.avatarUrl,
                                    leaderboardUser.userId || leaderboardUser.fullName || 'user',
                                    'avataaars',
                                    leaderboardUser.oauthPicture,
                                    leaderboardUser.gender
                                  )} />
                                  <AvatarFallback>{getInitials(leaderboardUser.fullName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground">{leaderboardUser.fullName}</span>
                                  <span className="text-xs text-muted-foreground">ID: {leaderboardUser.userId.slice(0, 8)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-foreground py-4 text-lg">
                              {leaderboardUser.bayesianScore.toFixed(0)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground py-4">
                              {leaderboardUser.interviewCount} Interviews
                            </TableCell>
                            <TableCell className="text-center py-4">
                              {isTop3 ? (
                                <Badge variant="secondary" className={cn(
                                  "mx-auto",
                                  actualRank === 1 ? "bg-yellow-100 text-yellow-700" :
                                    actualRank === 2 ? "bg-slate-100 text-slate-700" :
                                      "bg-amber-100 text-amber-700"
                                )}>
                                  Top {actualRank}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="mx-auto text-muted-foreground border-border">
                                  Mentor
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-4 pr-6">
                              <button
                                onClick={() => handleShare(leaderboardUser, actualRank)}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 ml-auto"
                              >
                                <Users className="h-4 w-4" />
                                View Profile
                              </button>
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
              </div>
            </div>
          </>
        )}

        {/* Scoring Information Footer */}
        {!loading && users.length > 0 && (
          <Card className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200/50 dark:border-indigo-800/50">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">How Rankings Are Calculated</h3>
                  <p className="text-sm text-muted-foreground">
                    Our fair ranking system rewards both performance and experience
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Formula Explanation */}
                <div className="space-y-3">
                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-indigo-200/50 dark:border-indigo-800/30">
                    <h4 className="text-sm font-semibold text-foreground mb-2">📊 Weighted Score Formula</h4>
                    <code className="text-xs bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded text-indigo-700 dark:text-indigo-300 block mb-2">
                      Score = Avg Score × (1 + log₁₀(interviews) / 10)
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Your average interview score is multiplied by an experience bonus based on the number of interviews you've completed.
                    </p>
                  </div>

                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-indigo-200/50 dark:border-indigo-800/30">
                    <h4 className="text-sm font-semibold text-foreground mb-2">🎯 Why This System?</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• <strong>Performance First:</strong> Your actual scores matter most</li>
                      <li>• <strong>Experience Bonus:</strong> More interviews = more reliable ranking</li>
                      <li>• <strong>Fair to All:</strong> New users aren't artificially boosted</li>
                      <li>• <strong>Anti-Gaming:</strong> Diminishing returns prevent spam</li>
                    </ul>
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-indigo-200/50 dark:border-indigo-800/30">
                    <h4 className="text-sm font-semibold text-foreground mb-3">💡 Example Calculations</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                        <span className="text-muted-foreground">1 interview @ 70%</span>
                        <span className="font-bold text-foreground">70.0</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                        <span className="text-muted-foreground">5 interviews @ 70%</span>
                        <span className="font-bold text-foreground">74.9</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                        <span className="text-muted-foreground">10 interviews @ 70%</span>
                        <span className="font-bold text-foreground">77.0</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                        <span className="text-muted-foreground">21 interviews @ 70%</span>
                        <span className="font-bold text-foreground">79.1</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/30">
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">✨ Pro Tip</h4>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      Focus on improving your average score! A 90% average with 5 interviews (96.3) beats a 70% average with 50 interviews (81.9).
                    </p>
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
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
