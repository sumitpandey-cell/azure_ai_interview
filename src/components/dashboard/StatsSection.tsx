"use client";

import React, { memo } from "react";
import {
    Zap,
    Play,
    Clock,
    Award,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniBarChart } from "@/components/MiniBarChart";
import { formatDurationShort } from "@/lib/format-duration";

interface DashboardStats {
    totalInterviews: number;
    timePracticed: number;
    rank: number;
    averageScore: number;
}

interface StatsSectionProps {
    loading: boolean;
    stats: DashboardStats | null;
    scoreHistory: number[];
    subscriptionLoading: boolean;
    allowed: boolean;
    onStartInterview: () => void;
}

export const StatsSection = memo(({
    loading,
    stats,
    scoreHistory,
    subscriptionLoading,
    allowed,
    onStartInterview
}: StatsSectionProps) => {
    const formatTime = (seconds: number) => {
        return formatDurationShort(seconds);
    };

    return (
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
            <Button
                className="h-16 sm:h-14 xl:h-14 w-full xl:w-56 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group"
                onClick={onStartInterview}
                disabled={subscriptionLoading || !allowed}
            >
                <div className="flex flex-row items-center justify-center gap-1">
                    <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                        <Zap className="h-4 w-4 fill-white" />
                    </div>
                    <span>Start Interview</span>
                </div>
            </Button>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {/* Interviews Completed */}
                <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Play className="h-20 w-20 fill-primary/20 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">Interviews Completed</span>
                    <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                        {loading ? <Skeleton className="h-8 w-12 bg-muted/50 rounded-lg" /> : (stats?.totalInterviews || 0)}
                    </span>
                </div>

                {/* Time Practiced */}
                <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Clock className="h-20 w-20 text-accent fill-accent/20" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">Time Practiced</span>
                    <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                        {loading ? <Skeleton className="h-8 w-24 bg-muted/50 rounded-lg" /> : formatTime(stats?.timePracticed || 0)}
                    </span>
                </div>

                {/* Global Rank */}
                <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Award className="h-20 w-20 text-blue-500 fill-blue-500/20" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">Global Rank</span>
                    <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                        {loading ? <Skeleton className="h-8 w-16 bg-muted/50 rounded-lg" /> : `#${stats?.rank || 0}`}
                    </span>
                </div>

                {/* Average Score */}
                <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Target className="h-20 w-20 text-primary fill-primary/20" />
                    </div>
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Average Score</span>
                        <div className="flex items-end justify-between gap-2">
                            <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter flex-shrink-0">
                                {loading ? <Skeleton className="h-8 w-16 bg-muted/50 rounded-lg" /> : `${stats?.averageScore || 0}%`}
                            </span>
                            <div className="h-6 w-10 mb-1 opacity-80 flex-shrink-0">
                                <MiniBarChart
                                    data={scoreHistory}
                                    height={24}
                                    barWidth={3}
                                    color="hsl(var(--primary))"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

StatsSection.displayName = "StatsSection";
