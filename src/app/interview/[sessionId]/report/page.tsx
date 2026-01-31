"use client";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-duration";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, ArrowRight, MessageSquare, Copy, Trash2, Clock, Play, Code, RefreshCw, AlertTriangle, Target, Shield, Award, Activity, Sparkles, Star, Timer, XCircle, Download, CheckCircle2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ReportPageSkeleton } from "@/components/ReportPageSkeleton";
import { ErrorSeverity, FeedbackError } from "@/lib/feedback-error";
import { useFeedback } from "@/context/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { INTERVIEW_CONFIG } from "@/config/interview-config";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InterviewSession {
    id: string;
    interview_type: string;
    position: string;
    score: number | null;
    status: string;
    created_at: string;
    duration_seconds: number | null;
    config?: Record<string, unknown>; // JSONB field for storing interview configuration
    feedback: Record<string, unknown>;
    transcript: Array<TranscriptMessage>;
}

interface Skill {
    name: string;
    score: number;
    feedback: string;
}

interface TranscriptMessage {
    id: string | number;
    speaker: string;
    sender?: string; // Legacy support
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

// Type for user metadata
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
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [errorState, setErrorState] = useState<FeedbackError | null>(null);




    const fetchSession = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            if (sessionId) {
                const data = await fetchSessionDetail(sessionId, forceRefresh);
                if (data) {
                    setSession(data as unknown as InterviewSession);
                    // Automatic generation removed - relying on manual trigger for missing reports
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
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId, fetchSession]);

    // Poll for feedback if it's being generated
    const isFeedbackGenerating = session?.status === 'completed' &&
        !session?.feedback &&
        (!instantFeedback || !instantFeedback.skills || instantFeedback.skills.length === 0);

    // Real-time listener for feedback generation
    useEffect(() => {
        if (!isFeedbackGenerating || !sessionId) return;


        // 1. Subscribe to changes for this specific session
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

        // 2. Fallback Timeout (60s)
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

    const copyTranscriptToClipboard = async () => {
        try {
            const transcriptText = reportData.transcript
                .map((msg: TranscriptMessage) => {
                    const speakerRaw = (msg.speaker || msg.sender || 'candidate').toLowerCase();
                    const speaker = ['ai', 'agent', 'model'].includes(speakerRaw) ? 'AI Interviewer' : 'Candidate';
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


    if (loading || authLoading) {
        return (
            <DashboardLayout>
                <ReportPageSkeleton />
            </DashboardLayout>
        );
    }

    if (!session) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Session not found</h2>
                    <Button onClick={() => router.push("/dashboard")} className="mt-4">
                        Back to Dashboard
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // Show skeleton while generating feedback (non-blocking)
    // We prioritize this over any existing (potentially failed or thin) reports
    if ((isFeedbackGenerating || isSessionGenerating) && !feedbackTimeout && !errorState) {
        return (
            <DashboardLayout>
                <ReportPageSkeleton />
                {/* Subtle notification that analysis is in progress */}
                <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse z-50">
                    <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span className="text-sm font-medium">Analyzing interview...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Check for missing feedback (completed but no feedback)
    // We only show this if NOT currently generating to avoid flashing the button
    if (session.status === 'completed' && !session.feedback && !isFeedbackGenerating && !errorState) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-3xl overflow-hidden rounded-[2.5rem]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" />

                            <CardContent className="p-8 sm:p-12 text-center space-y-10">
                                {/* Animated Icon */}
                                <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20">
                                        <Sparkles className="h-10 w-10 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Analysis Pending
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tighter uppercase leading-none">
                                        Report <span className="text-primary">Not Generated</span>
                                    </h2>
                                    <p className="text-muted-foreground font-bold text-sm tracking-wide leading-relaxed max-w-sm mx-auto uppercase opacity-80">
                                        Use the button below to generate your detailed performance analysis.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={() => {
                                            if (sessionId) {
                                                generateFeedbackInBackground(sessionId);
                                            }
                                        }}
                                        className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
                                    >
                                        <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                                        Generate Report Now
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.push("/dashboard")}
                                        className="group h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        Return to Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Check for failed feedback generation 
    const rawFeedback = session?.feedback as Record<string, unknown> | null;
    const isGenerationFailed = rawFeedback?.status === 'failed' ||
        (typeof rawFeedback?.executiveSummary === 'string' && rawFeedback?.executiveSummary.includes('Feedback generation failed'));

    // Check for insufficient data
    if ((session.feedback as { note?: string })?.note === 'Insufficient data for report generation') {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-3xl overflow-hidden rounded-[2.5rem]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/50 to-orange-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" />

                            <CardContent className="p-8 sm:p-12 text-center space-y-10">
                                {/* Animated Warning Icon */}
                                <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-amber-500/10 rounded-3xl blur-2xl animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10">
                                        <AlertTriangle className="h-10 w-10 text-amber-500" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Session Terminated
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tighter uppercase leading-none">
                                        Feedback <span className="text-amber-500">Requirements</span> Not Met
                                    </h2>
                                    <p className="text-muted-foreground font-bold text-sm tracking-wide leading-relaxed max-w-sm mx-auto uppercase opacity-80">
                                        This session was too brief to generate high-precision feedback analysis.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 text-left">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-1">Feedback Requirements</p>
                                    {[
                                        { label: "Minimum Duration", val: `${Math.ceil(INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS / 60)} Minutes`, active: (session.duration_seconds || 0) >= INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS },
                                        { label: "Conversation Depth", val: `${INTERVIEW_CONFIG.THRESHOLDS.MIN_USER_TURNS} Responses`, active: ((session.transcript as Array<{ speaker: string }>)?.filter(m => !['ai', 'agent'].includes(m.speaker?.toLowerCase())).length || 0) >= INTERVIEW_CONFIG.THRESHOLDS.MIN_USER_TURNS }
                                    ].map((req, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{req.label}</span>
                                                <span className={`text-xs font-bold ${req.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>{req.val}</span>
                                            </div>
                                            <div className={`h-2 w-2 rounded-full ${req.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse'}`} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={() => router.push("/start-interview")}
                                        className="w-full h-16 bg-primary text-primary-foreground hover:opacity-90 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
                                    >
                                        <Bot className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                                        Start New Interview
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

                        {/* Transcript Sub-box */}
                        {session.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center justify-between px-6">
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Session Transcript</h3>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{session.transcript.length} Messages Exchanged</span>
                                </div>
                                <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border p-6 max-h-60 overflow-y-auto custom-scrollbar shadow-sm">
                                    <div className="space-y-4">
                                        {(session.transcript as Array<TranscriptMessage>).map((msg: TranscriptMessage, idx: number) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <div className={`text-[9px] font-bold uppercase tracking-widest shrink-0 w-12 ${['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase()) ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase()) ? 'AI' : 'You'}
                                                </div>
                                                <p className="text-xs text-foreground/80 font-bold leading-relaxed group-hover:text-foreground transition-colors">
                                                    {msg.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Check for literal generation failure
    if (isGenerationFailed) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                    <Card className="max-w-xl w-full border shadow-sm bg-card rounded-xl overflow-hidden">
                        <CardHeader className="text-center p-8 pb-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <XCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Feedback Analysis Error</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="bg-destructive/5 border border-destructive/10 p-4 rounded-lg text-left">
                                <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-1">Technical Reason</p>
                                <p className="text-sm text-muted-foreground">
                                    {typeof rawFeedback?.error === 'string' ? rawFeedback.error :
                                        typeof rawFeedback?.executiveSummary === 'string' ? rawFeedback.executiveSummary :
                                            "A technical error occurred while analyzing your interview. This can happen due to AI validation rules or API timeouts."}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={async () => {
                                        if (sessionId) {
                                            toast.info("Regenerating feedback analysis...", {
                                                icon: <RefreshCw className="h-4 w-4 animate-spin" />,
                                            });
                                            await generateFeedbackInBackground(sessionId);
                                            // Refresh page after a short delay
                                            window.location.reload();
                                        }
                                    }}
                                    className="w-full h-11 shadow-sm"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Regenerate Report
                                </Button>
                                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full h-11">
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Return to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transcript Still Visible */}
                    {session.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                        <div className="mt-8 max-w-xl w-full space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="font-semibold text-sm">Your Transcript</h3>
                                <Badge variant="secondary" className="text-xs">{session.transcript.length} Messages</Badge>
                            </div>
                            <Card className="border shadow-sm bg-card rounded-xl overflow-hidden">
                                <CardContent className="p-0 max-h-60 overflow-y-auto bg-muted/10">
                                    <div className="p-4 space-y-3">
                                        {(session.transcript as Array<TranscriptMessage>).map((msg: TranscriptMessage, idx: number) => {
                                            const isAI = ['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase());
                                            return (
                                                <div key={idx} className="flex gap-3 text-sm">
                                                    <div className={cn(
                                                        "text-[10px] font-bold uppercase shrink-0 w-12 py-1",
                                                        isAI ? 'text-primary' : 'text-muted-foreground'
                                                    )}>
                                                        {isAI ? 'AI' : 'You'}
                                                    </div>
                                                    <p className="text-foreground/90 leading-relaxed">
                                                        {msg.text}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    // Check if interview is in progress (not completed or no score)
    // Also check Zustand store for instant feedback to handle the case where
    // the background save hasn't completed yet but we have feedback in memory
    const hasInstantFeedback = instantFeedback && instantFeedback.skills && instantFeedback.skills.length > 0;
    const isInProgress = session.status !== 'completed' && !hasInstantFeedback;

    // If interview is in progress, show continue interview UI
    if (isInProgress) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                    <Card className="max-w-xl w-full border shadow-sm bg-card rounded-xl overflow-hidden">
                        <CardHeader className="text-center p-8 pb-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                                <Clock className="h-8 w-8 text-yellow-500" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Interview Incomplete</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="text-center max-w-sm mx-auto">
                                <p className="text-muted-foreground">
                                    You haven&apos;t finished this interview yet. Complete it to unlock your detailed performance report and AI feedback.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => {
                                        if (sessionId) {
                                            const stage = (session.config as Record<string, unknown>)?.currentStage as string || 'avatar';
                                            router.push(`/interview/${sessionId}/${stage}`);
                                        }
                                    }}
                                    className="w-full h-11 shadow-sm font-semibold"
                                >
                                    <Play className="mr-2 h-4 w-4 fill-current" />
                                    Continue Interview
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push("/dashboard")}
                                    className="w-full h-11"
                                >
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Return to Dashboard
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-muted/40 rounded-lg text-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Position</span>
                                    <span className="text-sm font-medium">{session.position}</span>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg text-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</span>
                                    <span className="text-sm font-medium capitalize">{session.interview_type.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }


    // Error state handling - show contextual error UI
    if (errorState) {
        const isRetryable = errorState.severity === ErrorSeverity.RETRYABLE;
        const isFatal = errorState.severity === ErrorSeverity.FATAL;

        return (
            <DashboardLayout>
                <div className="space-y-6 max-w-xl mx-auto p-4 min-h-[80vh] flex flex-col justify-center">
                    <Card className="border shadow-sm bg-card rounded-xl overflow-hidden">
                        <CardHeader className="text-center p-8 pb-4">
                            <div className={cn(
                                "mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4",
                                isFatal ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"
                            )}>
                                {isFatal ? <XCircle className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {isFatal ? 'Feedback Generation Failed' : 'Network Connection Issue'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6 text-center">
                            <p className="text-muted-foreground">
                                {errorState.message}
                            </p>

                            {/* Technical Details Box */}
                            {!isRetryable && (
                                <div className="bg-muted/50 p-4 rounded-lg text-left text-xs space-y-1">
                                    <p className="font-semibold text-foreground">Technical Details:</p>
                                    <p className="font-mono text-muted-foreground break-all">Session ID: {sessionId}</p>
                                    {errorState.code && <p className="font-mono text-muted-foreground">Error Code: {errorState.code}</p>}
                                    {errorState.technicalDetails && <p className="font-mono text-muted-foreground">{errorState.technicalDetails}</p>}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => {
                                        setErrorState(null);
                                        fetchSession();
                                    }}
                                    className="w-full h-11 shadow-sm"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {isRetryable ? 'Retry Now' : 'Try Again'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full h-11"
                                >
                                    Back to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transcript is still available even if feedback failed */}
                    {session?.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                        <Card className="border shadow-sm bg-card rounded-xl overflow-hidden">
                            <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm">Interview Transcript</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 max-h-60 overflow-y-auto bg-muted/10">
                                <div className="p-4 space-y-3">
                                    {(session.transcript as TranscriptMessage[]).slice(0, 5).map((msg: TranscriptMessage, idx: number) => {
                                        const isAI = ['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase());
                                        return (
                                            <div key={idx} className="flex gap-3 text-sm">
                                                <div className={cn(
                                                    "text-[10px] font-bold uppercase shrink-0 w-12 py-1",
                                                    isAI ? 'text-primary' : 'text-muted-foreground'
                                                )}>
                                                    {isAI ? 'AI' : 'You'}
                                                </div>
                                                <p className="text-foreground/90 leading-relaxed">
                                                    {msg.text}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    {(session.transcript as TranscriptMessage[]).length > 5 && (
                                        <p className="text-xs text-center text-muted-foreground pt-2">
                                            + {(session.transcript as TranscriptMessage[]).length - 5} more messages
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    // Timeout error state
    // Timeout error state
    if (feedbackTimeout) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex items-center justify-center p-4">
                    <Card className="max-w-xl w-full border shadow-sm bg-card rounded-xl overflow-hidden">
                        <CardHeader className="text-center p-8 pb-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <Clock className="h-8 w-8 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Feedback Generation Delayed</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="text-center max-w-sm mx-auto">
                                <p className="text-muted-foreground">
                                    Feedback generation is taking longer than usual. This might be due to technical delays or high server load.
                                </p>
                            </div>

                            <ul className="text-sm text-muted-foreground space-y-2 bg-muted/40 p-4 rounded-lg">
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
                                    High server load or API rate limits
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
                                    Complex interview requiring detailed analysis
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
                                    Temporary service issue
                                </li>
                            </ul>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={async () => {
                                        if (sessionId) {
                                            setFeedbackTimeout(false);
                                            // Clear instant feedback to force fresh DB read
                                            clearFeedback();
                                            await generateFeedbackInBackground(sessionId);
                                            // Force fetch fresh session from DB
                                            await fetchSession(true);
                                        }
                                    }}
                                    className="w-full h-11 bg-primary text-primary-foreground shadow-sm"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Regenerating
                                </Button>
                                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full h-11">
                                    Back to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    const mergeFeedback = (dbFeedback: Record<string, unknown> | null, instant: Record<string, unknown> | null): Record<string, unknown> => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant || {};
        if (!instant) return dbFeedback || {};

        const dbTs = dbFeedback.generatedAt ? Date.parse(String(dbFeedback.generatedAt)) : 0;
        const instTs = instant.generatedAt ? Date.parse(String(instant.generatedAt)) : 0;

        if (instTs >= dbTs) {
            // Instant is newer: shallow-merge, preferring instant fields when present
            // but ONLY if the instant fields are not empty/placeholders
            return {
                ...dbFeedback,
                ...instant,
                // ensure generatedAt is set to the latest
                generatedAt: instant.generatedAt || dbFeedback.generatedAt,
            };
        }

        // DB is newer or same: return DB feedback
        return dbFeedback;
    };

    // Standardized feedback structure extraction
    // v2.0 structure: { overall: { ... }, resumptions: [ ... ] }
    // legacy structure (single resumption): { score, executiveSummary, ... }
    let extractedFeedback = session?.feedback as Record<string, unknown> | null;

    if (extractedFeedback) {
        // If we have the new standardized structure, use 'overall'
        if (extractedFeedback.overall && typeof extractedFeedback.overall === 'object') {
            extractedFeedback = extractedFeedback.overall as Record<string, unknown>;
        }
        // If we have the old nested structure for multi-resumption (backward compatibility)
        else if (extractedFeedback.resumptions && Array.isArray(extractedFeedback.resumptions) && extractedFeedback.resumptions.length > 0) {
            if (!extractedFeedback.overall || Object.keys(extractedFeedback.overall).length === 0 || !extractedFeedback.executiveSummary) {
                extractedFeedback = extractedFeedback.resumptions[0];
            }
        }
    }

    // merge with potentially more up-to-date instant feedback from Zustand store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feedbackData = mergeFeedback(extractedFeedback, instantFeedback as any);

    // Use instant transcript if available (more up-to-date), fallback to DB transcript
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

    // Separate overall skills from technical skills
    const overallSkills = (Array.isArray(feedbackData.overallSkills) ? feedbackData.overallSkills : null) || (Array.isArray(feedbackData.skills) ? feedbackData.skills : null) || [
        { name: "Technical Knowledge", score: 0, feedback: "Pending..." },
        { name: "Communication", score: 0, feedback: "Pending..." },
        { name: "Problem Solving", score: 0, feedback: "Pending..." },
        { name: "Cultural Fit", score: 0, feedback: "Pending..." }
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

    const overallScore = session.score || Math.round(overallSkills.reduce((acc: number, s: { score?: number }) => acc + (s.score || 0), 0) / (overallSkills.length || 1));

    const reportData = {
        candidateName: userMetadata?.full_name || "Candidate",
        position: session.position,
        overallScore: overallScore,
        date: new Date(session.created_at).toLocaleString(),
        executiveSummary: (typeof feedbackData.executiveSummary === 'string' ? feedbackData.executiveSummary : null) || "The interview session has been recorded. Detailed AI analysis is pending.",
        rankGrade: calculateGrade(overallScore),
        strengths: (Array.isArray(feedbackData.strengths) ? feedbackData.strengths : null) || ["Pending analysis..."],
        improvements: (Array.isArray(feedbackData.improvements) ? feedbackData.improvements : null) || ["Pending analysis..."],
        overallSkills: overallSkills,
        technicalSkills: technicalSkills,
        // Deprecated: kept for backward compatibility in downloads
        skills: (Array.isArray(feedbackData.skills) ? feedbackData.skills : null) || overallSkills,
        actionPlan: (Array.isArray(feedbackData.actionPlan) ? feedbackData.actionPlan : null) || ["Wait for full AI report generation."],
        // Ensure transcript format is consistent and filter AI internal thoughts
        transcript: transcriptData.length > 0
            ? transcriptData
                // Safely handle potential transcript structure issues
                .filter((msg: unknown) => {
                    const m = msg as BaseMessage;
                    return m && (m.speaker || m.sender || m.role) && m.text && m.text.trim();
                })
                .map((msg: unknown, i: number) => {
                    const m = msg as BaseMessage;
                    let cleanedText = m.text.trim();
                    const speakerRaw = (m.speaker || m.sender || m.role || 'candidate').toLowerCase();
                    const speaker = ['ai', 'agent', 'model', 'assistant'].includes(speakerRaw) ? 'ai' : 'user';

                    // Remove AI internal thoughts (e.g., **Thinking**, **Analysis**, etc.)
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
                .filter((msg: TranscriptMessage) => msg.text.trim()) // Remove messages that became empty after filtering
            : [
                { id: 1, speaker: "ai", text: "No transcript available. The interview may not have contained any recorded conversation.", timestamp: "-" },
            ],
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 sm:pt-0 overflow-x-hidden max-w-full">
                {/* Header Section */}
                <div className="relative mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                {reportData.candidateName} <span className="text-muted-foreground font-normal">Report</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{reportData.position}</span>
                                <span>•</span>
                                <span className="capitalize">{session.interview_type.replace('_', ' ')} Session</span>
                                <span>•</span>
                                <span>{reportData.date}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={downloadReport}
                                className="h-9 px-4 gap-2 shadow-sm"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export PDF</span>
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Feedback Report?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently remove this feedback analysis from your profile. This data cannot be recovered.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            Delete Report
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Overall Score Gauge */}
                    <Card className="xl:col-span-1 border shadow-sm bg-card rounded-xl overflow-hidden flex flex-col justify-center">
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="relative h-32 w-32">
                                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="42"
                                        className="fill-none stroke-muted"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50" cy="50" r="42"
                                        strokeLinecap="round"
                                        className={cn(
                                            "fill-none transition-all duration-1000 ease-out",
                                            reportData.overallScore >= 80 ? "stroke-emerald-500" :
                                                reportData.overallScore >= 60 ? "stroke-primary" : "stroke-rose-500"
                                        )}
                                        strokeWidth="8"
                                        strokeDasharray={`${reportData.overallScore * 2.639}, 263.9`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold tracking-tighter">{reportData.overallScore}</span>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall</span>
                                </div>
                            </div>

                            <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold border",
                                reportData.overallScore >= 70
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                            )}>
                                {reportData.overallScore >= 70 ? 'Strong Match' : 'Improvement Needed'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Executive Overview */}
                    <Card className="xl:col-span-3 border shadow-sm bg-card rounded-xl flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Executive Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {reportData.executiveSummary}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto pt-4 border-t">
                                {[
                                    { label: "Duration", value: formatDuration(session.duration_seconds || 0), icon: Clock },
                                    { label: "Skills Covered", value: reportData.overallSkills.length, icon: Target },
                                    { label: "Exchanges", value: reportData.transcript.filter((m: TranscriptMessage) => ['ai', 'agent', 'model'].includes((m.speaker || m.sender || '').toLowerCase())).length, icon: MessageSquare },
                                    { label: "Grade", value: reportData.rankGrade, icon: Award }
                                ].map((m, i) => (
                                    <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <m.icon className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider">{m.label}</span>
                                        </div>
                                        <span className="text-lg font-bold text-foreground">{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="insights" className="w-full mt-8">
                    <TabsList className="bg-muted min-h-12 p-1 rounded-lg w-full sm:w-auto inline-flex mb-8">
                        <TabsTrigger value="insights" className="rounded-md px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Analysis</TabsTrigger>
                        <TabsTrigger value="skills" className="rounded-md px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Skills</TabsTrigger>
                        <TabsTrigger value="transcript" className="rounded-md px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Transcript</TabsTrigger>
                    </TabsList>


                    <TabsContent value="insights" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths Card */}
                            <Card className="border shadow-sm bg-card rounded-xl">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-base font-bold text-foreground">Key Strengths</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {reportData.strengths.map((item: string, i: number) => (
                                        <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-muted/40 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-foreground/80">{item}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Improvements Card */}
                            <Card className="border shadow-sm bg-card rounded-xl">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-base font-bold text-foreground">Development Areas</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {reportData.improvements.map((item: string, i: number) => (
                                        <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-muted/40 text-sm">
                                            <XCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                                            <span className="text-foreground/80">{item}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Plan - Navigate to Roadmap */}
                        <Card className="border border-primary/20 shadow-sm bg-primary/5 rounded-xl overflow-hidden">
                            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                                <div className="h-14 w-14 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                                    <Star className="h-7 w-7 fill-current" />
                                </div>

                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-foreground">Accelerate Your Growth</h3>
                                    <p className="text-sm text-muted-foreground max-w-2xl">
                                        Get a personalized AI-generated roadmap tailored to your interview performance,
                                        complete with learning resources and milestones.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => router.push('/roadmap')}
                                    className="bg-primary text-primary-foreground font-semibold shadow-md shrink-0"
                                >
                                    Generate Roadmap
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    <TabsContent value="skills" className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Radar Visual */}
                            <Card className="lg:col-span-1 border shadow-sm bg-card rounded-xl">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">Skill Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportData.overallSkills}>
                                            <PolarGrid stroke="currentColor" strokeOpacity={0.1} />
                                            <PolarAngleAxis
                                                dataKey="name"
                                                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600, opacity: 0.7 }}
                                            />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Competency"
                                                dataKey="score"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={2}
                                                fill="hsl(var(--primary))"
                                                fillOpacity={0.2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Detailed Skills Breakdown */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {reportData.overallSkills.map((skill: Skill, i: number) => (
                                    <Card key={i} className="border shadow-sm bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 rounded-xl">
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-foreground">{skill.name}</h4>
                                                <span className="text-xl font-bold text-primary">{skill.score}%</span>
                                            </div>

                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000"
                                                    style={{ width: `${skill.score}%` }}
                                                />
                                            </div>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground hover:text-primary">
                                                        View Analysis
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <Target className="h-5 w-5 text-primary" />
                                                            {skill.name}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Score: {skill.score}%
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                                                        {skill.feedback}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Technical Skills Section */}
                        {reportData.technicalSkills && reportData.technicalSkills.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Code className="h-5 w-5 text-blue-500" />
                                    Technical Skills Assessment
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {reportData.technicalSkills.map((skill: Skill, i: number) => (
                                        <Card key={i} className="border shadow-sm bg-card rounded-xl">
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-medium text-sm text-foreground">{skill.name}</h4>
                                                    <span className="text-lg font-bold text-blue-600">{skill.score}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${skill.score}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {skill.feedback}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendation Tier */}
                        <div className={cn(
                            "rounded-xl border p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left shadow-sm",
                            reportData.overallScore >= 70
                                ? "bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                                : "bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                        )}>
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                                reportData.overallScore >= 70 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500" : "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-500"
                            )}>
                                {reportData.overallScore >= 70 ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                            </div>

                            <div className="flex-1 space-y-1">
                                <h3 className="text-lg font-bold text-foreground">
                                    {reportData.overallScore >= 70 ? "Strong Performance" : "Needs Improvement"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {reportData.overallScore >= 70
                                        ? "Great job! You showed strong understanding of key concepts."
                                        : "Review the feedback above to focus on areas that need more attention."
                                    }
                                </p>
                            </div>

                            <Button variant="outline" asChild className="shrink-0 bg-background">
                                <Link href="/reports">
                                    View All Reports
                                </Link>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="space-y-4">
                        <Card className="border shadow-sm bg-card rounded-xl overflow-hidden flex flex-col h-[600px]">
                            <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <MessageSquare className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Full Transcript</h3>
                                        <p className="text-xs text-muted-foreground">{reportData.transcript.length} messages exchanged</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyTranscriptToClipboard}
                                        className="h-8 gap-2 bg-background shadow-sm hover:bg-muted"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Copy Text</span>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1 bg-gradient-to-b from-background to-muted/20 scroll-smooth">
                                <div className="flex flex-col gap-6 p-6">
                                    {reportData.transcript.map((msg: TranscriptMessage, i: number) => {
                                        const isAI = ['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase());
                                        return (
                                            <div key={i} className={cn(
                                                "flex gap-4 max-w-[90%] md:max-w-[80%]",
                                                !isAI ? "ml-auto flex-row-reverse" : ""
                                            )}>
                                                {/* Avatar */}
                                                <div className={cn(
                                                    "shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border",
                                                    isAI ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" : "bg-primary text-primary-foreground border-primary"
                                                )}>
                                                    {isAI ? (
                                                        <Bot className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <div className="text-[10px] font-bold tracking-tight">
                                                            {userMetadata?.full_name?.charAt(0) || "Y"}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={cn(
                                                    "flex flex-col min-w-0",
                                                    !isAI ? "items-end" : "items-start"
                                                )}>
                                                    {/* Bubble */}
                                                    <div className={cn(
                                                        "px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm w-fit",
                                                        isAI
                                                            ? "bg-white dark:bg-card border border-border/60 text-foreground rounded-tl-none"
                                                            : "bg-primary text-primary-foreground rounded-tr-none"
                                                    )}>
                                                        {msg.text.split('\n').map((line, idx) => (
                                                            <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
