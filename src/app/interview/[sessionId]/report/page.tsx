"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-duration";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, ArrowRight, MessageSquare, Copy, Trash2, Clock, Play, RefreshCw, Target, Shield, Award, Activity, Star, Timer, XCircle, Download, CheckCircle2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useThemeKey } from "@/hooks/use-theme-key";
import { downloadHTMLReport } from "@/lib/report-download";
import { toast } from "sonner";
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
import { ReportPageSkeleton } from "@/components/ReportPageSkeleton";
import { ErrorSeverity, FeedbackError } from "@/lib/feedback-error";
import { useFeedback } from "@/context/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

interface InterviewSession {
    id: string;
    interview_type: string;
    position: string;
    score: number | null;
    status: string;
    created_at: string;
    duration_seconds: number | null;
    config?: Record<string, unknown>;
    feedback: Record<string, unknown>;
    transcript: Array<TranscriptMessage>;
}

interface TranscriptMessage {
    id: string | number;
    speaker: string;
    sender?: string;
    text: string;
    timestamp?: string;
}

interface BaseMessage {
    id?: string | number;
    speaker?: string;
    sender?: string;
    role?: string;
    text: string;
    timestamp?: string;
}

interface UserMetadata {
    full_name?: string;
    avatar_url?: string;
    gender?: string;
}

export default function InterviewReport() {
    const router = useRouter();
    const params = useParams();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : params.sessionId?.[0];
    const { user, loading: authLoading } = useAuth();
    const userMetadata = user?.user_metadata as UserMetadata | undefined;
    const [loading, setLoading] = useState(true);
    const { feedback: instantFeedback, transcript: instantTranscript, clearFeedback } = useInterviewStore();
    const { fetchSessionDetail, deleteInterviewSession } = useOptimizedQueries();
    const { generateFeedbackInBackground, isGenerating, currentSessionId: generatingSessionId } = useFeedback();
    const isSessionGenerating = isGenerating && generatingSessionId === sessionId;
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [feedbackTimeout, setFeedbackTimeout] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [errorState, setErrorState] = useState<FeedbackError | null>(null);
    const themeKey = useThemeKey();

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchSession = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            if (sessionId) {
                const data = await fetchSessionDetail(sessionId, forceRefresh);
                if (data) {
                    setSession(data as unknown as InterviewSession);
                } else {
                    toast.error("Interview session not found. Redirecting to dashboard.");
                    router.push("/dashboard");
                }
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load interview report. Redirecting to dashboard.");
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    }, [sessionId, fetchSessionDetail, router]);

    useEffect(() => {
        if (sessionId && !session) {
            // Initial load only if session is not already present
            fetchSession(false);
        }
    }, [sessionId, fetchSession, session]);

    const isFeedbackGenerating = session?.status === 'completed' &&
        !session?.feedback &&
        (!instantFeedback || !instantFeedback.skills || instantFeedback.skills.length === 0);

    useEffect(() => {
        if (!isFeedbackGenerating || !sessionId) return;

        const channel = supabase
            .channel(`session_feedback_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'interview_sessions',
                    filter: `id=eq.${sessionId}`
                },
                (payload) => {
                    const newData = payload.new as InterviewSession;
                    if (newData.feedback) {
                        setSession(newData);
                        setErrorState(null);
                        toast.success("Feedback report is ready!");
                    }
                }
            )
            .subscribe();

        const timeoutId = setTimeout(() => {
            if (isFeedbackGenerating) {
                setFeedbackTimeout(true);
                toast.error("Feedback generation is taking longer than expected.");
            }
        }, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearTimeout(timeoutId);
        };
    }, [isFeedbackGenerating, sessionId]);

    const mergeFeedback = (dbFeedback: Record<string, unknown> | null, instant: Record<string, unknown> | null): Record<string, unknown> => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant || {};
        if (!instant) return dbFeedback || {};

        const dbTs = dbFeedback.generatedAt ? Date.parse(String(dbFeedback.generatedAt)) : 0;
        const instTs = instant.generatedAt ? Date.parse(String(instant.generatedAt)) : 0;

        if (instTs >= dbTs) {
            return {
                ...dbFeedback,
                ...instant,
                generatedAt: instant.generatedAt || dbFeedback.generatedAt,
            };
        }
        return dbFeedback;
    };

    // Calculate all data needed for render
    let extractedFeedback = (session?.feedback || null) as Record<string, unknown> | null;
    if (extractedFeedback) {
        if (extractedFeedback.overall && typeof extractedFeedback.overall === 'object') {
            extractedFeedback = extractedFeedback.overall as Record<string, unknown>;
        } else if (Array.isArray(extractedFeedback.resumptions) && extractedFeedback.resumptions.length > 0) {
            if (!extractedFeedback.overall || Object.keys(extractedFeedback.overall as object).length === 0 || !extractedFeedback.executiveSummary) {
                extractedFeedback = extractedFeedback.resumptions[0] as Record<string, unknown>;
            }
        }
    }

    const feedbackData = mergeFeedback(extractedFeedback, (instantFeedback as unknown) as Record<string, unknown>);

    let dbTranscript = session?.transcript || [];
    if (typeof dbTranscript === 'string') {
        try {
            dbTranscript = JSON.parse(dbTranscript);
        } catch (e) {
            console.error("Failed to parse transcript string:", e);
            dbTranscript = [];
        }
    }
    const transcriptData = instantTranscript.length > 0 ? instantTranscript : (Array.isArray(dbTranscript) ? dbTranscript : []);

    const overallSkills = (Array.isArray(feedbackData.overallSkills) ? feedbackData.overallSkills : null) || (Array.isArray(feedbackData.skills) ? feedbackData.skills : null) || [
        { name: "Technical Knowledge", score: 0, feedback: "Analysis subset not available" },
        { name: "Communication", score: 0, feedback: "Analysis subset not available" },
        { name: "Problem Solving", score: 0, feedback: "Analysis subset not available" },
        { name: "Cultural Fit", score: 0, feedback: "Analysis subset not available" }
    ];

    const technicalSkills = (Array.isArray(feedbackData.technicalSkills) ? feedbackData.technicalSkills : null) || [];

    const calculateGrade = (score: number) => {
        if (score >= 95) return "A+";
        if (score >= 90) return "A";
        if (score >= 85) return "A-";
        if (score >= 80) return "B+";
        if (score >= 75) return "B";
        if (score >= 70) return "B-";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        return score > 0 ? "E" : "F";
    };

    const overallScore = session?.score || Math.round(overallSkills.reduce((acc: number, s: { score?: number }) => acc + (s.score || 0), 0) / (overallSkills.length || 1));

    const reportData = {
        candidateName: userMetadata?.full_name || "Candidate",
        position: session?.position || "Interview Report",
        overallScore: overallScore,
        date: session ? new Date(session.created_at).toLocaleString() : "-",
        executiveSummary: (typeof feedbackData.executiveSummary === 'string' ? feedbackData.executiveSummary : null) ||
            (typeof feedbackData.note === 'string' ? feedbackData.note : null) ||
            (typeof feedbackData.error === 'string' ? feedbackData.error : null) ||
            (session?.feedback && (session.feedback as Record<string, unknown>).note === 'string' ? (session.feedback as Record<string, unknown>).note as string : null) ||
            (session?.feedback && (session.feedback as Record<string, unknown>).error === 'string' ? (session.feedback as Record<string, unknown>).error as string : null) ||
            "The interview session has been recorded. Analysis insights are being processed based on your conversation.",
        rankGrade: calculateGrade(overallScore),
        strengths: (Array.isArray(feedbackData.strengths) ? feedbackData.strengths : null) || ["Analysis not available for this session"],
        improvements: (Array.isArray(feedbackData.improvements) ? feedbackData.improvements : null) || ["Analysis not available for this session"],
        overallSkills: overallSkills,
        technicalSkills: technicalSkills,
        skills: (Array.isArray(feedbackData.skills) ? feedbackData.skills : null) || overallSkills,
        actionPlan: (Array.isArray(feedbackData.actionPlan) ? feedbackData.actionPlan : null) || ["Wait for full AI report generation."],
        transcript: transcriptData.length > 0
            ? transcriptData
                .filter((msg: unknown) => {
                    const m = msg as BaseMessage;
                    return m && (m.speaker || m.sender || m.role) && m.text && m.text.trim();
                })
                .map((msg: unknown, i: number) => {
                    const m = msg as BaseMessage;
                    let cleanedText = m.text.trim();
                    const speakerRaw = (m.speaker || m.sender || m.role || 'candidate').toLowerCase();
                    const speaker = ['ai', 'agent', 'model', 'assistant'].includes(speakerRaw) ? 'ai' : 'user';
                    if (speaker === 'ai') {
                        cleanedText = cleanedText.replace(/\*\*[^*]+\*\*\s*/g, '');
                    }
                    return {
                        id: (m.id as string | number) || i,
                        speaker: speaker,
                        text: cleanedText,
                        timestamp: m.timestamp || '-'
                    } as TranscriptMessage;
                })
                .filter((msg: TranscriptMessage) => msg.text.trim())
            : [
                { id: 1, speaker: "ai", text: "No transcript available. The interview may not have contained any recorded conversation.", timestamp: "-" },
            ],
    };

    const copyTranscriptToClipboard = async () => {
        try {
            const transcriptText = reportData.transcript
                .map((msg: TranscriptMessage) => {
                    const speakerRaw = msg.speaker.toLowerCase();
                    const speaker = speakerRaw === 'ai' ? 'AI Interviewer' : 'Candidate';
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

    const handleDelete = async () => {
        if (!sessionId) return;
        try {
            await deleteInterviewSession(sessionId);
            toast.success("Report deleted successfully");
            router.push("/reports");
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to delete report");
        }
    };

    const downloadReport = () => {
        try {
            downloadHTMLReport(reportData);
            toast.success("Report downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download report");
            console.error("Download error:", error);
        }
    };

    const hasInstantFeedback = instantFeedback && instantFeedback.skills && Array.isArray(instantFeedback.skills) && instantFeedback.skills.length > 0;
    const isInProgress = session && session.status !== 'completed' && !hasInstantFeedback;

    return (
        <DashboardLayout>
            {(() => {
                if (!mounted) return <ReportPageSkeleton />;
                if (loading || authLoading) return <ReportPageSkeleton />;

                if (!session) {
                    return (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-foreground">Session not found</h2>
                            <Button onClick={() => router.push("/dashboard")} className="mt-4">
                                Back to Dashboard
                            </Button>
                        </div>
                    );
                }

                if ((isFeedbackGenerating || isSessionGenerating) && !feedbackTimeout && !errorState) {
                    return (
                        <>
                            <ReportPageSkeleton />
                            <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse z-50">
                                <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4" />
                                    <span className="text-sm font-medium">Analyzing interview...</span>
                                </div>
                            </div>
                        </>
                    );
                }

                if (isInProgress) {
                    return (
                        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
                            <div className="max-w-xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-3xl overflow-hidden rounded-[2.5rem]">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/50 to-amber-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
                                    <CardContent className="p-8 sm:p-12 text-center space-y-10">
                                        <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-yellow-500/10 rounded-3xl blur-2xl animate-pulse" />
                                            <div className="relative h-20 w-20 rounded-3xl bg-yellow-500/5 border border-yellow-500/20 flex items-center justify-center shadow-2xl shadow-yellow-500/10">
                                                < Clock className="h-10 w-10 text-yellow-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                                                Session In Progress
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tighter uppercase leading-none">
                                                Interview <span className="text-yellow-500">Incomplete</span>
                                            </h2>
                                            <p className="text-muted-foreground font-bold text-sm tracking-wide leading-relaxed max-w-sm mx-auto uppercase opacity-80">
                                                You haven&apos;t finished this interview yet. Complete it to unlock your detailed performance report and AI feedback.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <Button
                                                onClick={() => {
                                                    if (sessionId) {
                                                        const stage = (session.config as Record<string, unknown>)?.currentStage as string || 'avatar';
                                                        router.push(`/interview/${sessionId}/${stage}`);
                                                    }
                                                }}
                                                className="w-full h-16 bg-primary text-primary-foreground hover:opacity-90 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
                                            >
                                                <Play className="mr-2 h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
                                                Continue Interview
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => router.push("/dashboard")}
                                                className="group h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
                                            >
                                                <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                Return to Dashboard
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    );
                }

                if (errorState) {
                    const isRetryable = errorState.severity === ErrorSeverity.RETRYABLE;
                    const isFatal = errorState.severity === ErrorSeverity.FATAL;

                    return (
                        <div className="space-y-6 max-w-4xl mx-auto p-4">
                            <Card className={`border-2 ${isFatal ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
                                <CardContent className="p-8">
                                    <div className="flex flex-col items-center gap-6 text-center">
                                        <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isFatal ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                                            <XCircle className={`h-8 w-8 ${isFatal ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                                {isFatal ? 'Feedback Generation Failed' : 'Network Connection Issue'}
                                            </h2>
                                            <p className="text-muted-foreground max-w-md">{errorState.message}</p>
                                        </div>
                                        {isRetryable ? (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button onClick={() => { setErrorState(null); fetchSession(); }} className="bg-primary">
                                                    <RefreshCw className="mr-2 h-4 w-4" /> Retry Now
                                                </Button>
                                                <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 w-full max-w-md">
                                                <div className="bg-muted p-4 rounded-lg text-left">
                                                    <p className="text-xs font-semibold text-foreground mb-2">Technical Details:</p>
                                                    <p className="font-mono text-xs text-muted-foreground break-all">Session ID: {sessionId}</p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <Button onClick={() => { setErrorState(null); fetchSession(); }} variant="outline">
                                                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                }

                if (feedbackTimeout) {
                    return (
                        <div className="min-h-[80vh] flex items-center justify-center p-4">
                            <Card className="max-w-2xl w-full border-none shadow-2xl">
                                <CardContent className="p-8 md:p-12">
                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                                            <XCircle className="h-8 w-8 text-red-600" />
                                        </div>
                                        <div className="space-y-3">
                                            <h2 className="text-3xl font-bold text-red-600">Feedback Generation Delayed</h2>
                                            <p className="text-muted-foreground text-lg text-center">Feedback analysis is taking longer than expected. You can return to your dashboard and check back later, or try regenerating it.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                            <Button onClick={async () => { if (sessionId) { setFeedbackTimeout(false); clearFeedback(); await generateFeedbackInBackground(sessionId); await fetchSession(true); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <RefreshCw className="mr-2 h-4 w-4" /> Try Regenerating
                                            </Button>
                                            <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 sm:pt-0 overflow-x-hidden max-w-full">
                        <div className="relative mb-2">
                            <div className="flex flex-col sm:flex-row lg:items-end justify-between gap-4 sm:gap-6 relative z-10">
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="space-y-2">
                                        <h1 className="text-xl sm:text-2xl md:text-2xl font-bold tracking-tight text-foreground leading-[1.1]">
                                            {reportData.candidateName} <span className="text-primary">Reports</span>
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                                            <div className="px-4 py-1.5 rounded-full bg-card/80 dark:bg-card/40 backdrop-blur-3xl border border-border shadow-md dark:shadow-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">{reportData.position}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 dark:bg-muted/50 border border-border/80 dark:border-border shadow-sm">
                                                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,195,77,0.5)]" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{session.interview_type.replace('_', ' ')} Session</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 lg:pb-2">
                                    <Button onClick={downloadReport} className="h-9 sm:h-11 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl border border-border/80 dark:border-border hover:bg-card/90 dark:hover:bg-card/60 text-foreground font-black uppercase tracking-[0.15em] text-[10px] transition-all shadow-md dark:shadow-2xl group/btn">
                                        <Download className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                        <span className="hidden lg:inline">Export Insights</span>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl flex items-center justify-center p-0 shrink-0">
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl border border-border shadow-3xl p-6 sm:p-10 bg-card/90 backdrop-blur-3xl max-w-[90vw] sm:max-w-lg">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground">Delete Feedback Report?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-muted-foreground font-medium">This action will permanently remove this feedback analysis from your profile. This data cannot be recovered.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-6 sm:mt-8 gap-3 sm:gap-4 flex-col sm:flex-row">
                                                <AlertDialogCancel className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-muted hover:bg-muted/80 text-foreground">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20">Confirm Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <div className="absolute -left-24 -top-24 h-[400px] w-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                            <div className="absolute right-0 top-0 h-[300px] w-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                            <Card className="xl:col-span-1 border border-border/80 dark:border-white/5 shadow-lg dark:shadow-3xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative group">
                                <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center h-full gap-5 sm:gap-6 text-center relative z-10">
                                    <div className="relative h-28 w-28 sm:h-40 sm:w-40 group-hover:scale-105 transition-all duration-1000">
                                        <svg className="h-full w-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" className="fill-none stroke-black/5 dark:stroke-white/5" strokeWidth="8" />
                                            <circle cx="50" cy="50" r="42" strokeLinecap="round" className={cn("fill-none transition-all duration-1500 ease-out", reportData.overallScore >= 80 ? "stroke-emerald-500" : reportData.overallScore >= 60 ? "stroke-primary" : "stroke-rose-500")} strokeWidth="8" strokeDasharray={`${reportData.overallScore * 2.639}, 263.9`} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl sm:text-5xl font-black text-foreground tabular-nums tracking-tighter">{reportData.overallScore}</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">Overall Score</span>
                                        </div>
                                    </div>
                                    <div className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border shadow-xl backdrop-blur-xl", reportData.overallScore >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500")}>
                                        {reportData.overallScore >= 70 ? 'Strong Match' : 'Improvement Recommended'}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="xl:col-span-3 border border-border/80 dark:border-white/5 shadow-lg dark:shadow-3xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative">
                                <CardContent className="p-6 md:p-8 relative z-10">
                                    <div className="flex flex-col h-full gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-foreground">Executive Summary</h3>
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-[0.4em]">Detailed Assessment</p>
                                            </div>
                                            <div className="hidden sm:flex gap-4 px-4 py-2 rounded-xl bg-muted/30 border border-border backdrop-blur-xl">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Date</span>
                                                    <span className="text-xs font-black text-foreground/80">{reportData.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm md:text-base font-bold leading-relaxed italic border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r-xl">
                                            &quot;{reportData.executiveSummary}&quot;
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border">
                                            {[
                                                { label: "Duration", value: formatDuration(session.duration_seconds || 0), icon: Timer, color: "text-amber-500" },
                                                { label: "Skills", value: reportData.overallSkills.length, icon: Target, color: "text-primary" },
                                                { label: "AI Messages", value: reportData.transcript.filter(m => m.speaker === 'ai').length, icon: MessageSquare, color: "text-blue-500" },
                                                { label: "Rank", value: reportData.rankGrade, icon: Award, color: "text-emerald-500" }
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

                        <Tabs defaultValue="insights" className="w-full">
                            <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-14 mb-8 inline-flex border border-border backdrop-blur-3xl shadow-xl overflow-x-auto no-scrollbar max-w-full">
                                <TabsTrigger value="insights" className="rounded-2xl px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all">Analysis</TabsTrigger>
                                <TabsTrigger value="skills" className="rounded-2xl px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all">Skills</TabsTrigger>
                                <TabsTrigger value="transcript" className="rounded-2xl px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all">Transcript</TabsTrigger>
                            </TabsList>

                            <TabsContent value="insights" className="space-y-8 animate-in fade-in slide-in-from-top-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <Card className="border border-border shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl overflow-hidden relative">
                                        <CardHeader className="p-6 pb-0">
                                            <h3 className="text-xl font-bold flex items-center gap-3 uppercase text-emerald-500">
                                                <Shield className="h-5 w-5" /> Key Strengths
                                            </h3>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-3">
                                            {reportData.strengths.map((item, i) => (
                                                <div key={i} className="flex gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    <p className="text-xs font-bold text-foreground/80">{item}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    <Card className="border border-border shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl overflow-hidden relative">
                                        <CardHeader className="p-6 pb-0">
                                            <h3 className="text-xl font-bold flex items-center gap-3 uppercase text-rose-500">
                                                <Activity className="h-5 w-5" /> Dev Areas
                                            </h3>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-3">
                                            {reportData.improvements.map((item, i) => (
                                                <div key={i} className="flex gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                                    <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                                    <p className="text-xs font-bold text-foreground/80">{item}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="border border-primary/20 shadow-lg bg-primary/5 backdrop-blur-3xl rounded-3xl overflow-hidden">
                                    <CardContent className="p-8">
                                        <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
                                            <Star className="h-12 w-12 text-primary" />
                                            <div className="flex-1 space-y-2">
                                                <h3 className="text-2xl font-bold uppercase">Self-Improvement Roadmaps</h3>
                                                <p className="text-muted-foreground">Ready to level up? Get a personalized learning path based on this interview.</p>
                                            </div>
                                            <Button onClick={() => router.push('/roadmap')} className="h-14 px-8 rounded-xl bg-primary text-xs font-bold uppercase tracking-widest">
                                                Generate Roadmap <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="skills" className="space-y-10 animate-in fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <Card className="lg:col-span-1 border border-border shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl p-6">
                                        <h3 className="text-xl font-bold uppercase mb-6">Skill Map</h3>
                                        <ResponsiveContainer width="100%" height={300} key={themeKey}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportData.overallSkills}>
                                                <PolarGrid stroke="hsl(var(--border))" opacity={0.5} />
                                                <PolarAngleAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} />
                                                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {reportData.overallSkills.map((skill, i) => (
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
                            </TabsContent>

                            <TabsContent value="transcript" className="animate-in fade-in">
                                <Card className="border border-border bg-card/40 backdrop-blur-3xl rounded-2xl overflow-hidden">
                                    <CardHeader className="p-6 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                                        <h3 className="text-xl font-bold uppercase">Transcript</h3>
                                        <Button onClick={copyTranscriptToClipboard} variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest"><Copy className="h-3.5 w-3.5 mr-2" />Copy</Button>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                                        {reportData.transcript.map((msg, i) => (
                                            <div key={i} className={cn("flex flex-col gap-2 max-w-[80%] animate-in slide-in-from-bottom-2", msg.speaker === 'ai' ? "items-start" : "ml-auto items-end")}>
                                                <span className="text-[9px] font-bold uppercase opacity-50 px-2">{msg.speaker === 'ai' ? 'Interviewer' : 'You'}</span>
                                                <div className={cn("p-4 rounded-2xl text-sm leading-relaxed", msg.speaker === 'ai' ? "bg-muted rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none")}>
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
            })()}
        </DashboardLayout>
    );
}
