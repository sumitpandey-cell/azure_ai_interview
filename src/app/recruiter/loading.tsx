import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Top Bar Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-2xl bg-indigo-500/5" />
                        <Skeleton className="h-10 w-48 rounded-xl" />
                    </div>
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>

                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-48 md:w-64 rounded-2xl" />
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                </div>
            </div>

            {/* Quick KPIs Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <Skeleton className="h-12 w-12 rounded-2xl" />
                            <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-24 mb-2 rounded-lg" />
                        <Skeleton className="h-4 w-32 mb-4 rounded-lg" />
                        <Skeleton className="h-3 w-40 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Main Content Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem] h-[400px]">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <Skeleton className="h-7 w-48 mb-2 rounded-lg" />
                                <Skeleton className="h-4 w-32 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-xl" />
                        </div>
                        <Skeleton className="h-full w-full rounded-2xl opacity-20" />
                    </div>

                    <div className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem] h-[300px]">
                        <Skeleton className="h-7 w-40 mb-6 rounded-lg" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem] h-[500px]">
                        <Skeleton className="h-7 w-32 mb-8 rounded-lg" />
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-24 rounded-lg" />
                                        <Skeleton className="h-3 w-16 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-8 w-12 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
