import { Card, CardContent } from "@/components/ui/card";

export function TemplatesPageSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-8">
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
        <Card className="group relative flex flex-col h-full overflow-hidden border-2 border-border/50 bg-card rounded-2xl">
            <CardContent className="p-8 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 flex-1">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-muted shrink-0 animate-pulse" />

                        <div className="flex-1 space-y-2">
                            {/* Title */}
                            <div className="h-6 w-40 bg-muted rounded-xl animate-pulse" />
                            {/* Badge */}
                            <div className="h-4 w-20 bg-muted rounded-lg animate-pulse" />
                        </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                </div>

                {/* Description */}
                <div className="space-y-3 mb-8">
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                </div>

                {/* Skills Section */}
                <div className="mt-auto space-y-4">
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />

                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((skill) => (
                            <div
                                key={skill}
                                className="h-8 w-16 bg-muted rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                </div>

                {/* Footer / Button */}
                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>

                    <div className="h-10 w-28 bg-muted rounded-xl animate-pulse" />
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
        <Card className="group relative overflow-hidden border-2 border-border/50 bg-card rounded-2xl">
            <CardContent className="p-8">
                {/* Company Logo and Header */}
                <div className="flex items-start gap-4 mb-8">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-muted animate-pulse shrink-0" />

                    <div className="flex-1 space-y-3">
                        <div className="h-7 w-40 bg-muted rounded-xl animate-pulse" />
                        <div className="h-4 w-24 bg-muted rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-3 mb-8">
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                </div>

                {/* Roles */}
                <div className="space-y-4 mb-8">
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((role) => (
                            <div
                                key={role}
                                className="h-8 w-24 bg-muted rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                </div>

                {/* Action CTA */}
                <div className="pt-6 border-t border-border/50">
                    <div className="h-12 w-full bg-muted rounded-2xl animate-pulse" />
                </div>
            </CardContent>
        </Card>
    );
}
