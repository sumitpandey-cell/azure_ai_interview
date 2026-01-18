"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Medal, Lock, Trophy, Award, Zap, Target, Star, TrendingUp, Info, Share2 } from "lucide-react";
import { badgeService } from "@/services/badge.service";
import type { Badge as BadgeType } from "@/services/badge.service";
import { useAuth } from "@/contexts/AuthContext";
import { BADGE_DEFINITIONS, getRarityColor, getRarityBorderColor, getRarityGlowColor } from "@/config/badges";
import { UserBadgeData } from "@/types/badge-types";
import type { BadgeCategory } from "@/types/badge-types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { triggerSuccessConfetti } from "@/lib/confetti-utils";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<BadgeCategory, string> = {
  streak: "🔥",
  performance: "📈",
  milestone: "🏆",
  communication: "🗣️",
  skill: "🧠",
  leaderboard: "🥇",
  speed: "⚡",
  diversity: "🌐",
  special: "✨",
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  streak: "Streak",
  performance: "Performance",
  milestone: "Milestone",
  communication: "Communication",
  skill: "Skill Mastery",
  leaderboard: "Leaderboard",
  speed: "Speed",
  diversity: "Diversity",
  special: "Special",
};

export default function Badges() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [userBadgesData, setUserBadgesData] = useState<any[]>([]);
  const [userData, setUserData] = useState<UserBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "all">("all");

  useEffect(() => {
    const loadBadges = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Load all available badges from DB
        const badges = await badgeService.getBadges();
        setAllBadges(badges);

        // Load user's earned badges (using slugs for easier lookup)
        const userBadges = await badgeService.getUserBadges(user.id);
        setUserBadgesData(userBadges);
        const earnedSlugs = new Set(userBadges.map((ub: any) => ub.badge.slug));
        setEarnedBadges(earnedSlugs);

        // Load real user stats for progress
        const stats = await badgeService.getUserBadgeData(user.id);
        setUserData(stats);

        // Trigger catch-up awarding for any badges that reached 100%
        const newlyAwarded = await badgeService.checkAndAwardBadges(user.id);
        if (newlyAwarded.length > 0) {
          // Trigger celebration!
          triggerSuccessConfetti();

          // If new badges were awarded, update the earned set
          newlyAwarded.forEach(b => {
            earnedSlugs.add(b.slug);
            toast.success(`Achievement Unlocked!`, {
              description: `You've earned the ${b.name} badge!`,
              icon: b.icon_name,
            });
          });
          setEarnedBadges(new Set(earnedSlugs));
        }
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [user]);

  const getBadgeIcon = (iconName: string) => {
    return iconName;
  };

  const getBadgeProgress = (badgeId: string) => {
    const definition = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!definition?.getProgress || !userData) return null;

    return definition.getProgress(userData);
  };

  const handleShareBadge = (badgeName: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Achievement Unlocked!",
        text: `I just earned the ${badgeName} badge on Arjuna AI! Check it out!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`I just earned the ${badgeName} badge on Arjuna AI!`);
      toast.success("Link copied to clipboard!");
    }
  };

  const earnedCount = earnedBadges.size;
  const totalCount = BADGE_DEFINITIONS.length;
  const progressPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const badgeScore = BADGE_DEFINITIONS.reduce((score, badge) => {
    if (!earnedBadges.has(badge.id)) return score;
    const rarityPoints = {
      bronze: 10,
      silver: 25,
      gold: 50,
      platinum: 100,
      special: 75,
    };
    return score + (rarityPoints[badge.rarity] || 0);
  }, 0);

  const latestUserBadge = userBadgesData[0];
  const latestBadge = latestUserBadge ? BADGE_DEFINITIONS.find(b => b.id === latestUserBadge.badge.slug) : null;

  const filteredBadges = selectedCategory === "all"
    ? BADGE_DEFINITIONS
    : BADGE_DEFINITIONS.filter((b) => b.category === selectedCategory);

  const categories: (BadgeCategory | "all")[] = ["all", ...Array.from(new Set(BADGE_DEFINITIONS.map((b) => b.category)))];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-10 pb-16 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted rounded-full" />
            <div className="h-12 w-64 bg-muted rounded-2xl" />
            <div className="h-6 w-96 bg-muted rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-2xl" />
            ))}
          </div>
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 w-32 bg-muted rounded-2xl shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:pt-0">

        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Achievements</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">Track your progress and milestones as you master technical interviews.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Badges Earned", value: earnedCount, total: totalCount, unit: "", icon: Medal, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Total Score", value: badgeScore, unit: "", icon: Star, color: "text-primary", bg: "bg-primary/10" },
            { label: "Latest Badge", value: latestBadge?.name || "-", unit: "", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Completion", value: `${progressPercentage}%`, unit: "", icon: Target, color: "text-orange-500", bg: "bg-orange-500/10" }
          ].map((stat, i) => (
            <div key={i} className="bg-card/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20 sm:h-24">
              <div className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 opacity-[0.08] group-hover:opacity-15 transition-opacity pointer-events-none">
                <stat.icon className={cn("h-16 w-16 sm:h-20 sm:w-20", stat.color)} />
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10 truncate">{stat.label}</span>
              <div className="flex items-baseline gap-0.5 relative z-10">
                <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tighter">
                  {typeof stat.value === 'number' ? stat.value : stat.value}
                </span>
                {stat.total && <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/60">/{stat.total}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Global Progress */}
        <Card className="p-4 sm:p-5 border-border/50 shadow-sm bg-card/60 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">Overall Progress</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">You have unlocked {earnedCount} out of {totalCount} available badges.</p>
            </div>
            <span className="text-lg sm:text-xl font-black text-primary tabular-nums">{progressPercentage}%</span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
        </Card>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors border whitespace-nowrap shrink-0",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <span className="mr-1.5">{cat === "all" ? "🌐" : CATEGORY_ICONS[cat]}</span>
              {cat === "all" ? "All Badges" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBadges.map((badge, index) => {
              const isEarned = earnedBadges.has(badge.id);
              const progress = getBadgeProgress(badge.id);
              const progressPercent = progress ? Math.round((progress.current / progress.max) * 100) : 0;

              return (
                <motion.div
                  key={badge.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={cn(
                    "h-full overflow-hidden transition-all duration-300 border",
                    isEarned
                      ? "border-primary/20 bg-primary/5 shadow-sm hover:border-primary/40"
                      : "border-border bg-card/50 opacity-80"
                  )}>
                    <CardContent className="p-5 flex flex-col items-center text-center h-full relative">
                      {isEarned && (
                        <div className="absolute top-3 right-3 text-primary">
                          <Award className="h-4 w-4" />
                        </div>
                      )}

                      <div className={cn(
                        "mb-4 text-4xl p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                        isEarned ? "bg-background shadow-sm border border-border" : "grayscale opacity-50"
                      )}>
                        {badge.icon}
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className={cn("font-bold text-base", isEarned ? "text-foreground" : "text-muted-foreground")}>
                          {badge.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {badge.description}
                        </p>
                      </div>

                      <div className="mt-auto w-full pt-2">
                        {!isEarned && progress ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground font-medium">
                              <span>Progress</span>
                              <span>{progress.current}/{progress.max}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : isEarned ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-500/20">
                            <TrendingUp className="h-3 w-3" />
                            Earned
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wide">
                            <Lock className="h-3 w-3" />
                            Locked
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
