import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ReportPageSkeleton() {
    return (
        <div className="space-y-6 overflow-x-hidden max-w-full animate-in fade-in duration-500">
            {/* Header Section Skeleton */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between w-full gap-4">
                            {/* Left Side: Name, Position */}
                            <div className="flex flex-col gap-2 min-w-0 flex-1">
                                <div className="h-8 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                                <div className="h-5 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                                <div className="h-5 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer mt-1" />
                            </div>

                            {/* Right Side: Score Circle */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                                <div className="h-3 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer mt-2" />
                            </div>
                        </div>

                        {/* Bottom Row: Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
                            <div className="h-10 w-full sm:w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                            <div className="h-10 w-full sm:w-36 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Navigation Skeleton */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {[1, 2, 3].map((tab) => (
                    <div
                        key={tab}
                        className="h-10 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer flex-shrink-0"
                    />
                ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Executive Summary Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="h-6 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                            <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                            <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                        </CardContent>
                    </Card>

                    {/* Strengths & Improvements Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {[1, 2].map((card) => (
                            <Card key={card} className="border-none shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                                        <div className="h-6 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[1, 2, 3, 4].map((item) => (
                                        <div key={item} className="flex items-start gap-2">
                                            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer mt-0.5 flex-shrink-0" />
                                            <div className="h-4 flex-1 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Skills Assessment & Action Plan Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Skills Assessment */}
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <div className="h-6 w-36 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {[1, 2, 3, 4].map((skill) => (
                                    <div key={skill} className="space-y-2">
                                        <div className="flex justify-between">
                                            <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                            <div className="h-4 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                        </div>
                                        <div className="h-2 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full shimmer" />
                                        <div className="h-3 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Action Plan */}
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted shimmer mt-0.5 flex-shrink-0" />
                                        <div className="h-4 flex-1 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Interview Details Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="h-6 w-36 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3, 4].map((detail) => (
                                <div key={detail} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted shimmer" />
                                        <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                    </div>
                                    <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Radar Chart Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="h-6 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded-xl shimmer" />
                        </CardContent>
                    </Card>

                    {/* AI Recommendation Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="h-6 w-40 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg shimmer" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                            <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                            <div className="h-4 w-2/3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
