"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    Calendar,
    Target,
    Zap,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecruiterStore } from "@/stores";
import { useAuth } from "@/contexts/AuthContext";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { toast } from "sonner";
import { motion } from "framer-motion";


export default function AnalyticsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { campaigns, loading, fetchDashboardData } = useRecruiterStore();
    const [isMounted, setIsMounted] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'7D' | '30D'>('30D');

    useEffect(() => {
        setIsMounted(true);
        if (user) fetchDashboardData(user.id);
    }, [user, fetchDashboardData]);

    const handleExportReport = () => {
        try {
            if (campaigns.length === 0) {
                toast.error("No data available to export");
                return;
            }

            const headers = ["Campaign Title", "Position", "Applicants", "Average Score", "Status", "Date Created"];
            const csvRows = campaigns.map(c => [
                `"${c.title.replace(/"/g, '""')}"`,
                `"${c.position.replace(/"/g, '""')}"`,
                c.applicant_count || 0,
                `${c.avg_score || 0}%`,
                c.is_active ? "Active" : "Inactive",
                new Date(c.created_at).toLocaleDateString()
            ].join(","));

            const csvContent = [headers.join(","), ...csvRows].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Hiring_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Analytics report exported successfully!");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export report");
        }
    };

    if (!isMounted || loading) return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-pulse">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 border border-primary/20 bg-primary/10 rounded-2xl" />
                        <Skeleton className="h-8 sm:h-10 w-48 rounded-xl" />
                    </div>
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
                <Skeleton className="h-12 w-12 sm:w-40 rounded-2xl" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card/40 backdrop-blur-md border border-border/50 p-5 rounded-[2.5rem] relative overflow-hidden h-32 flex flex-col justify-between">
                        <div className="flex justify-end mb-2">
                            <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-24 mb-1 rounded-lg" />
                            <Skeleton className="h-3 w-16 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {[1, 2].map((i) => (
                    <div key={i} className="w-full aspect-square">
                        <div className="bg-card/40 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-[2.5rem] h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <Skeleton className="h-6 sm:h-7 w-32 sm:w-48 mb-2 rounded-lg" />
                                    <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 rounded-lg" />
                                </div>
                                <Skeleton className="h-8 w-16 rounded-xl" />
                            </div>
                            <Skeleton className="flex-1 w-full rounded-2xl opacity-10" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Link Performance Skeleton */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32 rounded-lg" />
                        <Skeleton className="h-3 w-48 rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[240px] h-40 bg-card/40 border border-border/50 rounded-[2.5rem] p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-4 w-12 rounded-full" />
                            </div>
                            <Skeleton className="h-5 w-40 mb-2 rounded-lg" />
                            <Skeleton className="h-3 w-24 mb-6 rounded-lg" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-8 w-full rounded-lg" />
                                <Skeleton className="h-8 w-full rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Mock data for trends
    const trendData = [
        { date: 'Mon', applicants: 12, quality: 82 },
        { date: 'Tue', applicants: 18, quality: 78 },
        { date: 'Wed', applicants: 25, quality: 85 },
        { date: 'Thu', applicants: 20, quality: 88 },
        { date: 'Fri', applicants: 32, quality: 80 },
        { date: 'Sat', applicants: 15, quality: 92 },
        { date: 'Sun', applicants: 10, quality: 85 },
    ];

    const distributionData = [
        { score: '0-20', count: 5, color: '#f43f5e' },
        { score: '21-40', count: 12, color: '#f59e0b' },
        { score: '41-60', count: 28, color: '#8b5cf6' },
        { score: '61-80', count: 45, color: '#6366f1' },
        { score: '81-100', count: 20, color: '#10b981' },
    ];

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Hiring Analytics</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">Deep dive into your organization&apos;s screening performance.</p>
                </div>

                <Button
                    onClick={handleExportReport}
                    className="rounded-2xl gap-2 font-bold h-12 w-12 sm:w-auto p-0 sm:px-4"
                    title="Export Report"
                >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export Report</span>
                </Button>
            </div>

            {/* Quick KPIs - Matching Dashboard Design */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Efficiency Gain", value: "85%", sub: "AI handles screening", icon: Zap, trend: "+12%", iconBg: "text-emerald-500 fill-emerald-500/20" },
                    { label: "Avg Candidate Merit", value: "72%", sub: "Top 30% of market", icon: Target, trend: "+3%", iconBg: "text-blue-500 fill-blue-500/20" },
                    { label: "Time Saved", value: "148h", sub: "This month alone", icon: Calendar, trend: "+25%", iconBg: "text-amber-500 fill-amber-500/20" },
                ].map((kpi, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                    >
                        <div className="bg-card/85 dark:bg-card/75 backdrop-blur-md rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-32">
                            {/* Background Icon */}
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                                <kpi.icon className={`h-24 w-24 ${kpi.iconBg}`} />
                            </div>

                            {/* Trend Badge */}
                            <div className="flex justify-end relative z-10">
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-inset ring-emerald-500/20">
                                    {kpi.trend}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <p className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground mb-1 tabular-nums">{kpi.value}</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{kpi.label}</p>
                                <p className="text-[9px] font-bold text-muted-foreground/60 mt-1">{kpi.sub}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>


            {/* Charts Area - Matching Student Dashboard Responsive Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="w-full aspect-square">
                    <Card className="bg-card/40 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-[2.5rem] h-full flex flex-col">
                        <CardHeader className="p-0 mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg sm:text-xl font-black tracking-tight">Application Velocity</CardTitle>
                                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1">Daily candidate flow tracking</p>
                            </div>
                            <div className="flex gap-1 bg-background/50 p-1 rounded-xl">
                                <Button
                                    size="sm"
                                    variant={selectedPeriod === '7D' ? "secondary" : "ghost"}
                                    className="h-7 text-[10px] font-black rounded-lg"
                                    onClick={() => setSelectedPeriod('7D')}
                                >
                                    7D
                                </Button>
                                <Button
                                    size="sm"
                                    variant={selectedPeriod === '30D' ? "secondary" : "ghost"}
                                    className="h-7 text-[10px] font-black rounded-lg"
                                    onClick={() => setSelectedPeriod('30D')}
                                >
                                    30D
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: '#fff'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="applicants"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorApplicants)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="w-full aspect-square">
                    <Card className="bg-card/40 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-[2.5rem] h-full flex flex-col">
                        <CardHeader className="p-0 mb-4 sm:mb-8">
                            <CardTitle className="text-lg sm:text-xl font-black tracking-tight">Merit Distribution</CardTitle>
                            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1">Global score frequency across all campaigns</p>
                        </CardHeader>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distributionData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                    <XAxis
                                        dataKey="score"
                                        stroke="#888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#88888810' }}
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '16px',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Campaign Performance Table - Horizontal Scrolling Simple UI */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-foreground">Link Performance</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top active campaigns</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-black rounded-xl hover:bg-primary/5 text-primary"
                        onClick={() => router.push('/recruiter/campaigns')}
                    >
                        View all links
                    </Button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {campaigns.length > 0 ? (
                        campaigns.slice(0, 8).map((campaign, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="min-w-[240px] flex-shrink-0"
                            >
                                <div className="bg-card/40 backdrop-blur-md border border-border/50 p-5 rounded-[2rem] hover:border-primary/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Target className="h-12 w-12 text-primary rotate-12" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                                {i + 1}
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                Active
                                            </span>
                                        </div>

                                        <h4 className="font-black text-sm text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                            {campaign.title}
                                        </h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-4 line-clamp-1">
                                            {campaign.position}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/20">
                                            <div>
                                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase">Volume</p>
                                                <p className="text-sm font-black text-foreground">{campaign.applicant_count || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase">Avg Score</p>
                                                <p className="text-sm font-black text-primary">{campaign.avg_score || 0}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="w-full py-8 text-center text-muted-foreground italic text-sm">
                            No active campaigns found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
