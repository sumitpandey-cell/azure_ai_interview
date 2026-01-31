"use client";

import { Card } from "@/components/ui/card";
import { Trophy, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { BADGE_DEFINITIONS, getRarityColor } from "@/config/badges";
import { UserBadgeData } from "@/types/badge-types";

interface BadgeProgressWidgetProps {
    earnedBadges: string[];
    totalInterviews: number;
    currentStreak: number;
    averageScore: number;
}

export function BadgeProgressWidget({
    earnedBadges,
    totalInterviews,
    currentStreak,
    averageScore,
}: BadgeProgressWidgetProps) {
    const router = useRouter();

    // Calculate badge statistics
    const totalBadges = BADGE_DEFINITIONS.length;
    const earnedCount = earnedBadges.length;
    const progressPercentage = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;


    // Get recently earned badges from real data
    // We sort the definitions by those that are in the earnedBadges list
    // Ideally we'd have the 'awarded_at' date, but we can at least show the ones the user HAS.
    const recentlyEarned = BADGE_DEFINITIONS
        .filter((b) => earnedBadges.includes(b.id))
        .slice(-2) // Get the "last" ones in the definition list (higher tier usually) or just reverse
        .reverse();

    // Get next achievable badges
    const mockUserData: UserBadgeData = {
        streak: currentStreak,
        totalInterviews,
        weeklyRank: null,
        monthlyRank: null,
        totalWeeklyUsers: 0,
        lastActiveDate: null,
        currentStreak,
        wasInactive: false,
        earnedBadges,
        highestScore: averageScore,
        averageScore,
        communicationScore: 0,
        skillMastery: 0,
        technicalScore: 0,
        fastestTime: 0,
        interviewTypes: 0,
        morningInterviews: 0,
        nightInterviews: 0,
    };

    const nextBadges = BADGE_DEFINITIONS.filter((badge) => {
        if (earnedBadges.includes(badge.id)) return false;
        if (!badge.getProgress) return false;
        const progress = badge.getProgress(mockUserData);
        return progress.current > 0 && progress.current < progress.max;
    })
        .map((badge) => ({
            ...badge,
            progress: badge.getProgress!(mockUserData),
        }))
        .sort((a, b) => {
            const aPercent = (a.progress.current / a.progress.max) * 100;
            const bPercent = (b.progress.current / b.progress.max) * 100;
            return bPercent - aPercent;
        })
        .slice(0, 3);

    return (
        <Card className="border shadow-sm bg-card p-2 sm:p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-foreground">Achievements</h3>
                </div>
                <button
                    onClick={() => router.push("/badges")}
                    className="text-[9px] sm:text-[10px] text-primary hover:text-primary/80 font-bold uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                >
                    All
                    <ChevronRight className="h-2.5 w-2.5" />
                </button>
            </div>

            {/* Compact Stats Row */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Earned</span>
                    <span className="text-sm font-black text-primary">{earnedCount}</span>
                </div>
                <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                    {progressPercentage}%
                </span>
            </div>

            {/* Minimal Badge Display */}
            <div className="flex items-center gap-2">
                {/* Recently Earned - Compact */}
                {recentlyEarned.length > 0 ? (
                    <div className="flex gap-1.5">
                        <>
                            {recentlyEarned.slice(0, 2).map((badge, idx) => (
                                <div
                                    key={badge.id}
                                    className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-lg p-1.5 text-center shadow-sm relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer opacity-0 animate-in fade-in zoom-in-75 duration-300 fill-mode-forwards`}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                    onClick={() => router.push('/badges')}
                                    title={badge.name}
                                >
                                    <div className="text-lg group-hover:scale-110 transition-transform">{badge.icon}</div>
                                </div>
                            ))}
                        </>
                    </div>
                ) : null}

                {/* Next Badge - Single Most Achievable */}
                {nextBadges.length > 0 && (
                    <div className="flex-1 flex items-center gap-1.5 bg-muted/30 rounded-lg p-1.5 border border-border/50">
                        <span className="text-base">{nextBadges[0].icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-foreground truncate uppercase tracking-wide">{nextBadges[0].name}</div>
                            <div className="flex items-center gap-1">
                                <div className="flex-1 bg-muted rounded-full h-0.5 overflow-hidden">
                                    <div
                                        className={`bg-gradient-to-r ${getRarityColor(nextBadges[0].rarity)} h-full transition-all duration-500`}
                                        style={{ width: `${Math.round((nextBadges[0].progress.current / nextBadges[0].progress.max) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-[8px] font-bold text-muted-foreground">
                                    {Math.round((nextBadges[0].progress.current / nextBadges[0].progress.max) * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
