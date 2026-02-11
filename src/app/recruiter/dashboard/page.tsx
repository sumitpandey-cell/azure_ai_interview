"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Activity,
    ArrowRight,
    Target,
    Users,
    Plus,
    Trophy,
    TrendingUp,
    ChevronRight,
    Zap,
    Settings,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecruiterStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarUrl } from "@/lib/avatar-utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RecruiterDashboard() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const {
        stats,
        campaigns,
        topCandidates,
        loading,
        fetchDashboardData
    } = useRecruiterStore();

    useEffect(() => {
        if (user) {
            fetchDashboardData(user.id);
        }
    }, [user, fetchDashboardData]);

    const greeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Good Morning";
        if (hours < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Top Toolbar / Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            Live Metrics
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {greeting()}, <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">{user?.user_metadata?.full_name?.split(' ')[0] || 'Recruiter'}</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm mt-1">
                        Your hiring pipeline is looking <span className="text-primary font-bold">active</span>.
                        Screening <span className="text-foreground font-bold">{stats.totalApplicants}</span> candidates across <span className="text-foreground font-bold">{campaigns.length}</span> links.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-center">
                    <div className="flex items-center gap-1.5 glass-panel p-1 rounded-xl mr-2">
                        <NotificationBell />
                        <ThemeToggle />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-border/50 hover:bg-muted/50 transition-all overflow-hidden">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={getAvatarUrl(user?.user_metadata?.avatar_url, user?.id || 'recruiter')} />
                                    <AvatarFallback>{getInitials(user?.user_metadata?.full_name)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 shadow-2xl">
                            <div className="px-3 py-2 border-b border-border/50">
                                <p className="text-sm font-bold truncate">{user?.user_metadata?.full_name || 'Recruiter'}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                            </div>
                            <DropdownMenuItem onClick={() => router.push('/recruiter/settings')} className="cursor-pointer gap-2 py-2">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer gap-2 py-2">
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/recruiter/campaigns/create">
                        <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-5 font-bold group">
                            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                            Create Link
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Links", value: stats.activeCampaigns, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { label: "Total Applicants", value: stats.totalApplicants, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                    { label: "Interviews (Week)", value: stats.interviewsThisWeek, icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                    { label: "Avg. Merit", value: `${stats.avgScore}%`, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                    >
                        <Card className="glass-card hover:border-primary/50 transition-all duration-500 rounded-2xl h-full relative overflow-hidden group">
                            <div className={cn("absolute right-0 top-0 w-24 h-24 blur-3xl opacity-20 transition-transform duration-700 group-hover:scale-150", stat.bg)} />
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-xl border", stat.bg, stat.border)}>
                                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                        <div className="flex items-baseline gap-2">
                                            {loading ? (
                                                <Skeleton className="h-7 w-12" />
                                            ) : (
                                                <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content: Pipeline */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h2 className="text-xl font-bold tracking-tight">Active Pipeline</h2>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/10 font-bold rounded-lg px-3">
                            <Link href="/recruiter/campaigns" className="flex items-center gap-1.5">
                                View all links <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-44 rounded-2xl border border-border/50" />
                                ))
                            ) : campaigns.length === 0 ? (
                                <Card className="col-span-full border-dashed border-2 py-16 flex flex-col items-center justify-center text-center bg-muted/5 rounded-2xl border-border/50">
                                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                                        <Zap className="h-8 w-8 text-primary opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-bold">No active screening links</h3>
                                    <p className="text-muted-foreground text-sm max-w-[280px] mt-2 mb-8">
                                        Launch your first AI-powered interview link to track candidate performance.
                                    </p>
                                    <Button asChild className="rounded-xl px-8 shadow-lg shadow-primary/20">
                                        <Link href="/recruiter/campaigns/create">Create My First Link</Link>
                                    </Button>
                                </Card>
                            ) : (
                                campaigns.slice(0, 4).map((campaign, idx) => (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 + 0.3 }}
                                    >
                                        <Card
                                            className="group glass-card hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 rounded-2xl cursor-pointer overflow-hidden"
                                            onClick={() => router.push(`/recruiter/campaigns`)}
                                        >
                                            <CardHeader className="p-5 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <Badge className={cn(
                                                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border-0",
                                                        campaign.is_active
                                                            ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20"
                                                            : "bg-slate-500/10 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                                                    )}>
                                                        {campaign.is_active ? "Live" : "Ended"}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground">
                                                        <Users className="h-4 w-4 text-primary" />
                                                        {campaign.applicant_count || 0}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mt-2">{campaign.title}</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{campaign.position}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-5 pt-3">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Success Index</span>
                                                        <span className="text-sm font-black text-primary">{campaign.avg_score || 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${campaign.avg_score || 0}%` }}
                                                            className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar: Top Performers */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <h2 className="text-xl font-bold tracking-tight">Top Merit</h2>
                    </div>

                    <Card className="glass-card rounded-2xl overflow-hidden shadow-sm border-none">
                        <CardHeader className="p-5 bg-primary/5 border-b border-white/5">
                            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Candidate Leaderboard</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-5 space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-3 w-20" />
                                                <Skeleton className="h-2 w-28" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : topCandidates.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="bg-muted/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <TrendingUp className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium italic">No results processed yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/20">
                                    {topCandidates.map((candidate, idx) => (
                                        <motion.div
                                            key={candidate.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 + 0.4 }}
                                            className="p-4 hover:bg-primary/5 transition-all cursor-pointer flex items-center gap-4 group"
                                            onClick={() => router.push(`/recruiter/candidates?search=${candidate.full_name}`)}
                                        >
                                            <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-xs">
                                                    {getInitials(candidate.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{candidate.full_name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase truncate">{candidate.campaign_title}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-amber-600 leading-none">{candidate.score}%</p>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">Merit</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-3 bg-muted/5 border-t border-border/20">
                            <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all" asChild>
                                <Link href="/recruiter/candidates" className="gap-2">
                                    Explore Talent Pool <ChevronRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
