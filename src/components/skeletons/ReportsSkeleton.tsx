import { Card, CardContent } from "@/components/ui/card";
import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";

export function ReportsSkeleton() {
    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <ShimmerSkeleton className="h-8 w-64" />
                    <ShimmerSkeleton className="h-4 w-96" />
                </div>
            </div>

            {/* Statistics Section Skeleton */}
            <div className="bg-card rounded-2xl px-8 py-5 shadow-sm border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <ShimmerSkeleton className="h-6 w-32" />
                    <ShimmerSkeleton className="h-10 w-[280px]" />
                </div>

                <div className="grid grid-cols-2 gap-6 md:flex md:divide-x md:divide-border md:gap-0">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col md:px-8 first:pl-0 last:pr-0">
                            <ShimmerSkeleton className="h-4 w-24 mb-2" />
                            <ShimmerSkeleton className="h-10 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 border-none shadow-sm bg-card">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <ShimmerSkeleton className="h-6 w-40" />
                            <ShimmerSkeleton className="h-4 w-56" />
                        </div>
                        <ShimmerSkeleton className="h-[300px] w-full rounded-xl" />
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-none shadow-sm bg-card">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <ShimmerSkeleton className="h-6 w-48" />
                            <ShimmerSkeleton className="h-4 w-52" />
                        </div>
                        <ShimmerSkeleton className="h-[300px] w-full rounded-xl" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table Section Skeleton */}
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        <ShimmerSkeleton className="h-5 w-16" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 flex-1 w-full">
                            {[...Array(4)].map((_, i) => (
                                <ShimmerSkeleton key={i} className="h-10 w-full lg:w-40" />
                            ))}
                        </div>
                    </div>
                </CardContent>

                <div className="border-t border-border" />

                <div className="bg-card p-6 space-y-6">
                    <ShimmerSkeleton className="h-6 w-48" />
                    <div className="overflow-x-auto">
                        <div className="w-full min-w-[1000px] space-y-4">
                            <div className="flex gap-4 pb-4 border-b border-border">
                                {['Role', 'Date', 'Type', 'Duration', 'Status', 'Score', 'Feedback', 'Action'].map((_, i) => (
                                    <ShimmerSkeleton key={i} className={`h-4 ${i === 0 ? 'w-32' : i === 7 ? 'w-24 ml-auto' : 'w-20'}`} />
                                ))}
                            </div>

                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-4 py-4 items-center border-b border-border last:border-0">
                                    <div className="flex items-center gap-3 w-32">
                                        <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                                        <ShimmerSkeleton className="h-4 w-20" />
                                    </div>
                                    <ShimmerSkeleton className="h-4 w-20" />
                                    <ShimmerSkeleton className="h-4 w-20" />
                                    <ShimmerSkeleton className="h-4 w-20" />
                                    <ShimmerSkeleton className="h-6 w-24 rounded-full" />
                                    <ShimmerSkeleton className="h-6 w-12" />
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, j) => (
                                            <ShimmerSkeleton key={j} className="h-4 w-4 rounded-full" />
                                        ))}
                                    </div>
                                    <ShimmerSkeleton className="h-8 w-24 rounded-full ml-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
