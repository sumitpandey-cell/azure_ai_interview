"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, TrendingUp, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { BADGE_DEFINITIONS, getRarityColor } from "@/config/badges";

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

    // Calculate badge score (weighted by rarity)
    const badgeScore = BADGE_DEFINITIONS.reduce((score, badge) => {
        if (!earnedBadges.includes(badge.id)) return score;
        const rarityPoints = {
            bronze: 10,
            silver: 25,
            gold: 50,
            platinum: 100,
            special: 75,
        };
        return score + (rarityPoints[badge.rarity] || 0);
    }, 0);

    // Get recently earned badges (mock - would come from database)
    const recentlyEarned = BADGE_DEFINITIONS.filter((b) => earnedBadges.includes(b.id)).slice(0, 3);

    // Get next achievable badges
    const mockUserData = {
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
    };

    const nextBadges = BADGE_DEFINITIONS.filter((badge) => {
        if (earnedBadges.includes(badge.id)) return false;
        if (!badge.getProgress) return false;
        const progress = badge.getProgress(mockUserData as any);
        return progress.current > 0 && progress.current < progress.max;
    })
        .map((badge) => ({
            ...badge,
            progress: badge.getProgress!(mockUserData as any),
        }))
        .sort((a, b) => {
            const aPercent = (a.progress.current / a.progress.max) * 100;
            const bPercent = (b.progress.current / b.progress.max) * 100;
            return bPercent - aPercent;
        })
        .slice(0, 3);

    return (
        <Card className="border-none shadow-sm bg-card p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-sm font-bold text-foreground">Badge Progress</h3>
                </div>
                <button
                    onClick={() => router.push("/badges")}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                    View All
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>

            {/* Horizontal Layout */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left: Stats */}
                <div className="flex gap-2 lg:w-1/4">
                    <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg p-2">
                        <div className="text-xs text-blue-700 dark:text-blue-300 mb-0.5">Earned</div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{earnedCount}</div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg p-2">
                        <div className="text-xs text-purple-700 dark:text-purple-300 mb-0.5">Score</div>
                        <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{badgeScore}</div>
                    </div>
                </div>

                {/* Center: Next Badges */}
                <div className="flex-1 lg:w-1/2">
                    {nextBadges.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                <h4 className="text-xs font-semibold text-foreground">Next Badges</h4>
                            </div>
                            <div className="space-y-2">
                                {nextBadges.map((badge) => {
                                    const progressPercent = Math.round((badge.progress.current / badge.progress.max) * 100);
                                    return (
                                        <div key={badge.id} className="flex items-center gap-2">
                                            <span className="text-lg">{badge.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="text-xs font-medium text-foreground truncate">{badge.name}</div>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 ml-2">
                                                        {progressPercent}%
                                                    </Badge>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                                                    <div
                                                        className={`bg-gradient-to-r ${getRarityColor(badge.rarity)} h-full transition-all duration-500`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center py-2">
                                <Trophy className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                                <p className="text-xs text-muted-foreground">Complete interviews to earn badges!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Recently Earned */}
                <div className="lg:w-1/4">
                    {recentlyEarned.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Award className="h-3.5 w-3.5 text-yellow-500" />
                                <h4 className="text-xs font-semibold text-foreground">Recently Earned</h4>
                            </div>
                            <div className="flex lg:flex-col gap-2">
                                {recentlyEarned.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className={`flex-1 bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-lg p-2 text-center`}
                                    >
                                        <div className="text-2xl mb-0.5">{badge.icon}</div>
                                        <div className="text-[10px] font-medium text-white truncate">{badge.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center py-2">
                                <Award className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                                <p className="text-xs text-muted-foreground">No badges yet</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Overall Progress</span>
                    <span className="text-xs font-medium text-foreground">
                        {earnedCount}/{totalBadges} ({progressPercentage}%)
                    </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
        </Card>
    );
}
