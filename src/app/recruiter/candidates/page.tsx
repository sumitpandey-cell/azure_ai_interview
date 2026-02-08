"use client";

import { useEffect, useState } from "react";
import { campaignService } from "@/services/recruiter/campaign.service";
import {
    Users,
    Search,
    Filter,
    ArrowUpDown,
    MoreHorizontal,
    FileText,
    ExternalLink,
    Mail,
    CheckCircle2,
    XCircle,
    Calendar,
    ArrowUpRight
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
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
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
            setCandidates(data);
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
        <div className="h-[80vh] flex items-center justify-center">
            <PremiumLogoLoader text="Analyzing Talent Pool..." />
        </div>
    );

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Talent Pool</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">
                        Unified view of all candidates across your {candidates.length} interview campaigns.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name, email, or role..."
                            className="pl-11 h-12 rounded-2xl bg-card/40 border-border/50 focus-visible:ring-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 w-12 rounded-2xl border-border/50 bg-card/40 p-0">
                                <Filter className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                            <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Candidates</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("in_progress")}>In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("shortlisted")}>Shortlisted</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Pool", value: candidates.length, color: "indigo" },
                    { label: "Top Merits", value: candidates.filter(c => (c.score || 0) >= 80).length, color: "emerald" },
                    { label: "In Review", value: candidates.filter(c => c.status === "in_progress").length, color: "amber" },
                    { label: "Hired Rate", value: "12%", color: "primary" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-3xl">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={cn("text-3xl font-black tabular-nums", `text-${stat.color}-500 font-black`)}>{stat.value}</p>
                    </Card>
                ))}
            </div>

            {/* Candidates List */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredCandidates.map((candidate, idx) => (
                        <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div
                                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer relative overflow-hidden"
                                onClick={() => router.push(`/recruiter/reports/${candidate.id}`)}
                            >
                                {/* Left Side: Candidate Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-base shrink-0 group-hover:scale-105 transition-transform">
                                        {candidate.candidate_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{candidate.candidate_name || 'Anonymous Candidate'}</h3>
                                            <Badge className={cn(
                                                "rounded-full px-2 h-5 font-black text-[9px] uppercase border-0 hidden sm:flex",
                                                candidate.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                                                    candidate.status === 'in_progress' ? "bg-amber-500/10 text-amber-600" :
                                                        "bg-slate-500/10 text-slate-500"
                                            )}>
                                                {candidate.status?.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 truncate">
                                                <Mail className="h-3 w-3" />
                                                {candidate.candidate_email}
                                            </div>
                                            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                {candidate.campaign?.title || 'External Link'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Metrics & Actions */}
                                <div className="flex items-center justify-between lg:justify-end gap-6 lg:gap-10 border-t lg:border-t-0 border-slate-50 dark:border-slate-800 pt-3 lg:pt-0">
                                    {/* Merit Score */}
                                    <div className="flex flex-col lg:items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0.5 lg:text-right">AI Merit</span>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className={cn(
                                                "text-lg font-black tabular-nums",
                                                (candidate.score || 0) >= 80 ? "text-emerald-500" :
                                                    (candidate.score || 0) >= 60 ? "text-indigo-500" : "text-amber-500"
                                            )}>
                                                {candidate.score || '--'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-300">%</span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="hidden sm:flex flex-col lg:items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0.5">Applied</span>
                                        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            {new Date(candidate.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>

                                    {/* Link Action */}
                                    <Button
                                        variant="ghost"
                                        className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredCandidates.length === 0 && (
                    <div className="py-20 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground">No matches found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
