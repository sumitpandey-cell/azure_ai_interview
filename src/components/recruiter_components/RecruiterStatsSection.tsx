"use client";

import React, { memo } from "react";
import {
    Plus,
    Building2,
    Users,
    Award,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecruiterStats {
    activeCampaigns: number;
    totalApplicants: number;
    interviewsThisWeek: number;
    avgScore: number;
}

interface RecruiterStatsSectionProps {
    loading: boolean;
    stats: RecruiterStats;
    onStartCampaign?: () => void;
}

export const RecruiterStatsSection = memo(({
    loading,
    stats,
}: RecruiterStatsSectionProps) => {
    return (
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6">
            <Link href="/recruiter/campaigns/create">
                <Button
                    className="h-16 sm:h-20 xl:h-20 w-full xl:w-64 text-lg font-[900] bg-primary hover:bg-primary/90 text-primary-foreground rounded-[2.5rem] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-95 group overflow-hidden relative"
                >
                    <div className="flex flex-col items-center justify-center gap-1 relative z-10">
                        <div className="flex items-center gap-2">
                            <Plus className="h-6 w-6" />
                            <span>Create Link</span>
                        </div>
                    </div>
                </Button>
            </Link>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {[
                    { label: "Active links", value: stats.activeCampaigns, icon: Building2, color: "indigo", sub: "Live candidates" },
                    { label: "Applicants", value: stats.totalApplicants, icon: Users, color: "purple", sub: "Total screening" },
                    { label: "This Week", value: stats.interviewsThisWeek, icon: TrendingUp, color: "pink", sub: "Interview volume" },
                    { label: "Success Role", value: `${stats.avgScore}%`, icon: Award, color: "emerald", sub: "Avg performance" },
                ].map((item, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "bg-card/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-border/40 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500 flex flex-col justify-between h-32"
                        )}
                    >
                        {/* Background Ornament */}
                        <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-${item.color}-500/5 blur-2xl group-hover:scale-150 transition-transform duration-700`} />

                        <div className="flex justify-between items-start relative z-10">
                            <div className={`p-2 rounded-xl bg-${item.color}-500/10 text-${item.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="relative z-10 space-y-0.5">
                            <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em]">{item.label}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter">
                                    {loading ? <Skeleton className="h-8 w-12 bg-muted/50 rounded-lg" /> : item.value}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground/50">{item.sub}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

RecruiterStatsSection.displayName = "RecruiterStatsSection";
