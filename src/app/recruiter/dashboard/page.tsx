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
    LogOut,
    Share2,
    Sparkles
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
        if (hours < 12) return "Morning";
        if (hours < 18) return "Afternoon";
        return "Evening";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Header Section - Greeting and Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/50">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground">System Active</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
                        Good {greeting()},{' '}
                        <span className="text-primary">
                            {user?.user_metadata?.full_name?.split(' ')[0] || 'Recruiter'}
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Screening {stats.totalApplicants} candidates across {campaigns.length} links
                    </p>
                </div>

                {/* Desktop Header Controls */}
                <div className="hidden lg:flex items-center gap-2 p-1.5 bg-background/60 backdrop-blur-md border border-border/40 rounded-full shadow-sm">
                    <div className="flex items-center gap-1 px-2 border-r border-border/40 h-8">
                        <NotificationBell />
                        <ThemeToggle />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 hover:bg-accent border border-border/40 rounded-full transition-all duration-300 group">
                                <Avatar className="h-8 w-8 border border-border/40 shadow-sm transition-transform group-hover:scale-105">
                                    <AvatarImage src={getAvatarUrl(user?.user_metadata?.avatar_url, user?.id || 'recruiter')} />
                                    <AvatarFallback className="text-xs font-bold">{getInitials(user?.user_metadata?.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                        {user?.user_metadata?.full_name?.split(' ')[0] || "Recruiter"}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">Account</span>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="px-3 py-2 mb-1 border-b border-border/40">
                                <p className="text-sm font-bold truncate text-foreground">{user?.user_metadata?.full_name || 'Recruiter'}</p>
                                <p className="text-[10px] font-medium truncate text-muted-foreground">{user?.email}</p>
                            </div>
                            <DropdownMenuItem onClick={() => router.push('/recruiter/settings')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* Add share functionality */ }} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                                <Share2 className="h-4 w-4" />
                                <span>Share Platform</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 border-border/40" />
                            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive">
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/recruiter/campaigns/create">
                        <Button className="h-9 px-4 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                            <Plus className="h-4 w-4 mr-1 transition-transform group-hover:rotate-90" />
                            Create Link
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid - Matching Student Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Links", value: stats.activeCampaigns, icon: Target, color: "text-blue-500", iconBg: "text-blue-500 fill-blue-500/20" },
                    { label: "Total Applicants", value: stats.totalApplicants, icon: Users, color: "text-indigo-500", iconBg: "text-indigo-500 fill-indigo-500/20" },
                    { label: "Interviews (Week)", value: stats.interviewsThisWeek, icon: Activity, color: "text-rose-500", iconBg: "text-rose-500 fill-rose-500/20" },
                    { label: "Avg. Merit", value: `${stats.avgScore}%`, icon: Trophy, color: "text-amber-500", iconBg: "text-amber-500 fill-amber-500/20" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                    >
                        <div className="bg-card/85 dark:bg-card/75 backdrop-blur-md rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-20">
                            <div className={cn("absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none")}>
                                <stat.icon className={cn("h-20 w-20", stat.iconBg)} />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider relative z-10">{stat.label}</span>
                            <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter relative z-10">
                                {loading ? <Skeleton className="h-8 w-12 bg-muted/50 rounded-lg" /> : stat.value}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content: Pipeline */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-end justify-between px-1 pb-2 border-b border-border/40">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <div className="h-1 w-8 bg-primary rounded-full" />
                                Active Pipeline
                            </h3>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium text-xs gap-1">
                            <Link href="/recruiter/campaigns" className="flex items-center gap-1.5">
                                View all links <ArrowRight className="h-3 w-3" />
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
