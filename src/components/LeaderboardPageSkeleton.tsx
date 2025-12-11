import { Card, CardContent } from "@/components/ui/card";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeaderboardPageSkeleton() {
    return (
        <div className="space-y-8 pb-8 animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div className="flex flex-col items-start justify-start text-left space-y-3">
                    <div className="h-10 w-64 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-5 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-4 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                </div>

                {/* User Rank Card Skeleton */}
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl px-6 py-4 shadow-lg">
                    <div className="space-y-2">
                        <div className="h-3 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                        <div className="h-8 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    </div>
                    <div className="h-12 w-px bg-indigo-500/20" />
                    <div className="space-y-2">
                        <div className="h-3 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                        <div className="h-8 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    </div>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                </div>
            </div>

            {/* Podium Section Skeleton */}
            <div className="w-full mt-8">
                <div className="flex flex-row items-end justify-center gap-3 sm:gap-8 md:gap-12 h-full pb-4 px-2">
                    {/* Second Place */}
                    <PodiumCardSkeleton rank={2} className="w-[30%] sm:w-[260px]" />

                    {/* First Place */}
                    <PodiumCardSkeleton rank={1} className="w-[30%] sm:w-[260px]" />

                    {/* Third Place */}
                    <PodiumCardSkeleton rank={3} className="w-[30%] sm:w-[260px]" />
                </div>
            </div>

            {/* Filters & Search Skeleton */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-2 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar px-2">
                    <div className="h-9 w-[160px] bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-9 w-[180px] bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>
                <div className="h-10 w-full md:w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
            </div>

            {/* Rankings Table Skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer px-2" />

                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        {/* Table Header */}
                        <div className="flex gap-4 p-4 bg-muted/50 border-b border-border">
                            {['Rank', 'User', 'Score', 'Interviews', 'Badge', 'Action'].map((header, i) => (
                                <div
                                    key={i}
                                    className={`h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer ${i === 0 ? 'w-20' : i === 1 ? 'w-48' : i === 5 ? 'w-24 ml-auto' : 'w-24'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Table Rows */}
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                            <div key={row} className="flex gap-4 p-4 items-center border-b border-border last:border-none">
                                {/* Rank */}
                                <div className="w-20">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer mx-auto" />
                                </div>

                                {/* User with Avatar */}
                                <div className="flex items-center gap-3 w-48">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                        <div className="h-3 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="w-24">
                                    <div className="h-6 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mx-auto" />
                                </div>

                                {/* Interviews */}
                                <div className="w-24">
                                    <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mx-auto" />
                                </div>

                                {/* Badge */}
                                <div className="w-24">
                                    <div className="h-6 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer mx-auto" />
                                </div>

                                {/* Action Button */}
                                <div className="w-24 ml-auto">
                                    <div className="h-8 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scoring Information Footer Skeleton */}
            <Card className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200/50 dark:border-indigo-800/50">
                <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 w-64 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                            <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[1, 2].map((col) => (
                            <div key={col} className="space-y-3">
                                {[1, 2].map((card) => (
                                    <div key={card} className="bg-white/60 dark:bg-black/20 rounded-lg p-4 border border-indigo-200/50 dark:border-indigo-800/30 space-y-3">
                                        <div className="h-5 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                        <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                        <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Podium Card Skeleton Component
function PodiumCardSkeleton({ rank, className }: { rank: number; className?: string }) {
    const isFirst = rank === 1;

    return (
        <div className={cn(
            "relative flex flex-col items-center transition-all duration-500",
            isFirst ? "scale-100 sm:scale-110 z-20 mb-4 sm:mb-8" : "scale-95 z-10",
            className
        )}>
            {/* Crown for 1st Place */}
            {isFirst && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <Crown className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 fill-yellow-400/20 opacity-50" />
                </div>
            )}

            <div className={cn(
                "relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border backdrop-blur-md",
                rank === 1 ? "bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-xl shadow-yellow-500/10 dark:from-yellow-500/10 dark:to-black/60 dark:border-yellow-500/50" :
                    rank === 2 ? "bg-gradient-to-b from-slate-50 to-white border-slate-200 shadow-xl shadow-slate-500/10 dark:from-slate-400/10 dark:to-black/60 dark:border-slate-400/50" :
                        "bg-gradient-to-b from-orange-50 to-white border-orange-200 shadow-xl shadow-orange-500/10 dark:from-amber-700/10 dark:to-black/60 dark:border-amber-700/50"
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
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />

                    {/* Avatar */}
                    <div className="relative mb-1.5 sm:mb-4 mt-1 sm:mt-2">
                        <div className={cn(
                            "w-12 h-12 sm:w-24 sm:h-24 rounded-full p-1 border-2",
                            rank === 1 ? "border-yellow-500" :
                                rank === 2 ? "border-slate-400" :
                                    "border-amber-700"
                        )}>
                            <div className="w-full h-full rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                        </div>
                    </div>

                    {/* Name */}
                    <div className="h-4 sm:h-6 w-24 sm:w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mb-1" />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-1 sm:gap-4 w-full my-1.5 sm:my-4 bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg sm:rounded-xl p-1.5 sm:p-3">
                        <div className="text-center border-r border-gray-200 dark:border-white/10 space-y-1">
                            <div className="h-3 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mx-auto" />
                            <div className="h-4 sm:h-5 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mx-auto" />
                        </div>
                        <div className="text-center space-y-1">
                            <div className="h-3 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mx-auto" />
                            <div className="h-4 sm:h-5 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mx-auto" />
                        </div>
                    </div>

                    {/* Button */}
                    <div className="w-full h-7 sm:h-9 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md sm:rounded-lg shimmer" />
                </div>
            </div>
        </div>
    );
}
