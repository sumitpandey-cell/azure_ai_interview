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
      <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 sm:pt-0">
        {/* Header Section */}
        <div className="relative mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm animate-in fade-in slide-in-from-left duration-1000">
                <Medal className="h-3.5 w-3.5" />
                Operational Achievements
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-[1.1]">
                  Arjuna <span className="text-primary italic">Distinctions</span>
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                  Every mission is a diagnostic vector for mastery. Monitor your evolution through specialized protocol badges.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 backdrop-blur-xl">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80">Sector Evolution Active</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4 lg:pb-2">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-3xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {/* Intelligence Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {[
            { label: "Deployments Won", value: earnedCount, total: totalCount, icon: Trophy, color: "text-blue-500", progress: (earnedCount / totalCount) * 100 },
            { label: "Mastery Index", value: badgeScore, sub: "Analytical Points", icon: Award, color: "text-purple-500", progress: 100 },
            { label: "Last Transmission", value: latestBadge?.name || "Awaiting Data", sub: latestBadge ? "Protocol Verified" : "No Records", icon: Zap, color: "text-amber-500", progress: 100 },
            { label: "Sync Status", value: `${progressPercentage}%`, sub: "Global Calibration", icon: Target, color: "text-emerald-500", progress: progressPercentage }
          ].map((stat, i) => (
            <Card key={i} className="border border-border/50 shadow-3xl transition-all duration-700 group/stat relative overflow-hidden rounded-2xl p-3 sm:p-4 bg-card hover:bg-muted/10 hover:border-border">
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover/stat:opacity-10 transition-all duration-1000 group-hover/stat:scale-125 group-hover/stat:-rotate-12 pointer-events-none">
                <stat.icon className={cn("h-12 w-12", stat.color)} />
              </div>

              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className={cn("h-7 w-7 rounded-xl bg-muted/50 border border-border flex items-center justify-center shadow-lg transition-transform duration-500 group-hover/stat:scale-110", stat.color)}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{stat.label}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black tracking-tighter text-foreground uppercase truncate block">
                      {stat.value}
                    </span>
                    {stat.total && <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest">/ {stat.total}</span>}
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] leading-none">{stat.sub}</span>
                </div>

                <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20 p-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.progress}%` }}
                    transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                      stat.color === "text-blue-500" ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" :
                        stat.color === "text-purple-500" ? "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" :
                          stat.color === "text-amber-500" ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" :
                            "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    )}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Progress Trajectory */}
        <Card className="border border-border/50 shadow-3xl bg-card rounded-2xl overflow-hidden p-3 sm:p-4 relative group/progress">
          <div className="absolute inset-0 dark:bg-grid-white/[0.02] bg-grid-black/[0.02] pointer-events-none" />
          <div className="absolute top-0 right-0 h-full w-96 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-3 text-center md:text-left">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase leading-none">Global <span className="text-primary italic">Trajectory</span></h3>
              <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
                {earnedCount} of {totalCount} Neural Sectors Optimized
              </p>
            </div>

            <div className="flex-1 w-full max-w-2xl space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Calibration Depth</span>
                <span className="text-base sm:text-lg font-black text-foreground tabular-nums">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden p-0.5 border border-border/50 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="bg-gradient-to-r from-primary via-accent to-primary h-full rounded-full shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                />
              </div>
            </div>

            <div className="shrink-0 hidden lg:block">
              <div className="h-20 w-20 rounded-3xl bg-muted/50 border border-border/50 flex items-center justify-center text-primary shadow-2xl relative group-hover/progress:scale-110 transition-all duration-700">
                <Target className="h-10 w-10 group-hover:rotate-90 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </Card>

        {/* Operational Filters */}
        <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase">
                Distinction <span className="text-primary italic">Sectors</span>
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">
              Operational Status: <span className="text-primary">Nominal</span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 border flex items-center gap-2.5 relative overflow-hidden shrink-0",
                  selectedCategory === category
                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]"
                    : "bg-muted/50 border-border text-muted-foreground/60 hover:border-primary/30 hover:bg-muted/80"
                )}
              >
                <span className="text-base relative z-10">{category === "all" ? "🌐" : CATEGORY_ICONS[category]}</span>
                <span className="relative z-10">{category === "all" ? "All" : CATEGORY_LABELS[category]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Distinction Grid */}
        {filteredBadges.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-4 border-dashed border-border bg-muted/20 p-24 text-center rounded-[4rem] backdrop-blur-3xl">
              <div className="h-32 w-32 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-8 shadow-3xl">
                <Medal className="h-16 w-16 text-muted-foreground/20" />
              </div>
              <h3 className="text-3xl font-black mb-3 text-foreground uppercase tracking-tight">Intelligence Void</h3>
              <p className="text-muted-foreground/60 font-medium text-lg max-w-lg mx-auto leading-relaxed">
                No active distinctions identified in this sector. Initializing search for available operational protocols.
              </p>
            </Card>
          </motion.div>
        ) : (
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
                    transition={{ duration: 0.4, delay: index * 0.02 }}
                  >
                    <Card className={cn(
                      "group/badge relative h-full flex flex-col border border-border transition-all duration-500 rounded-2xl sm:rounded-2xl overflow-hidden backdrop-blur-3xl",
                      isEarned
                        ? cn("bg-card hover:bg-muted/10 hover:-translate-y-2 border-primary/20", getRarityGlowColor(badge.rarity))
                        : "bg-muted/30 border-border/50 grayscale hover:grayscale-0 hover:bg-muted/50 transition-all duration-700"
                    )}>
                      <CardContent className="p-4 sm:p-5 flex flex-col h-full space-y-4 relative z-10">
                        {/* Status Header */}
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.3em] border",
                            isEarned
                              ? cn("border-primary/30 text-primary bg-primary/10", getRarityColor(badge.rarity))
                              : "border-border text-muted-foreground bg-muted/50"
                          )}>
                            {isEarned ? badge.rarity : "Locked"}
                          </div>
                          {isEarned && (
                            <button
                              onClick={() => handleShareBadge(badge.name)}
                              className="h-8 w-8 rounded-full bg-muted/50 border border-border flex items-center justify-center text-primary/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500 group/share"
                            >
                              <Share2 className="h-3.5 w-3.5 group-hover/share:scale-110" />
                            </button>
                          )}
                        </div>

                        {/* Icon & Title */}
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={cn(
                            "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all duration-1000 group-hover/badge:scale-110 group-hover/badge:rotate-3 border border-border relative overflow-hidden",
                            isEarned ? "bg-muted/50 shadow-2xl" : "bg-muted/10"
                          )}>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.05] to-transparent opacity-0 group-hover/badge:opacity-100 transition-opacity" />
                            <span className={cn(isEarned ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "opacity-20")}>
                              {isEarned ? badge.icon : <Lock className="h-8 w-8 text-foreground/20" />}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase leading-tight group-hover/badge:text-primary transition-colors">
                              {badge.name}
                            </h4>
                            <p className="text-[10px] font-bold text-muted-foreground/60 leading-relaxed uppercase tracking-wider line-clamp-2 px-2">
                              {badge.description}
                            </p>
                          </div>
                        </div>

                        {/* Progress & Requirement */}
                        <div className="mt-auto pt-4 space-y-3">
                          {!isEarned && progress ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em]">
                                <span className="text-muted-foreground/40">Sync Progress</span>
                                <span className="text-primary">{progress.current} / {progress.max}</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  transition={{ duration: 1.5, ease: "circOut" }}
                                  className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.6)]"
                                />
                              </div>
                            </div>
                          ) : isEarned ? (
                            <div className="flex items-center justify-center gap-2 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[8px] font-black uppercase tracking-[0.4em] text-primary group-hover/badge:bg-primary/10 transition-all duration-500">
                              <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                              Synchronized
                            </div>
                          ) : (
                            <div className="h-0.5 w-full bg-border/50 rounded-full" />
                          )}

                          <div className="flex flex-col gap-1 text-center bg-muted/20 p-3 rounded-2xl border border-border/50">
                            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Protocol Requirement</span>
                            <span className="text-[9px] font-black text-foreground/60 tracking-tight">{badge.requirement}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
