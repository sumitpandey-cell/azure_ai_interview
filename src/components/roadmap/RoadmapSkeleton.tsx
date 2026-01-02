'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RoadmapSkeleton() {
    return (
        <div className="container mx-auto px-1 py-12">
            {/* Header Skeleton */}
            <div className="mb-12">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-12 md:h-16 w-3/4 mb-4" />
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-40 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded-full" />
                </div>
            </div>

            <div className="space-y-16">
                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-none shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                            <CardHeader>
                                <div className="flex justify-between items-center mb-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-8 rounded-xl" />
                                </div>
                                <Skeleton className="h-10 w-20" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                {/* Analysis Cards Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2].map((i) => (
                        <Card key={i} className="border-none shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                            <CardHeader className="border-b">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <div>
                                        <Skeleton className="h-6 w-32 mb-1" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-3">
                                {[1, 2, 3, 4].map((j) => (
                                    <Skeleton key={j} className="h-12 w-full rounded-2xl" />
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Phases Skeleton */}
                <div className="space-y-8">
                    <div className="flex justify-between items-center mb-8">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-8 w-40 rounded-full" />
                    </div>
                    {[1, 2].map((i) => (
                        <div key={i} className="relative pl-12">
                            <Skeleton className="absolute left-0 top-0 w-10 h-10 rounded-full" />
                            <Card className="border-none shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                                <CardHeader className="h-24" />
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
