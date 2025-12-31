"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Medal, Lock, Trophy, Award, Zap, Target } from "lucide-react";
import { badgeService } from "@/services/badge.service";
import type { Badge as BadgeType } from "@/services/badge.service";
import { useAuth } from "@/contexts/AuthContext";
import { BADGE_DEFINITIONS, getRarityColor, getRarityBorderColor, getRarityGlowColor } from "@/config/badges";
import { UserBadgeData } from "@/types/badge-types";
import type { BadgeCategory } from "@/types/badge-types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { triggerSuccessConfetti } from "@/lib/confetti-utils";

const CATEGORY_ICONS: Record<BadgeCategory, any> = {
  streak: "🔥",
  performance: "⭐",
  milestone: "🎯",
  communication: "💬",
  skill: "🎓",
  leaderboard: "🏆",
  speed: "⚡",
  diversity: "🎭",
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 pb-8">
          {/* Header Skeleton */}
          <div>
            <div className="h-7 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-none shadow-sm p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </Card>
            ))}
          </div>

          {/* Progress Bar Skeleton */}
          <Card className="border-none shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                <div className="h-3 w-40 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-6 w-12 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="w-full bg-muted rounded-full h-2 animate-pulse" />
          </Card>

          {/* Category Filter Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>

          {/* Badges Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="border-none shadow-md relative overflow-hidden">
                <div className="p-3">
                  {/* Header */}
                  <div className="mb-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  </div>

                  {/* Icon */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                  </div>

                  {/* Requirement */}
                  <div className="h-3 w-full bg-muted rounded animate-pulse mb-2" />

                  {/* Rarity Badge */}
                  <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const earnedCount = earnedBadges.size;
  const totalCount = BADGE_DEFINITIONS.length;
  const progressPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Calculate badge score (weighted by rarity)
  const badgeScore = BADGE_DEFINITIONS.reduce((score, badge) => {
    // Standardizing on badge.id (slug) for consistency
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

  // Get latest earned badge (true latest by date)
  const latestUserBadge = userBadgesData[0]; // Already sorted by awarded_at DESC in service
  const latestBadge = latestUserBadge ? BADGE_DEFINITIONS.find(b => b.id === latestUserBadge.badge.slug) : null;

  // Filter badges by category
  const filteredBadges = selectedCategory === "all"
    ? BADGE_DEFINITIONS
    : BADGE_DEFINITIONS.filter((b) => b.category === selectedCategory);

  // Get unique categories
  const categories: (BadgeCategory | "all")[] = ["all", ...Array.from(new Set(BADGE_DEFINITIONS.map((b) => b.category)))];

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div>
          <h2 className="mb-1 text-xl sm:text-2xl font-bold text-foreground">My Badges</h2>
          <p className="text-muted-foreground text-xs">Track your achievements and milestones.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Badges Earned */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">Total Badges Earned</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{earnedCount}</div>
          </Card>

          {/* Badge Score */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">Badge Score</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{badgeScore}</div>
          </Card>

          {/* Latest Badge */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Medal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Latest Badge</span>
            </div>
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
              {latestBadge ? `${latestBadge.icon} ${latestBadge.name}` : "None yet"}
            </div>
          </Card>

          {/* Completion */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">Completion</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{progressPercentage}%</div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="border-none shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Your Progress</h3>
              <p className="text-xs text-muted-foreground">
                {earnedCount} of {totalCount} badges earned
              </p>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {progressPercentage}%
            </Badge>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </Card>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card hover:bg-accent text-muted-foreground border border-border"
                }`}
            >
              {category === "all" ? "🌟 All" : `${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}`}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-sm bg-card p-12 text-center">
              <Medal className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Badges Available</h3>
              <p className="text-muted-foreground mb-6">
                Badges will appear here once they are added to the system.
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredBadges.map((badge, index) => {
                const isEarned = earnedBadges.has(badge.id);
                const progress = getBadgeProgress(badge.id);
                const progressPercent = progress ? Math.round((progress.current / progress.max) * 100) : 0;

                // Industry level visual effects
                const rarityShadow = {
                  bronze: "hover:shadow-orange-500/20",
                  silver: "hover:shadow-slate-400/20",
                  gold: "hover:shadow-yellow-500/30",
                  platinum: "hover:shadow-indigo-500/40",
                  special: "hover:shadow-purple-500/30",
                };

                return (
                  <motion.div
                    key={badge.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-none shadow-md transition-all duration-300 hover:scale-[1.03] relative overflow-hidden h-full flex flex-col ${rarityShadow[badge.rarity]} ${isEarned
                        ? `bg-gradient-to-br ${getRarityColor(badge.rarity)} ${getRarityGlowColor(badge.rarity)} shadow-xl ring-1 ring-white/20`
                        : "bg-card opacity-80 hover:opacity-100 grayscale-[0.5] hover:grayscale-0 border border-border/50"
                        }`}
                    >
                      {/* Rarity Border */}
                      {isEarned && (
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getRarityColor(badge.rarity)} brightness-125`} />
                      )}

                      <div className="p-3 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4 className={`text-sm font-bold ${isEarned ? "text-white" : "text-foreground"}`}>
                                {badge.name}
                              </h4>
                              {!isEarned && <Lock className="h-3 w-3 text-muted-foreground/60" />}
                            </div>
                            <p className={`text-[10px] leading-tight ${isEarned ? "text-white/80" : "text-muted-foreground"}`}>
                              {badge.description}
                            </p>
                          </div>
                        </div>

                        {/* Icon Container */}
                        <div className="flex items-center justify-between mb-3 mt-auto">
                          <div className={`text-4xl filter drop-shadow-sm transition-transform duration-500 ${isEarned ? "hover:rotate-12 scale-110" : "grayscale opacity-40"}`}>
                            {getBadgeIcon(badge.icon)}
                          </div>
                          {isEarned ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleShareBadge(badge.name)}
                                className="text-[10px] text-white/40 hover:text-white/90 transition-colors underline decoration-white/20"
                              >
                                Share
                              </button>
                              <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-[9px] h-5">
                                Unlocked
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[9px] h-5 opacity-60">
                              Locked
                            </Badge>
                          )}
                        </div>

                        <div className="mt-auto space-y-2">
                          {/* Requirement Label */}
                          <div className={`text-[9px] font-medium uppercase tracking-wider ${isEarned ? "text-white/60" : "text-muted-foreground/70"}`}>
                            {badge.requirement}
                          </div>

                          {/* Progress Bar (for unearned badges with progress) */}
                          {!isEarned && progress && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-bold text-foreground">
                                  {progress.current}/{progress.max}
                                </span>
                              </div>
                              <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden border border-border/50">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`bg-gradient-to-r ${getRarityColor(badge.rarity)} h-full shadow-[0_0_5px_rgba(0,0,0,0.1)]`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Rarity Label */}
                          <div className="pt-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize px-2 py-0 border-none rounded-sm ${isEarned
                                ? "bg-white/10 text-white"
                                : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
