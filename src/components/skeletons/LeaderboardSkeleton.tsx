import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";

export function LeaderboardSkeleton() {
    return (
        <div className="space-y-8 pb-8 animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-3">
                    <ShimmerSkeleton className="h-10 w-64" />
                    <ShimmerSkeleton className="h-6 w-96" />
                    <ShimmerSkeleton className="h-4 w-32" />
                </div>
                <ShimmerSkeleton className="h-24 w-full sm:w-64 rounded-xl" />
            </div>

            {/* Podium Section Skeleton */}
            <div className="flex flex-row items-end justify-center gap-4 sm:gap-12 pb-4">
                {/* 2nd Place */}
                <div className="w-[30%] sm:w-[260px] h-[300px] flex flex-col items-center">
                    <ShimmerSkeleton className="h-[250px] w-full rounded-2xl" />
                </div>
                {/* 1st Place */}
                <div className="w-[30%] sm:w-[260px] h-[350px] flex flex-col items-center relative">
                    <ShimmerSkeleton className="absolute -top-12 h-12 w-12 rounded-full" />
                    <ShimmerSkeleton className="h-[300px] w-full rounded-2xl" />
                </div>
                {/* 3rd Place */}
                <div className="w-[30%] sm:w-[260px] h-[280px] flex flex-col items-center">
                    <ShimmerSkeleton className="h-[230px] w-full rounded-2xl" />
                </div>
            </div>

            {/* Filters & Search Skeleton */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
                <div className="flex gap-2 w-full md:w-auto">
                    <ShimmerSkeleton className="h-10 w-40" />
                    <ShimmerSkeleton className="h-10 w-40" />
                </div>
                <ShimmerSkeleton className="h-10 w-full md:w-80" />
            </div>

            {/* Full Rankings List Skeleton */}
            <div className="space-y-4">
                <ShimmerSkeleton className="h-8 w-40" />
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex gap-4">
                        {[...Array(6)].map((_, i) => (
                            <ShimmerSkeleton key={i} className={`h-4 ${i === 0 ? 'w-20' : i === 1 ? 'w-64' : 'w-24 ml-auto'}`} />
                        ))}
                    </div>
                    <div className="divide-y divide-border">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex gap-4 p-4 items-center">
                                <ShimmerSkeleton className="h-8 w-8 rounded-full mx-auto" />
                                <div className="flex items-center gap-3 w-64">
                                    <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-1">
                                        <ShimmerSkeleton className="h-4 w-32" />
                                        <ShimmerSkeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <ShimmerSkeleton className="h-8 w-12 ml-auto" />
                                <ShimmerSkeleton className="h-4 w-24 ml-auto" />
                                <ShimmerSkeleton className="h-6 w-16 ml-auto rounded-full" />
                                <ShimmerSkeleton className="h-10 w-24 ml-auto rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
