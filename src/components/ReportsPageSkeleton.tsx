import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ReportsPageSkeleton() {
    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <div className="h-8 w-64 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>
            </div>

            {/* Statistics Section Skeleton */}
            <div className="bg-card rounded-2xl px-8 py-5 shadow-sm border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="h-6 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-10 w-[280px] bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>

                <div className="grid grid-cols-2 gap-6 md:flex md:divide-x md:divide-border md:gap-0">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col md:px-8 first:pl-0 last:pr-0">
                            <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded mb-2 shimmer" />
                            <div className="h-10 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Analysis Skeleton */}
                <Card className="col-span-1 lg:col-span-2 border-none shadow-sm bg-card">
                    <CardContent className="p-6">
                        <div className="mb-6 space-y-2">
                            <div className="h-6 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                            <div className="h-4 w-56 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </div>
                        <div className="h-[300px] w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded-xl shimmer" />
                    </CardContent>
                </Card>

                {/* Performance by Type Skeleton */}
                <Card className="col-span-1 border-none shadow-sm bg-card">
                    <CardContent className="p-6">
                        <div className="mb-6 space-y-2">
                            <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                            <div className="h-4 w-52 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </div>
                        <div className="h-[300px] w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded-xl shimmer" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table Section Skeleton */}
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                {/* Filters Skeleton */}
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center">
                        <div className="h-5 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 flex-1 w-full">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-10 w-full lg:w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer"
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>

                {/* Separator */}
                <div className="border-t border-border" />

                {/* Table Skeleton */}
                <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-sm border border-border">
                    <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg mb-6 shimmer" />

                    <div className="overflow-x-auto">
                        <div className="w-full min-w-[1000px] space-y-4">
                            {/* Table Header */}
                            <div className="flex gap-4 pb-4 border-b border-border">
                                {['Role', 'Date', 'Type', 'Duration', 'Status', 'Score', 'Feedback', 'Action'].map((header, i) => (
                                    <div
                                        key={i}
                                        className={`h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer ${i === 0 ? 'w-32' : i === 7 ? 'w-24 ml-auto' : 'w-20'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Table Rows */}
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className="flex gap-4 py-4 items-center border-b border-border last:border-0">
                                    {/* Role with Avatar */}
                                    <div className="flex items-center gap-3 w-32">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                                        <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                    </div>

                                    {/* Date */}
                                    <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />

                                    {/* Type */}
                                    <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />

                                    {/* Duration */}
                                    <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />

                                    {/* Status Badge */}
                                    <div className="h-6 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer" />

                                    {/* Score */}
                                    <div className="h-6 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />

                                    {/* Feedback Stars */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <div
                                                    key={star}
                                                    className="h-4 w-4 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="h-8 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer ml-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
