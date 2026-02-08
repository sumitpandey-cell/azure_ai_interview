"use client";

import { useEffect, useState } from "react";
import { campaignService } from "@/services/recruiter/campaign.service";
import {
    Plus,
    Link as LinkIcon,
    Copy,
    ExternalLink,
    MoreVertical,
    PlusCircle,
    Target,
    Users,
    Clock,
    Calendar,
    Search,
    ChevronRight,
    Zap,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const data = await campaignService.getCampaigns();
            setCampaigns(data);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (token: string) => {
        const url = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Interview link copied!");
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.position?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <PremiumLogoLoader text="Refreshing Campaigns..." />
        </div>
    );

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-2xl">
                            <LinkIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Hiring Links</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">Create and manage your AI-powered interview invitation links.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search campaigns..."
                            className="pl-11 h-12 rounded-2xl bg-card/40 border-border/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Link href="/recruiter/campaigns/create">
                        <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-2 font-black shadow-xl shadow-indigo-100">
                            <PlusCircle className="h-5 w-5" />
                            Launch Campaign
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Campaign Strips */}
            <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredCampaigns.map((campaign, idx) => {
                        const isExpired = campaign.expiry_date && new Date(campaign.expiry_date) < new Date();
                        const isActive = campaign.is_active && !isExpired;

                        return (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <div
                                    className="group relative flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all rounded-2xl overflow-hidden cursor-pointer"
                                    onClick={() => router.push(`/recruiter/campaigns/${campaign.id}`)}
                                >
                                    {/* Icon & Status */}
                                    <div className="flex items-center gap-4 flex-1 w-full min-w-0">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                            isActive ? "bg-indigo-500/10 text-indigo-600" : "bg-slate-500/10 text-slate-500"
                                        )}>
                                            <Target className="h-6 w-6" />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate leading-none">{campaign.title}</h3>
                                                <Badge className={cn(
                                                    "rounded-full px-2 h-5 font-black text-[9px] uppercase border-0",
                                                    isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                                )}>
                                                    {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{campaign.position}</p>
                                        </div>
                                    </div>

                                    {/* Stats Strip */}
                                    <div className="flex items-center gap-8 px-8 border-l lg:border-x border-slate-50 dark:border-slate-800 h-10 hidden md:flex">
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{(campaign.interview_sessions || []).length}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Applicants</span>
                                        </div>
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{campaign.difficulty || 'Mid'}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Difficulty</span>
                                        </div>
                                    </div>

                                    {/* Expiry */}
                                    <div className="hidden xl:flex flex-col items-end min-w-[100px]">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0.5">Deadline</span>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                            <Calendar className="h-3.5 w-3.5 opacity-40" />
                                            {campaign.expiry_date ? new Date(campaign.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Perpetual'}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-50 lg:border-0">
                                        <Button
                                            variant="ghost"
                                            className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(campaign.access_token);
                                            }}
                                            title="Copy Invite Link"
                                        >
                                            <Copy className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl h-10 w-10 bg-slate-50 dark:bg-slate-800 shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100 shadow-xl">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/recruiter/candidates?search=${campaign.title}`);
                                                    }}
                                                    className="rounded-lg font-bold py-2"
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    View Applicants
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="rounded-lg font-bold py-2 text-rose-600"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Zap className="h-4 w-4 mr-2" />
                                                    Close Link
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <div className="flex-1 lg:hidden" />

                                        <Link href={`/recruiter/campaigns/${campaign.id}`} className="shrink-0">
                                            <Button variant="ghost" className="h-10 w-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredCampaigns.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 py-20 text-center space-y-4">
                        <Zap className="h-16 w-16 text-muted-foreground/10 mx-auto" />
                        <h3 className="text-xl font-bold text-foreground">No campaign links found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">Create a campaign to generate a link that you can share with your candidates.</p>
                        <Link href="/recruiter/campaigns/create">
                            <Button className="rounded-2xl h-12 px-8 font-black bg-indigo-600">
                                Launch Campaign
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
