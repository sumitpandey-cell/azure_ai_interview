import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-4 pb-12 animate-in fade-in duration-500">
            {/* Header Section - Greeting and Desktop Controls Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="space-y-2">
                    <ShimmerSkeleton className="h-8 w-64 rounded-lg" />
                    <ShimmerSkeleton className="h-4 w-48 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                    <ShimmerSkeleton className="h-9 w-9 rounded-full" />
                    <ShimmerSkeleton className="h-9 w-9 rounded-full" />
                    <ShimmerSkeleton className="h-9 w-16 rounded-full" />
                    <ShimmerSkeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>

            {/* Stats Section Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <ShimmerSkeleton key={i} className="h-24 w-full rounded-2xl sm:rounded-3xl" />
                ))}
            </div>

            {/* Analytics Section Skeleton (3-column grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mb-8">
                <ShimmerSkeleton className="w-full aspect-square rounded-[2rem]" />
                <ShimmerSkeleton className="w-full aspect-square rounded-[2rem]" />
                <ShimmerSkeleton className="w-full aspect-square rounded-[2rem]" />
            </div>

            {/* Recent Sessions Header Skeleton */}
            <div className="flex items-end justify-between px-1 pb-2 border-b border-border/40 mb-4">
                <ShimmerSkeleton className="h-6 w-48 rounded-md" />
                <ShimmerSkeleton className="h-8 w-24 rounded-md" />
            </div>

            {/* Session Card Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 rounded-[2rem] bg-card/60 border border-border/50 p-6 flex flex-col justify-between overflow-hidden relative">
                        <div className="flex justify-between items-start">
                            <ShimmerSkeleton className="h-6 w-24 rounded-full" />
                            <ShimmerSkeleton className="h-5 w-8 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <ShimmerSkeleton className="h-6 w-3/4 rounded-md" />
                            <ShimmerSkeleton className="h-4 w-1/2 rounded-md" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <ShimmerSkeleton className="h-3 w-12 rounded-md" />
                                <ShimmerSkeleton className="h-6 w-20 rounded-md" />
                            </div>
                            <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
