import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <ShimmerSkeleton className="h-8 w-64" />
                    <ShimmerSkeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                    <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                    <ShimmerSkeleton className="h-10 w-32 rounded-full" />
                    <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="flex flex-col xl:flex-row gap-4">
                <ShimmerSkeleton className="h-12 w-full xl:w-48 rounded-xl" />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border border-border">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <ShimmerSkeleton className="h-3 w-12" />
                            <ShimmerSkeleton className="h-8 w-20" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Section Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <ShimmerSkeleton key={i} className="h-64 rounded-xl" />
                ))}
            </div>

            {/* Badge Progress Skeleton */}
            <ShimmerSkeleton className="h-24 rounded-xl" />

            {/* Table Section Skeleton */}
            <div className="space-y-4 bg-card p-6 rounded-xl border border-border">
                <div className="flex justify-between items-center">
                    <ShimmerSkeleton className="h-6 w-40" />
                    <ShimmerSkeleton className="h-8 w-20" />
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <ShimmerSkeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 grid grid-cols-6 gap-4">
                                <ShimmerSkeleton className="h-4 w-full" />
                                <ShimmerSkeleton className="h-4 w-full" />
                                <ShimmerSkeleton className="h-4 w-full" />
                                <ShimmerSkeleton className="h-4 w-full" />
                                <ShimmerSkeleton className="h-4 w-full" />
                                <ShimmerSkeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
