import { Card, CardContent } from "@/components/ui/card";

export function ReportPageSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16 animate-in fade-in duration-500 sm:pt-0 overflow-x-hidden max-w-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row lg:items-end justify-between gap-4 sm:gap-6 relative z-10">
                <div className="space-y-2 sm:space-y-3">
                    <div className="h-8 w-48 sm:w-64 bg-muted/50 rounded-lg shimmer" />
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                        <div className="h-7 w-32 bg-muted/50 rounded-full shimmer" />
                        <div className="h-7 w-40 bg-muted/50 rounded-full shimmer" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-9 sm:h-11 w-32 sm:w-40 bg-muted/50 rounded-xl sm:rounded-2xl shimmer hidden lg:block" />
                    <div className="h-9 w-9 sm:h-11 sm:w-11 bg-muted/50 rounded-xl sm:rounded-2xl shimmer" />
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                {/* Score Card */}
                <Card className="xl:col-span-1 border border-border/50 shadow-lg bg-card/80 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative">
                    <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center h-full gap-5 sm:gap-6 text-center relative z-10">
                        <div className="h-28 w-28 sm:h-40 sm:w-40 rounded-full border-8 border-muted/20 shimmer relative" />
                        <div className="h-8 w-48 bg-muted/50 rounded-xl shimmer" />
                    </CardContent>
                </Card>

                {/* Summary Card */}
                <Card className="xl:col-span-3 border border-border/50 shadow-lg bg-card/80 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative">
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="h-8 w-48 bg-muted/50 rounded-lg shimmer" />
                                <div className="h-4 w-32 bg-muted/50 rounded shimmer" />
                            </div>
                            <div className="hidden sm:block h-10 w-24 bg-muted/50 rounded-xl shimmer" />
                        </div>

                        <div className="space-y-3 pl-4 border-l-4 border-muted/30 py-2">
                            <div className="h-4 w-full bg-muted/30 rounded shimmer" />
                            <div className="h-4 w-full bg-muted/30 rounded shimmer" />
                            <div className="h-4 w-3/4 bg-muted/30 rounded shimmer" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/50">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-muted/50 shimmer shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <div className="h-2 w-16 bg-muted/50 rounded shimmer" />
                                        <div className="h-3 w-12 bg-muted/50 rounded shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Content */}
            <div className="w-full space-y-8">
                {/* Tabs List */}
                <div className="flex gap-2 mb-8 overflow-hidden">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 w-32 sm:w-40 bg-muted/50 rounded-2xl shimmer" />
                    ))}
                </div>

                {/* Content Area - Simulating Insights Tab */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border border-border/50 shadow-lg bg-card/40 rounded-2xl h-80 shimmer" />
                    <Card className="border border-border/50 shadow-lg bg-card/40 rounded-2xl h-80 shimmer" />
                </div>

                {/* Roadmap Banner Mock */}
                <Card className="border border-border/50 shadow-lg bg-card/40 rounded-3xl h-32 shimmer" />
            </div>
        </div>
    );
}
