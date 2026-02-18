"use client";

import { useEffect, useState } from "react";
import { campaignService } from "@/services/recruiter/campaign.service";
import {
    Users,
    Search,
    Filter,
    Mail,
    Calendar,
    ArrowUpRight,
    Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { InterviewSession } from "@/services/interview.service";
import type { Campaign } from "@/services/recruiter/campaign.service";

type Candidate = InterviewSession & { campaign: Campaign | null };

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const router = useRouter();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const data = await campaignService.getCandidates();
            setCandidates(data as unknown as Candidate[]);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch =
            c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.candidate_email?.toLowerCase().includes(search.toLowerCase()) ||
            c.campaign?.title?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterStatus === "all" || c.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 border border-primary/20 bg-primary/10 rounded-2xl" />
                        <Skeleton className="h-8 sm:h-10 w-48 rounded-xl" />
                    </div>
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
                <div className="flex items-center gap-3 self-start">
                    <Skeleton className="h-12 w-48 sm:w-64 rounded-2xl" />
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card/40 border border-border/50 p-5 rounded-[2.5rem] h-32 flex flex-col justify-between">
                        <div className="flex justify-end">
                            <Skeleton className="h-3 w-12 rounded-full" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-16 mb-1 rounded-lg" />
                            <Skeleton className="h-3 w-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-card/40 border border-border/50 p-5 rounded-3xl h-20 flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48 opacity-50" />
                        </div>
                        <div className="hidden sm:flex gap-8">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const stats = [
        { label: "Total Pool", value: candidates.length.toString(), icon: Users, color: "text-indigo-500", fill: "fill-indigo-500/10", trend: "Total" },
        { label: "Top Merits", value: candidates.filter(c => (c.score || 0) >= 80).length.toString(), icon: Target, color: "text-emerald-500", fill: "fill-emerald-500/10", trend: "+3%" },
        { label: "In Review", value: candidates.filter(c => c.status === "in_progress").length.toString(), icon: Calendar, color: "text-amber-500", fill: "fill-amber-500/10", trend: "Latest" },
        { label: "Hired Rate", value: "12%", icon: ArrowUpRight, color: "text-primary", fill: "fill-primary/10", trend: "+2%" },
    ];

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl shadow-inner">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Talent Pool</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm sm:text-base">
                        Unified view of all candidates across your <span className="text-foreground font-bold">{candidates.length}</span> interview campaigns.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Search talent..."
                            className="pl-11 h-12 rounded-2xl bg-card/60 backdrop-blur-md border-border/40 focus-visible:ring-primary/20 transition-all font-medium text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 w-12 shrink-0 rounded-2xl border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-all">
                                <Filter className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 bg-background/95 backdrop-blur-md border border-border/40 rounded-xl shadow-2xl">
                            <div className="px-3 py-2 border-b border-border/40 mb-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Filter Status</span>
                            </div>
                            {[
                                { id: "all", label: "All Candidates" },
                                { id: "completed", label: "Completed" },
                                { id: "in_progress", label: "In Progress" },
                                { id: "shortlisted", label: "Shortlisted" }
                            ].map(filter => (
                                <DropdownMenuItem
                                    key={filter.id}
                                    onClick={() => setFilterStatus(filter.id)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
                                        filterStatus === filter.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                                    )}
                                >
                                    {filter.label}
                                    {filterStatus === filter.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Cards Row - Matching Dashboard Design */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className="bg-card/85 dark:bg-card/75 backdrop-blur-md rounded-3xl p-5 border border-border/80 dark:border-border/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between h-32">
                            {/* Background Icon */}
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.06] group-hover:opacity-10 transition-opacity pointer-events-none">
                                <stat.icon className={cn("h-24 w-24", stat.color, stat.fill)} />
                            </div>

                            {/* Trend/Label Badge */}
                            <div className="flex justify-end relative z-10">
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded-full ring-1 ring-inset",
                                    stat.trend.startsWith('+')
                                        ? "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20"
                                        : "text-muted-foreground bg-muted/30 ring-border/50"
                                )}>
                                    {stat.trend}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <p className="text-3xl font-black tracking-tighter text-foreground mb-1 tabular-nums">{stat.value}</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Candidates List Row */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2 mb-1">
                    <h2 className="text-sm font-black text-muted-foreground uppercase tracking-wider">Candidate Directory</h2>
                    <span className="text-[10px] font-bold text-muted-foreground/50">Showing {filteredCandidates.length} results</span>
                </div>

                <AnimatePresence mode="popLayout">
                    {filteredCandidates.map((candidate, idx) => (
                        <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <div
                                className="group bg-card/60 backdrop-blur-sm border border-border/40 hover:border-primary/40 hover:bg-card/80 transition-all p-4 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative overflow-hidden active:scale-[0.99]"
                                onClick={() => router.push(`/recruiter/reports/${candidate.id}`)}
                            >
                                {/* Left Side: Candidate Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0 z-10">
                                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0 group-hover:bg-primary/20 transition-all ring-1 ring-primary/20">
                                        {candidate.candidate_name?.split(' ').map((n) => n[0]).join('') || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">{candidate.candidate_name || 'Anonymous Candidate'}</h3>
                                            <Badge className={cn(
                                                "rounded-full px-2 h-4 font-black text-[8px] uppercase border-0 ring-1 ring-inset",
                                                candidate.status === 'completed' ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" :
                                                    candidate.status === 'in_progress' ? "bg-amber-500/10 text-amber-600 ring-amber-500/20" :
                                                        "bg-muted text-muted-foreground ring-border/50"
                                            )}>
                                                {candidate.status?.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground truncate max-w-[180px]">
                                                <Mail className="h-3 w-3 opacity-70" />
                                                {candidate.candidate_email}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
                                                <div className="w-1 h-1 rounded-full bg-border" />
                                                <span className="truncate max-w-[120px]">{candidate.campaign?.title || 'External'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Metrics & Actions */}
                                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 border-t sm:border-t-0 border-border/20 pt-3 sm:pt-0 z-10">
                                    {/* Merit Score */}
                                    <div className="flex flex-col sm:items-end">
                                        <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tight mb-0.5">Merit Score</span>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className={cn(
                                                "text-xl font-black tabular-nums",
                                                (candidate.score || 0) >= 80 ? "text-emerald-500" :
                                                    (candidate.score || 0) >= 60 ? "text-primary" : "text-amber-500"
                                            )}>
                                                {candidate.score || '--'}
                                            </span>
                                            <span className="text-[9px] font-bold text-muted-foreground/30">%</span>
                                        </div>
                                    </div>

                                    {/* Date - hidden on smallest screens */}
                                    <div className="hidden min-[400px]:flex flex-col sm:items-end">
                                        <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tight mb-0.5">Date</span>
                                        <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 opacity-50" />
                                            {new Date(candidate.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        variant="ghost"
                                        className="h-9 w-9 rounded-xl bg-background/50 text-muted-foreground hover:bg-primary hover:text-white transition-all shrink-0"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredCandidates.length === 0 && (
                    <div className="py-24 text-center bg-card/20 backdrop-blur-sm rounded-[3rem] border border-dashed border-border/50">
                        <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground">No matches found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">We couldn&apos;t find any candidates matching your current search or filter criteria.</p>
                        <Button
                            variant="link"
                            className="mt-4 text-primary font-bold"
                            onClick={() => { setSearch(""); setFilterStatus("all"); }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
