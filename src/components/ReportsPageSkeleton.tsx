
export function ReportsPageSkeleton() {
    return (
        <div className="max-w-[1600px] mx-auto sm:pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden pb-12 sm:pt-0">
            {/* Header Section Skeleton */}
            <div className="space-y-2 mb-8">
                <div className="h-8 w-64 bg-muted/50 rounded-lg shimmer" />
                <div className="h-4 w-96 bg-muted/50 rounded-lg shimmer" />
            </div>

            {/* Statistics Section Skeleton */}
            <div className="flex flex-col xl:flex-row items-stretch gap-4 mb-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden h-20 sm:h-24 flex flex-col justify-between">
                            <div className="h-4 w-24 bg-muted/50 rounded shimmer mb-2" />
                            <div className="h-8 w-16 bg-muted/50 rounded-lg shimmer" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Section Removed to match page logic (only shows if loading/empty logic differs, but page only has stats + list) */}

            {/* Filters and Table Section Skeleton */}
            <div className="space-y-6">
                {/* Filter Toolbar Skeleton */}
                <div className="bg-card dark:bg-card/50 p-4 rounded-2xl border border-border/80 dark:border-border/40 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative w-full sm:flex-1 sm:max-w-xs">
                            <div className="h-11 bg-muted/40 rounded-xl shimmer w-full" />
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2">
                            <div className="col-span-1">
                                <div className="h-11 w-full sm:w-[140px] bg-muted/40 rounded-xl shimmer" />
                            </div>
                            <div className="col-span-1">
                                <div className="h-11 w-full sm:w-[140px] bg-muted/40 rounded-xl shimmer" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <div className="h-11 w-full sm:w-[140px] bg-muted/40 rounded-xl shimmer" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Structured Table List Skeleton */}
                <div className="bg-card dark:bg-card/50 rounded-2xl border border-border/80 dark:border-border/60 shadow-md sm:shadow-sm overflow-x-auto no-scrollbar">
                    <div className="min-w-[850px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-muted/30 dark:bg-muted/10">
                            <div className="col-span-4 h-4 w-32 bg-muted/50 rounded shimmer" />
                            <div className="col-span-2 h-4 w-20 bg-muted/50 rounded shimmer mx-auto" />
                            <div className="col-span-2 h-4 w-20 bg-muted/50 rounded shimmer mx-auto" />
                            <div className="col-span-2 h-4 w-20 bg-muted/50 rounded shimmer mx-auto" />
                            <div className="col-span-2 h-4 w-24 bg-muted/50 rounded shimmer ml-auto" />
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-border/40">
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className="grid grid-cols-12 gap-4 px-6 py-5 items-center">
                                    {/* Role & Protocol */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-muted/50 shimmer shrink-0" />
                                        <div className="space-y-1.5 flex-1 max-w-[200px]">
                                            <div className="h-4 w-3/4 bg-muted/50 rounded shimmer" />
                                            <div className="h-3 w-1/2 bg-muted/50 rounded shimmer" />
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-2 flex justify-center">
                                        <div className="h-4 w-24 bg-muted/50 rounded shimmer" />
                                    </div>

                                    {/* Duration */}
                                    <div className="col-span-2 flex justify-center">
                                        <div className="h-4 w-16 bg-muted/50 rounded shimmer" />
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex justify-center">
                                        <div className="h-6 w-24 bg-muted/50 rounded-full shimmer" />
                                    </div>

                                    {/* Performance */}
                                    <div className="col-span-2 flex items-center justify-end gap-3">
                                        <div className="h-4 w-8 bg-muted/50 rounded shimmer" />
                                        <div className="h-1.5 w-16 rounded-full bg-muted/50 shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
