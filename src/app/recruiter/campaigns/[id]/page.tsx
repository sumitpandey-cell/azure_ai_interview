"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { campaignService } from "@/services/recruiter/campaign.service";
import {
    ChevronLeft,
    Calendar,
    BarChart3,
    Users,
    Settings,
    Copy,
    CheckCircle2,
    Clock,
    User,
    Mail,
    ArrowUpRight,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function CampaignDetails() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCampaignDetails();
        }
    }, [id]);

    const fetchCampaignDetails = async () => {
        try {
            const data = await campaignService.getCampaignById(id as string);
            setCampaign(data);
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = () => {
        if (!campaign) return;
        const url = `${window.location.origin}/invite/${campaign.access_token}`;
        navigator.clipboard.writeText(url);
        toast.success("Invite link copied to clipboard!");
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 w-32 bg-slate-100 rounded-xl mb-4" />
                <div className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-40 bg-white rounded-3xl border border-slate-100 shadow-sm" />
                    <div className="h-40 bg-white rounded-3xl border border-slate-100 shadow-sm" />
                    <div className="h-40 bg-white rounded-3xl border border-slate-100 shadow-sm" />
                </div>
                <div className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-slate-500 font-medium">Campaign not found</p>
                <Button variant="ghost" className="rounded-xl gap-2 h-11 border-slate-200" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                    Go Back
                </Button>
            </div>
        );
    }

    const sessions = campaign.interview_sessions || [];
    const completedSessions = sessions.filter((s: any) => s.status === 'completed');
    const averageScore = completedSessions.length > 0
        ? Math.round(completedSessions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / completedSessions.length)
        : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Campaigns
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{campaign.title}</h1>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] tracking-widest px-3 py-1 mt-1">
                            ACTIVE
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                            {campaign.position}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Created {format(new Date(campaign.created_at), "MMM d, yyyy")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={copyInviteLink}
                        className="rounded-xl gap-2 h-12 bg-white border-slate-200 font-bold transition-all hover:bg-slate-50"
                    >
                        <Copy className="h-4 w-4" />
                        Copy Invite Link
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 px-6 h-12 shadow-lg shadow-indigo-200 font-bold">
                        <Settings className="h-4 w-4" />
                        Edit Campaign
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Candidates", value: sessions.length, icon: Users, color: "indigo" },
                    { label: "Interviews Done", value: completedSessions.length, icon: CheckCircle2, color: "emerald" },
                    { label: "Completion Rate", value: `${sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0}%`, icon: TrendingUp, color: "amber" },
                    { label: "Average Score", value: `${averageScore}%`, icon: BarChart3, color: "rose" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all duration-300">
                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            <div className="text-3xl font-black text-slate-900 leading-none">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Tabs / List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Applicant Tracking</h2>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {sessions.length} Candidates
                    </div>
                </div>

                <div className="space-y-3">
                    {sessions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                    <Users className="h-8 w-8 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-900 dark:text-white">No applicants yet</p>
                                    <p className="text-xs text-slate-500">Share your invite link to start receiving candidates.</p>
                                </div>
                                <Button variant="outline" className="rounded-xl h-9 text-xs font-bold" onClick={copyInviteLink}>
                                    Copy Invite Link
                                </Button>
                            </div>
                        </div>
                    ) : (
                        sessions.map((session: any) => (
                            <div
                                key={session.id}
                                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer relative overflow-hidden"
                                onClick={() => router.push(`/recruiter/reports/${session.id}`)}
                            >
                                {/* Left Side: Candidate Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-base shrink-0 group-hover:scale-105 transition-transform">
                                        {session.candidate_name?.charAt(0) || <User className="h-5 w-5 opacity-40" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{session.candidate_name || "Guest Applicant"}</h3>
                                            <Badge className={cn(
                                                "rounded-full px-2 h-5 font-black text-[9px] uppercase border-0 hidden sm:flex",
                                                session.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                                                    "bg-amber-500/10 text-amber-600"
                                            )}>
                                                {session.status === 'completed' ? 'Completed' : 'Ongoing'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-0.5 truncate">
                                            <Mail className="h-3 w-3" />
                                            {session.candidate_email || "PRIVATE@USER.COM"}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Metrics & Actions */}
                                <div className="flex items-center justify-between lg:justify-end gap-6 lg:gap-10 border-t lg:border-t-0 border-slate-50 dark:border-slate-800 pt-3 lg:pt-0">
                                    {/* Merit Score */}
                                    <div className="flex flex-col lg:items-end w-20">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0.5 lg:text-right">AI Merit</span>
                                        {session.score !== null ? (
                                            <div className="flex items-baseline gap-0.5">
                                                <span className={cn(
                                                    "text-lg font-black tabular-nums",
                                                    session.score >= 80 ? "text-emerald-500" :
                                                        session.score >= 60 ? "text-indigo-500" : "text-amber-500"
                                                )}>
                                                    {session.score}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-300">%</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Pending</span>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div className="hidden sm:flex flex-col lg:items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0.5">Joined</span>
                                        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            {format(new Date(session.created_at), "MMM d, HH:mm")}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        variant="ghost"
                                        className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                                        disabled={session.status !== 'completed'}
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
