"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-duration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, ChevronLeft, MessageSquare, Clock, Target, Award, Activity, Star, Timer, CheckCircle2, User, Mail, Briefcase, Shield, XCircle, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { interviewService } from "@/services/interview.service";
import { toast } from "sonner";
import { ReportPageSkeleton } from "@/components/ReportPageSkeleton";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReportRadarChart = dynamic(() => import("@/components/ReportRadarChart").then(mod => mod.ReportRadarChart), {
    loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/20 rounded-xl" />,
    ssr: false
});

export default function RecruiterInterviewReport() {
    const router = useRouter();
    const params = useParams();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : params.sessionId?.[0];
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);

    const fetchSession = useCallback(async () => {
        try {
            setLoading(true);
            if (sessionId) {
                const data = await interviewService.getSessionById(sessionId);
                if (data) {
                    setSession(data);
                } else {
                    toast.error("Session not found or access denied.");
                    router.push('/recruiter/dashboard');
                }
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load report.");
        } finally {
            setLoading(false);
        }
    }, [sessionId, router]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchSession();
        }
    }, [authLoading, user, fetchSession]);

    if (loading || authLoading) {
        return <ReportPageSkeleton />;
    }

    if (!session) return null;

    const feedback = (session.feedback as any)?.overall || session.feedback;
    const score = session.score || 0;
    const transcripts = (session.transcript as any[]) || [];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Bot className="h-5 w-5 text-indigo-600" />
                            Candidate Evaluation Report
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Candidate Summary Card */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="w-24 h-24 rounded-3xl bg-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-200">
                                {session.candidate_name?.charAt(0) || <User className="h-10 w-10" />}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{session.candidate_name || "Guest Candidate"}</h2>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg text-sm">
                                            <Mail className="h-4 w-4" />
                                            {session.candidate_email || "N/A"}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg text-sm">
                                            <Briefcase className="h-4 w-4" />
                                            {session.position} ({session.interview_type})
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg text-sm">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(session.created_at), "MMM d, yyyy HH:mm")}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg text-sm">
                                            <Timer className="h-4 w-4" />
                                            {formatDuration(session.duration_seconds || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[160px]">
                                <div className={cn(
                                    "text-5xl font-black mb-1",
                                    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-rose-600"
                                )}>
                                    {score}%
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Score</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="insights" className="w-full space-y-8">
                    <TabsList className="bg-white p-1 rounded-2xl h-14 border border-slate-200 shadow-sm inline-flex">
                        <TabsTrigger value="insights" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Evaluation</TabsTrigger>
                        <TabsTrigger value="transcript" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Transcript</TabsTrigger>
                    </TabsList>

                    <TabsContent value="insights" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Feedback & Skills */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Executive Summary for Recruiter */}
                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                                            <Target className="h-5 w-5 text-indigo-600" />
                                            Recruiter Summary
                                        </h3>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0">
                                        <p className="text-slate-600 leading-relaxed text-lg italic border-l-4 border-indigo-100 pl-6 py-2">
                                            {feedback?.executiveSummary || "Analysis in progress..."}
                                        </p>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Strengths */}
                                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden">
                                        <CardHeader className="p-8 pb-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600 uppercase tracking-tight">
                                                <Shield className="h-5 w-5" /> Key Strengths
                                            </h3>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-4">
                                            {feedback?.strengths?.map((item: string, i: number) => (
                                                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm font-bold text-slate-700">{item}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Improvements */}
                                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden">
                                        <CardHeader className="p-8 pb-4">
                                            <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600 uppercase tracking-tight">
                                                <XCircle className="h-5 w-5" /> Areas of Concern
                                            </h3>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-4">
                                            {feedback?.improvements?.map((item: string, i: number) => (
                                                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                                    <Activity className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm font-bold text-slate-700">{item}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Action Plan */}
                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600 uppercase tracking-tight">
                                            <Zap className="h-5 w-5" /> Actionable Next Steps
                                        </h3>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {feedback?.actionPlan?.map((item: string, i: number) => (
                                            <div key={i} className="flex gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                                <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{item}</p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Radar Chart & Metrics */}
                            <div className="space-y-8">
                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-indigo-600 text-white overflow-hidden">
                                    <CardHeader className="p-8 pb-0">
                                        <h3 className="text-xl font-bold uppercase tracking-tight">Skill Matrix</h3>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <ReportRadarChart
                                            data={feedback?.overallSkills?.map((s: any) => ({
                                                name: s.name,
                                                score: s.score
                                            })) || []}
                                            themeKey={sessionId || 'recruiter-report'}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Quick Insights */}
                                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white">
                                    <CardHeader className="p-8 pb-4">
                                        <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 uppercase tracking-tight">Engagement</h3>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-xl">
                                                    <MessageSquare className="h-4 w-4 text-slate-600" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Exchanges</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-900">{transcripts.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-xl">
                                                    <Activity className="h-4 w-4 text-slate-600" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Responses / Min</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-900">
                                                {session.duration_seconds && session.duration_seconds > 0
                                                    ? (transcripts.length / (session.duration_seconds / 60)).toFixed(1)
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {transcripts.map((msg, i) => (
                                        <div key={i} className={cn(
                                            "p-8 flex gap-6",
                                            msg.speaker === 'ai' ? "bg-slate-50/50" : "bg-white"
                                        )}>
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xs font-black",
                                                msg.speaker === 'ai' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                                            )}>
                                                {msg.speaker === 'ai' ? 'AI' : 'YOU'}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {msg.speaker === 'ai' ? 'Arjuna AI' : session.candidate_name || 'Candidate'}
                                                </div>
                                                <p className="text-slate-700 leading-relaxed font-medium">
                                                    {msg.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
