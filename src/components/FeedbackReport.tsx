"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-duration";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Copy,
    Timer,
    Shield,
    Award,
    Activity,
    Star,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Target,
    Download,
    Trash2
} from "lucide-react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { downloadHTMLReport } from "@/lib/report-download";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ReportRadarChart = dynamic(() => import("@/components/ReportRadarChart").then(mod => mod.ReportRadarChart), {
    loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/20 rounded-xl" />,
    ssr: false
});

interface Skill {
    name: string;
    score: number;
    feedback: string;
}

interface TranscriptMessage {
    id: string | number;
    speaker: string;
    text: string;
    timestamp: string;
}

export interface FeedbackReportData {
    id?: string;
    candidateName: string;
    position: string;
    interviewType?: string;
    overallScore: number;
    date: string;
    durationSeconds?: number;
    executiveSummary: string;
    rankGrade: string;
    strengths: string[];
    improvements: string[];
    overallSkills: Skill[];
    technicalSkills: Skill[];
    actionPlan: string[];
    transcript: TranscriptMessage[];
}

interface FeedbackReportProps {
    data: FeedbackReportData;
    isRecruiterView?: boolean;
    onGenerateRoadmap?: () => void;
    onDelete?: () => void;
    themeKey?: string | number;
}

export function FeedbackReport({
    data,
    isRecruiterView = false,
    onGenerateRoadmap,
    onDelete,
    themeKey = "default"
}: FeedbackReportProps) {

    const copyTranscriptToClipboard = async () => {
        try {
            const transcriptText = data.transcript
                .map((msg) => {
                    const speaker = msg.speaker === 'ai' ? 'AI Interviewer' : 'Candidate';
                    const timestamp = msg.timestamp ? ` [${msg.timestamp}]` : '';
                    return `${speaker}${timestamp}:\n${msg.text}`;
                })
                .join('\n\n---\n\n');

            await navigator.clipboard.writeText(transcriptText);
            toast.success("Transcript copied to clipboard!");
        } catch (error) {
            toast.error("Failed to copy transcript");
            console.error("Copy error:", error);
        }
    };

    const downloadReport = () => {
        try {
            downloadHTMLReport(data);
            toast.success("Report downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download report");
            console.error("Download error:", error);
        }
    };

    return (
        <div className="w-full relative space-y-8">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-none">
                        {data.candidateName} <span className="text-primary italic">Reports</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                                {data.position}
                            </span>
                        </div>
                        {data.interviewType && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border shadow-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                    {data.interviewType.replace('_', ' ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                        onClick={downloadReport}
                        variant="outline"
                        className="flex-1 sm:flex-none h-11 px-6 rounded-2xl bg-card border-border hover:bg-muted/50 text-foreground font-black uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Insights
                    </Button>

                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm shrink-0 active:scale-95"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Delete Report?</AlertDialogTitle>
                                    <AlertDialogDescription className="font-medium">
                                        This will permanently remove the analysis for <span className="text-foreground font-bold">{data.candidateName}</span>. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        Delete Forever
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Score & Summary Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Score Card */}
                <Card className="xl:col-span-1 border border-border/80 dark:border-white/5 shadow-lg bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-5 text-center">
                        <div className="relative h-32 w-32 sm:h-40 sm:w-40 group-hover:scale-105 transition-all duration-1000">
                            <svg className="h-full w-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" className="fill-none stroke-black/5 dark:stroke-white/5" strokeWidth="8" />
                                <circle cx="50" cy="50" r="42" strokeLinecap="round" className={cn(
                                    "fill-none transition-all duration-1500 ease-out",
                                    data.overallScore >= 80 ? "stroke-emerald-500" : data.overallScore >= 60 ? "stroke-primary" : "stroke-rose-500"
                                )} strokeWidth="8" strokeDasharray={`${data.overallScore * 2.639}, 263.9`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl sm:text-5xl font-black text-foreground tabular-nums tracking-tighter">{data.overallScore}</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">Overall Score</span>
                            </div>
                        </div>
                        <div className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border shadow-xl backdrop-blur-xl",
                            data.overallScore >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500"
                        )}>
                            {data.overallScore >= 70 ? 'Strong Match' : 'Improvement Recommended'}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Card */}
                <Card className="xl:col-span-3 border border-border/80 dark:border-white/5 shadow-lg bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden relative">
                    <CardContent className="p-6 md:p-8 relative z-10">
                        <div className="flex flex-col h-full gap-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-foreground">
                                        {isRecruiterView ? "Recruiter Summary" : "Executive Summary"}
                                    </h3>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.4em]">Detailed Assessment</p>
                                </div>
                                <div className="hidden sm:flex gap-4 px-4 py-2 rounded-xl bg-muted/30 border border-border backdrop-blur-xl">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Date</span>
                                        <span className="text-xs font-black text-foreground/80">{data.date}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm md:text-base font-bold leading-relaxed italic border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r-xl">
                                &quot;{data.executiveSummary}&quot;
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border">
                                {[
                                    { label: "Duration", value: formatDuration(data.durationSeconds || 0), icon: Timer, color: "text-amber-500" },
                                    { label: "Skills", value: data.overallSkills.length, icon: Target, color: "text-primary" },
                                    { label: "AI Messages", value: data.transcript.filter(m => m.speaker === 'ai').length, icon: MessageSquare, color: "text-blue-500" },
                                    { label: "Rank", value: data.rankGrade, icon: Award, color: "text-emerald-500" }
                                ].map((m, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={cn("h-10 w-10 rounded-xl bg-muted flex items-center justify-center border border-border", m.color)}>
                                            <m.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{m.label}</span>
                                            <span className="text-xs font-black text-foreground uppercase">{m.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Tabs */}
            <Tabs defaultValue="insights" className="w-full">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-14 mb-8 inline-flex border border-border backdrop-blur-3xl shadow-xl overflow-x-auto no-scrollbar max-w-full">
                    <TabsTrigger value="insights" className="rounded-xl px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all">Analysis</TabsTrigger>
                    <TabsTrigger value="skills" className="rounded-xl px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all">Skills</TabsTrigger>
                    <TabsTrigger value="transcript" className="rounded-xl px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all">Transcript</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-8 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border border-border shadow-md bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden">
                            <CardHeader className="p-6 pb-0">
                                <h3 className="text-xl font-bold flex items-center gap-3 uppercase text-emerald-500">
                                    <Shield className="h-5 w-5" /> Key Strengths
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                {data.strengths.map((item, i) => (
                                    <div key={i} className="flex gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <p className="text-xs font-bold text-foreground/80">{item}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-md bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden">
                            <CardHeader className="p-6 pb-0">
                                <h3 className="text-xl font-bold flex items-center gap-3 uppercase text-rose-500">
                                    <Activity className="h-5 w-5" /> Dev Areas
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                {data.improvements.map((item, i) => (
                                    <div key={i} className="flex gap-3 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                        <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                        <p className="text-xs font-bold text-foreground/80">{item}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {!isRecruiterView && onGenerateRoadmap && (
                        <Card className="border border-primary/20 shadow-lg bg-primary/5 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
                                    <Star className="h-12 w-12 text-primary" />
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-2xl font-bold uppercase">Self-Improvement Roadmaps</h3>
                                        <p className="text-muted-foreground">Ready to level up? Get a personalized learning path based on this interview.</p>
                                    </div>
                                    <Button onClick={onGenerateRoadmap} className="h-14 px-8 rounded-2xl bg-primary text-xs font-bold uppercase tracking-widest">
                                        Generate Roadmap <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isRecruiterView && data.actionPlan && data.actionPlan.length > 0 && (
                        <Card className="border border-primary/20 shadow-lg bg-primary/5 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-primary uppercase tracking-tight">
                                    Actionable Next Steps
                                </h3>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.actionPlan.map((item, i) => (
                                    <div key={i} className="flex gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                        <div className="h-6 w-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shrink-0">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-bold text-foreground/80">{item}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="skills" className="space-y-10 animate-in fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-1 border border-border shadow-md bg-card/40 backdrop-blur-3xl rounded-3xl p-6">
                            <h3 className="text-xl font-bold uppercase mb-6">Skill Map</h3>
                            <ReportRadarChart data={data.overallSkills} themeKey={themeKey} />
                        </Card>
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {data.overallSkills.map((skill: Skill, i: number) => (
                                <Card key={i} className="border border-border/50 bg-card/50 p-6 rounded-2xl">
                                    <div className="flex justify-between mb-4">
                                        <span className="font-bold uppercase text-sm">{skill.name}</span>
                                        <span className="font-bold text-primary">{skill.score}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-primary" style={{ width: `${skill.score}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{skill.feedback}</p>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {data.technicalSkills && data.technicalSkills.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold uppercase flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Technical Competencies
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.technicalSkills.map((skill, i) => (
                                    <Card key={i} className="border border-border/50 bg-card/50 p-6 rounded-2xl hover:bg-card/70 transition-colors">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold uppercase text-xs tracking-wide text-foreground/90">{skill.name}</span>
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
                                                    skill.score >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                        skill.score >= 40 ? "bg-primary/10 border-primary/20 text-primary" :
                                                            "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                                )}>
                                                    {skill.score}%
                                                </div>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full transition-all duration-1000 ease-out",
                                                        skill.score >= 70 ? "bg-emerald-500" :
                                                            skill.score >= 40 ? "bg-primary" :
                                                                "bg-rose-500"
                                                    )}
                                                    style={{ width: `${skill.score}%` }}
                                                />
                                            </div>
                                            {skill.feedback && (
                                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                                    {skill.feedback}
                                                </p>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="transcript" className="animate-in fade-in">
                    <Card className="border border-border bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                            <h3 className="text-xl font-bold uppercase">Transcript</h3>
                            <Button onClick={copyTranscriptToClipboard} variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest">
                                <Copy className="h-3.5 w-3.5 mr-2" />Copy
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {data.transcript.map((msg, i) => (
                                <div key={i} className={cn("flex flex-col gap-2 max-w-[85%] animate-in slide-in-from-bottom-2", msg.speaker === 'ai' ? "items-start" : "ml-auto items-end")}>
                                    <span className="text-[9px] font-bold uppercase opacity-50 px-2">{msg.speaker === 'ai' ? 'Interviewer' : data.candidateName}</span>
                                    <div className={cn("p-4 rounded-3xl text-sm leading-relaxed", msg.speaker === 'ai' ? "bg-muted rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none")}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

