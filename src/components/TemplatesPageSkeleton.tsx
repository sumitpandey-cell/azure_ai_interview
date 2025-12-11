import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TemplatesPageSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <div className="h-9 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-4 w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-8">
                <div className="h-10 w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />

                {/* Category Tabs and Search Bar Skeleton */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Category Tabs */}
                    <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-10 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer"
                            />
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="h-10 w-full md:w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>

                {/* Template Cards Grid Skeleton */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((card) => (
                        <TemplateCardSkeleton key={card} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Template Card Skeleton Component
function TemplateCardSkeleton() {
    return (
        <Card className="group relative flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {/* Decorative gradient background at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/50 dark:to-transparent opacity-50 pointer-events-none" />

            <CardContent className="p-6 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4 flex-1">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-muted via-muted/50 to-muted shimmer shrink-0" />

                        <div className="flex-1 space-y-2">
                            {/* Title */}
                            <div className="h-5 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                            {/* Badge */}
                            <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer" />
                        </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="h-5 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer" />
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                </div>

                {/* Skills Section */}
                <div className="mt-auto">
                    <div className="h-3 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mb-3" />

                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((skill) => (
                            <div
                                key={skill}
                                className="h-6 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer"
                            />
                        ))}
                        <div className="h-6 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    </div>
                </div>

                {/* Footer / Button */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                        <div className="h-3 w-28 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    </div>

                    <div className="h-8 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>
            </CardContent>
        </Card>
    );
}

// Company Templates Skeleton
export function CompanyTemplatesPageSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <div className="h-9 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-4 w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-8">
                <div className="h-10 w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />

                {/* Category Tabs and Search Bar Skeleton */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-10 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer"
                            />
                        ))}
                    </div>
                    <div className="h-10 w-full md:w-80 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                </div>

                {/* Section Title */}
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                    <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                </div>

                {/* Company Cards Grid Skeleton */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((card) => (
                        <CompanyCardSkeleton key={card} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Company Card Skeleton Component
function CompanyCardSkeleton() {
    return (
        <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <CardContent className="p-6">
                {/* Company Logo and Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-muted via-muted/50 to-muted shimmer shrink-0" />

                    <div className="flex-1 space-y-2">
                        <div className="h-6 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                        <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer" />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    <div className="h-4 w-5/6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    <div className="h-4 w-2/3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                        <div className="h-4 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                        <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    </div>
                </div>

                {/* Roles */}
                <div className="space-y-3 mb-6">
                    <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((role) => (
                            <div
                                key={role}
                                className="h-6 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer"
                            />
                        ))}
                    </div>
                </div>

                {/* Button */}
                <div className="h-10 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
            </CardContent>
        </Card>
    );
}
