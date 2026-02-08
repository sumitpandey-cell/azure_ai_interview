"use client";

import { useEffect, useState } from "react";
import {
    BarChart3,
    PieChart,
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    Target,
    Zap,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";
import { useRecruiterStore } from "@/stores";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
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

export default function AnalyticsPage() {
    const { user } = useAuth();
    const { campaigns, loading, fetchDashboardData } = useRecruiterStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (user) fetchDashboardData(user.id);
    }, [user, fetchDashboardData]);

    if (!isMounted || loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <PremiumLogoLoader text="Crunching numbers..." />
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
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Hiring Analytics</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">Deep dive into your organization's screening performance.</p>
                </div>

                <Button className="rounded-2xl gap-2 font-bold h-12">
                    <Download className="h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Efficiency Gain", value: "85%", sub: "AI handles screening", icon: Zap, trend: "+12%" },
                    { label: "Avg Candidate Merit", value: "72%", sub: "Top 30% of market", icon: Target, trend: "+3%" },
                    { label: "Time Saved", value: "148h", sub: "This month alone", icon: Calendar, trend: "+25%" },
                ].map((kpi, i) => (
                    <Card key={i} className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <kpi.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{kpi.trend}</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-foreground mb-1">{kpi.value}</p>
                        <p className="text-sm font-bold text-muted-foreground">{kpi.label}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 mt-3 uppercase tracking-widest">{kpi.sub}</p>
                    </Card>
                ))}
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem]">
                    <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight">Application Velocity</CardTitle>
                            <p className="text-xs font-bold text-muted-foreground mt-1">Daily candidate flow tracking</p>
                        </div>
                        <div className="flex gap-1 bg-background/50 p-1 rounded-xl">
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black rounded-lg">7D</Button>
                            <Button size="sm" variant="secondary" className="h-7 text-[10px] font-black rounded-lg">30D</Button>
                        </div>
                    </CardHeader>
                    <div className="h-[300px] w-full">
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

                <Card className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem]">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-black tracking-tight">Merit Distribution</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground mt-1">Global score frequency across all campaigns</p>
                    </CardHeader>
                    <div className="h-[300px] w-full">
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

            {/* Campaign Performance Table */}
            <Card className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2.5rem]">
                <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Link Performance</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground mt-1">Comparing results across active campaigns</p>
                    </div>
                    <Button variant="ghost" className="text-xs font-black">View All</Button>
                </CardHeader>
                <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-border/20 group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-foreground">{campaign.title}</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{campaign.position}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-muted-foreground opacity-40 mb-1 uppercase">Volume</p>
                                    <p className="text-sm font-black text-foreground">{campaign.applicant_count || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground opacity-40 mb-1 uppercase">Avg Merit</p>
                                    <p className="text-sm font-black text-primary">{campaign.avg_score || 0}%</p>
                                </div>
                                <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden hidden md:block">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${campaign.avg_score || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
