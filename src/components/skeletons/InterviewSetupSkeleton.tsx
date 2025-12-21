import { ShimmerSkeleton } from "@/components/ui/shimmer-skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function InterviewSetupSkeleton() {
    return (
        <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md px-6 lg:px-12 flex items-center justify-between">
                <ShimmerSkeleton className="h-8 w-32" />
                <ShimmerSkeleton className="h-9 w-40 rounded-lg" />
            </header>

            {/* Main Content Skeleton */}
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start justify-center">
                {/* Left Column: Video Preview Skeleton */}
                <div className="w-full max-w-3xl space-y-4">
                    <ShimmerSkeleton className="aspect-video w-full rounded-2xl" />
                    <div className="flex justify-center">
                        <ShimmerSkeleton className="h-4 w-64" />
                    </div>
                </div>

                {/* Right Column: Controls & Instructions Skeleton */}
                <div className="w-full max-w-sm space-y-6">
                    <Card className="border-none shadow-lg bg-card/50">
                        <CardContent className="p-5 space-y-4">
                            <ShimmerSkeleton className="h-6 w-32" />
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <ShimmerSkeleton key={i} className="h-10 w-full rounded-md" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <div className="space-y-2 text-center">
                            <ShimmerSkeleton className="h-8 w-40 mx-auto" />
                            <ShimmerSkeleton className="h-4 w-64 mx-auto" />
                        </div>
                        <ShimmerSkeleton className="h-14 w-full rounded-xl" />
                    </div>

                    <div className="space-y-4">
                        <ShimmerSkeleton className="h-4 w-32 mx-auto" />
                        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <ShimmerSkeleton className="h-5 w-5 rounded-full" />
                                    <ShimmerSkeleton className="h-4 flex-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
