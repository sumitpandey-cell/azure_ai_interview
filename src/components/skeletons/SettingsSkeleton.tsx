import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";

export function SettingsSkeleton() {
    return (
        <div className="w-full space-y-6 pb-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-2">
                <ShimmerSkeleton className="h-8 w-40" />
                <ShimmerSkeleton className="h-4 w-64" />
            </div>

            {/* Navigation Tabs Skeleton */}
            <div className="border-b border-border bg-card rounded-t-xl overflow-hidden">
                <div className="flex px-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="px-6 py-4 flex gap-2 items-center">
                            <ShimmerSkeleton className="h-4 w-4 rounded-full" />
                            <ShimmerSkeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area Skeleton */}
            <Card className="border-none shadow-sm bg-card">
                <CardHeader className="space-y-2">
                    <ShimmerSkeleton className="h-6 w-48" />
                    <ShimmerSkeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Profile Section */}
                    <div className="flex items-center gap-6">
                        <ShimmerSkeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                            <ShimmerSkeleton className="h-6 w-32" />
                            <ShimmerSkeleton className="h-4 w-48" />
                            <ShimmerSkeleton className="h-4 w-16" />
                        </div>
                    </div>

                    <div className="border-t border-border pt-8 space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <ShimmerSkeleton className="h-4 w-32" />
                                <ShimmerSkeleton className="h-10 w-full max-w-md" />
                            </div>
                        ))}
                        <ShimmerSkeleton className="h-10 w-32 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
