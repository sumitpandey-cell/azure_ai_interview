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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

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
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <Card className="border-none shadow-2xl bg-card backdrop-blur-3xl overflow-hidden rounded-[2.5rem]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/50 to-orange-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />

                            <CardContent className="p-8 sm:p-12 text-center space-y-10">
                                {/* Animated Warning Icon */}
                                <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-rose-500/20 rounded-3xl blur-2xl animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shadow-2xl shadow-rose-500/20">
                                        <XCircle className="h-10 w-10 text-rose-500" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Generation Failed
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tighter uppercase leading-none">
                                        Feedback <span className="text-rose-500">Analysis</span> Error
                                    </h2>
                                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl text-left">
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Technical Reason:</p>
                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                            {typeof rawFeedback?.error === 'string' ? rawFeedback.error :
                                                typeof rawFeedback?.executiveSummary === 'string' ? rawFeedback.executiveSummary :
                                                    "A technical error occurred while analyzing your interview. This can happen due to AI validation rules or API timeouts."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
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
                                        className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-700" />
                                        Regenerate Report<Button
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
                                            className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-700" />
                                            Regenerate Report
                                        </Button>
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

                        {/* Transcript Still Visible */}
                        {session.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center justify-between px-6">
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Your Transcript</h3>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Available for review</span>
                                </div>
                                <div className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border p-6 max-h-60 overflow-y-auto custom-scrollbar shadow-sm">
                                    <div className="space-y-4">
                                        {(session.transcript as Array<TranscriptMessage>).map((msg: TranscriptMessage, idx: number) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <div className={`text-[9px] font-bold uppercase tracking-widest shrink-0 w-12 ${['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase()) ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase()) ? 'AI' : 'You'}
                                                </div>
                                                <p className="text-xs text-foreground font-medium leading-relaxed">
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

    // Check if interview is in progress (not completed or no score)
    // Also check Zustand store for instant feedback to handle the case where
    // the background save hasn't completed yet but we have feedback in memory
    const hasInstantFeedback = instantFeedback && instantFeedback.skills && instantFeedback.skills.length > 0;
    const isInProgress = session.status !== 'completed' && !hasInstantFeedback;

    // If interview is in progress, show continue interview UI
    if (isInProgress) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-3xl overflow-hidden rounded-[2.5rem]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/50 to-amber-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]" />

                            <CardContent className="p-8 sm:p-12 text-center space-y-10">
                                {/* Animated Clock Icon */}
                                <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-yellow-500/10 rounded-3xl blur-2xl animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-3xl bg-yellow-500/5 border border-yellow-500/20 flex items-center justify-center shadow-2xl shadow-yellow-500/10">
                                        <Clock className="h-10 w-10 text-yellow-500" />
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

                        {/* Session Progress Info */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-4 shadow-sm flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Position</span>
                                <span className="text-xs font-bold text-foreground truncate">{session.position}</span>
                            </div>
                            <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-4 shadow-sm flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Type</span>
                                <span className="text-xs font-bold text-foreground capitalize truncate">{session.interview_type.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
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
                <div className="space-y-6 max-w-4xl mx-auto p-4">
                    {/* Header with partial data */}
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground">
                                        {userMetadata?.full_name || "Candidate"}
                                    </h1>
                                    <p className="text-muted-foreground text-lg">
                                        {session?.position || "Interview Report"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error Card */}
                    <Card className={`border-2 ${isFatal
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                        }`}>
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center gap-6 text-center">
                                {/* Error Icon */}
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isFatal ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'
                                    }`}>
                                    <XCircle className={`h-8 w-8 ${isFatal ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                                        }`} />
                                </div>

                                {/* Error Title & Message */}
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">
                                        {isFatal
                                            ? 'Feedback Generation Failed'
                                            : 'Network Connection Issue'}
                                    </h2>
                                    <p className="text-muted-foreground max-w-md">
                                        {errorState.message}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                {isRetryable ? (
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            onClick={() => {
                                                setErrorState(null);
                                                fetchSession();
                                            }}
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Retry Now
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push('/dashboard')}
                                        >
                                            Back to Dashboard
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 w-full max-w-md">
                                        {/* Technical Details Box */}
                                        <div className="bg-muted p-4 rounded-lg text-left">
                                            <p className="text-xs font-semibold text-foreground mb-2">
                                                Technical Details:
                                            </p>
                                            <p className="font-mono text-xs text-muted-foreground break-all">
                                                Session ID: {sessionId}
                                            </p>
                                            {errorState.code && (
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    Error Code: {errorState.code}
                                                </p>
                                            )}
                                            {errorState.technicalDetails && (
                                                <p className="font-mono text-xs text-muted-foreground mt-1">
                                                    {errorState.technicalDetails}
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            Please contact the developer with the above information if this issue persists.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button
                                                onClick={() => {
                                                    setErrorState(null);
                                                    fetchSession();
                                                }}
                                                variant="outline"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Try Again
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push('/dashboard')}
                                            >
                                                Back to Dashboard
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transcript is still available even if feedback failed */}
                    {session?.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Interview Transcript
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Your interview conversation was saved. You can review it below while we work on the feedback issue.
                                </p>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {(session.transcript as TranscriptMessage[]).slice(0, 5).map((msg: TranscriptMessage, idx: number) => (
                                        <div key={idx} className={`p-3 rounded-lg ${['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase())
                                            ? 'bg-blue-50 dark:bg-blue-950/20'
                                            : 'bg-muted'
                                            }`}>
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                                                {['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase()) ? 'AI Interviewer' : 'You'}
                                            </p>
                                            <p className="text-sm text-foreground">
                                                {msg.text}
                                            </p>
                                        </div>
                                    ))}
                                    {(session.transcript as TranscriptMessage[]).length > 5 && (
                                        <p className="text-xs text-center text-muted-foreground">
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
    if (feedbackTimeout) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full border-none shadow-2xl">
                        <CardContent className="p-8 md:p-12">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold text-red-600">
                                        Feedback Generation Delayed
                                    </h2>
                                    <p className="text-muted-foreground text-lg">
                                        Feedback generation is taking longer than usual. This might be due to:
                                    </p>
                                </div>
                                <ul className="text-left text-sm text-muted-foreground space-y-2 bg-muted p-4 rounded-lg">
                                    <li>• High server load or API rate limits</li>
                                    <li>• Complex interview requiring detailed analysis</li>
                                    <li>• Temporary service issue</li>
                                </ul>
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Try Regenerating
                                    </Button>
                                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                                        Back to Dashboard
                                    </Button>
                                </div>
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
                            <Button
                                onClick={downloadReport}
                                className="h-9 sm:h-11 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl border border-border/80 dark:border-border hover:bg-card/90 dark:hover:bg-card/60 text-foreground font-black uppercase tracking-[0.15em] text-[10px] transition-all shadow-md dark:shadow-2xl group/btn"
                            >
                                <Download className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                <span className="hidden lg:inline">Export Insights</span>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl flex items-center justify-center p-0 shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border border-border shadow-3xl p-6 sm:p-10 bg-card/90 backdrop-blur-3xl max-w-[90vw] sm:max-w-lg">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground">Delete Feedback Report?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground font-medium">
                                            This action will permanently remove this feedback analysis from your profile. This data cannot be recovered.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6 sm:mt-8 gap-3 sm:gap-4 flex-col sm:flex-row">
                                        <AlertDialogCancel className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-muted hover:bg-muted/80 text-foreground">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20"
                                        >
                                            Confirm Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* Decorative Mesh Background */}
                    <div className="absolute -left-24 -top-24 h-[400px] w-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute right-0 top-0 h-[300px] w-[300px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
                </div>

                {/* Primary Intelligence Section */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                    {/* Overall Score Gauge */}
                    <Card className="xl:col-span-1 border border-border/80 dark:border-white/5 shadow-lg dark:shadow-3xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
                        <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center h-full gap-5 sm:gap-6 text-center relative z-10">
                            <div className="relative h-28 w-28 sm:h-40 sm:w-40 group-hover:scale-105 transition-all duration-1000">
                                <svg className="h-full w-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="42"
                                        className="fill-none stroke-black/5 dark:stroke-white/5"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50" cy="50" r="42"
                                        strokeLinecap="round"
                                        className={cn(
                                            "fill-none transition-all duration-1500 ease-out",
                                            reportData.overallScore >= 80 ? "stroke-emerald-500" :
                                                reportData.overallScore >= 60 ? "stroke-primary" : "stroke-rose-500"
                                        )}
                                        strokeWidth="8"
                                        strokeDasharray={`${reportData.overallScore * 2.639}, 263.9`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl sm:text-5xl font-black text-foreground tabular-nums tracking-tighter">{reportData.overallScore}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">Overall Score</span>
                                </div>
                                <div className="absolute -inset-8 bg-primary/15 dark:bg-primary/10 blur-[60px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            </div>


                            <div className="space-y-3">
                                <div className={cn(
                                    "px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] border shadow-xl backdrop-blur-xl",
                                    reportData.overallScore >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500 shadow-emerald-500/5" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500 shadow-rose-500/5"
                                )}>
                                    {reportData.overallScore >= 70 ? 'Strong Match' : 'Improvement Recommended'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Executive Overview */}
                    <Card className="xl:col-span-3 border border-border/80 dark:border-white/5 shadow-lg dark:shadow-3xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative group/executive">
                        <div className="absolute top-0 right-0 h-full w-64 bg-gradient-to-l from-primary/10 dark:from-primary/5 to-transparent pointer-events-none" />

                        <CardContent className="p-4 sm:p-6 md:p-8 relative z-10">
                            <div className="flex flex-col h-full gap-4 sm:gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1 sm:space-y-2">
                                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight uppercase text-foreground leading-tight">Executive Summary</h3>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-[0.4em]">Detailed Performance Assessment</p>
                                    </div>
                                    <div className="hidden sm:flex gap-6 px-5 py-2 rounded-2xl bg-muted/60 dark:bg-muted/30 border border-border backdrop-blur-xl shadow-sm">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Session Date</span>
                                            <span className="text-xs font-black tabular-nums text-foreground/80 uppercase">{reportData.date}</span>
                                        </div>
                                    </div>

                                </div>

                                <p className="text-sm sm:text-base font-bold leading-relaxed max-w-5xl italic border-l-4 border-primary/40 dark:border-primary/30 pl-3 sm:pl-4 py-3 bg-gradient-to-r from-primary/[0.08] dark:from-primary/5 to-transparent rounded-r-xl sm:rounded-r-2xl shadow-sm">
                                    &quot;{reportData.executiveSummary}&quot;
                                </p>


                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-auto pt-6 sm:pt-8 border-t border-border">
                                    {[
                                        { label: "Duration", value: formatDuration(session.duration_seconds || 0), icon: Timer, color: "text-amber-600 dark:text-amber-500" },
                                        { label: "Skills Covered", value: reportData.overallSkills.length, icon: Target, color: "text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" },
                                        { label: "Exchanges", value: reportData.transcript.filter((m: TranscriptMessage) => ['ai', 'agent', 'model'].includes((m.speaker || m.sender || '').toLowerCase())).length, icon: MessageSquare, color: "text-blue-600 dark:text-blue-500" },
                                        { label: "Performance Tier", value: reportData.rankGrade, icon: Award, color: "text-emerald-600 dark:text-emerald-500" }
                                    ].map((m, i) => (
                                        <div key={i} className="flex items-center gap-3 group/metric">
                                            <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-muted/80 dark:bg-muted flex items-center justify-center shadow-md dark:shadow-xl border border-border/80 dark:border-border group-hover/metric:scale-110 group-hover/metric:bg-muted/90 transition-all duration-500", m.color)}>
                                                <m.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">{m.label}</span>
                                                <span className="text-[10px] sm:text-xs font-black text-foreground uppercase truncate tracking-widest mt-0.5">{m.value}</span>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Analysis Tabs */}
                <Tabs defaultValue="insights" className="w-full">
                    <TabsList className="bg-muted/80 dark:bg-muted/50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl h-10 sm:h-12 md:h-14 mb-4 sm:mb-6 md:mb-8 inline-flex border border-border/80 dark:border-border backdrop-blur-3xl shadow-lg dark:shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <TabsTrigger value="insights" className="rounded-xl sm:rounded-2xl px-4 sm:px-8 md:px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all duration-500 shadow-sm data-[state=active]:shadow-md">Analysis</TabsTrigger>
                        <TabsTrigger value="skills" className="rounded-xl sm:rounded-2xl px-4 sm:px-8 md:px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all duration-500 shadow-sm data-[state=active]:shadow-md">Skills</TabsTrigger>
                        <TabsTrigger value="transcript" className="rounded-xl sm:rounded-2xl px-4 sm:px-8 md:px-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] h-full transition-all duration-500 shadow-sm data-[state=active]:shadow-md">Transcript</TabsTrigger>
                    </TabsList>


                    <TabsContent value="insights" className="space-y-4 sm:space-y-6 md:space-y-8 outline-none animate-in fade-in slide-in-from-top-4 duration-700">
                        {/* Performance Consistency Graph */}


                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                            {/* Strengths Card */}
                            <Card className="border border-border/80 dark:border-border shadow-md dark:shadow-3xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative group/strengths">

                                <div className="absolute top-0 right-0 h-48 w-48 bg-emerald-500/5 blur-[80px] rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
                                <CardHeader className="p-4 sm:p-6 md:p-6 pb-0">
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight flex items-center gap-2.5 sm:gap-3 uppercase text-emerald-600 dark:text-emerald-500">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        Key Strengths
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 space-y-2.5 sm:space-y-3">
                                    {reportData.strengths.map((item: string, i: number) => (
                                        <div key={i} className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border dark:border-white/5 group-hover/strengths:bg-emerald-500/[0.05] group-hover/strengths:border-emerald-500/20 transition-all duration-700">
                                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                                            </div>
                                            <p className="text-[11px] sm:text-xs font-bold text-foreground/80 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Improvements Card */}
                            <Card className="border border-border/80 dark:border-border shadow-md dark:shadow-3xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-2xl overflow-hidden relative group/improvements">

                                <div className="absolute top-0 right-0 h-48 w-48 bg-rose-500/5 blur-[80px] rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
                                <CardHeader className="p-4 sm:p-6 md:p-6 pb-0">
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight flex items-center gap-2.5 sm:gap-3 uppercase text-rose-600 dark:text-rose-500">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
                                            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        Development Areas
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-5 md:p-6 space-y-2.5 sm:space-y-3">
                                    {reportData.improvements.map((item: string, i: number) => (
                                        <div key={i} className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border dark:border-white/5 group-hover/improvements:bg-rose-500/[0.05] group-hover/improvements:border-rose-500/20 transition-all duration-700">
                                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                                <XCircle className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-rose-500" />
                                            </div>
                                            <p className="text-[11px] sm:text-xs font-bold text-foreground/80 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Plan - Navigate to Roadmap */}
                        <Card className="border border-primary/30 dark:border-border shadow-lg dark:shadow-3xl bg-primary/[0.03] dark:bg-card/40 backdrop-blur-3xl rounded-3xl overflow-hidden relative group/plan">

                            <div className="absolute inset-0 bg-grid-foreground/[0.02] pointer-events-none" />
                            <div className="absolute top-0 right-0 h-full w-96 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

                            <CardContent className="p-4 sm:p-6 md:p-8 relative z-10">
                                <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
                                    {/* Icon and Title */}
                                    <div className="flex-shrink-0">
                                        <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/30 dark:border-primary/20 shadow-xl dark:shadow-2xl shadow-primary/20 group-hover/plan:scale-110 group-hover/plan:rotate-6 transition-all duration-700">
                                            <Star className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                                        </div>
                                    </div>


                                    {/* Content */}
                                    <div className="flex-1 space-y-3 sm:space-y-4 text-center lg:text-left">
                                        <div className="space-y-1 sm:space-y-2">
                                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight uppercase text-foreground">
                                                Self-Improvement Roadmaps
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.4em]">
                                                Personalized Growth Path
                                            </p>
                                        </div>

                                        <p className="text-sm sm:text-base md:text-lg font-medium text-foreground/80 leading-relaxed max-w-3xl">
                                            Ready to level up your skills? Get a personalized AI-generated roadmap tailored to your interview performance,
                                            complete with learning resources, milestones, and actionable steps to achieve your career goals.
                                        </p>

                                        <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground/60">
                                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                                                Skill-based learning path
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground/60">
                                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                                                Curated resources
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground/60">
                                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                                                Progress tracking
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="flex-shrink-0 w-full lg:w-auto">
                                        <Button
                                            onClick={() => router.push('/roadmap')}
                                            className="w-full lg:w-auto h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group/btn"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span>Generate Roadmap</span>
                                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover/btn:translate-x-1 transition-transform" />
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    <TabsContent value="skills" className="space-y-10 outline-none animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Radar Visual */}
                            <Card className="lg:col-span-1 border border-border shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl overflow-hidden relative group/radar">
                                <div className="absolute inset-0 bg-grid-foreground/[0.02] pointer-events-none" />
                                <CardHeader className="p-8 sm:p-10 pb-0 relative z-10">
                                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-foreground">Skill Distribution</h3>
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.4em] mt-2">Competency breakdown</p>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px] relative z-10">
                                    <div className="h-[240px] sm:h-[280px] w-full group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-1000">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportData.overallSkills}>
                                                <PolarGrid stroke={mounted && resolvedTheme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"} />
                                                <PolarAngleAxis
                                                    dataKey="name"
                                                    tick={{ fill: 'currentColor', fontSize: 8, fontWeight: 900, opacity: 0.6 }}
                                                />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar
                                                    name="Competency"
                                                    dataKey="score"
                                                    stroke="#A855F7"
                                                    strokeWidth={2}
                                                    fill="#A855F7"
                                                    fillOpacity={0.3}
                                                />
                                            </RadarChart>

                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute -inset-20 bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover/radar:opacity-40 transition-opacity duration-1000" />
                                </CardContent>
                            </Card>

                            {/* Detailed Skills Breakdown */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {reportData.overallSkills.map((skill: Skill, i: number) => (
                                    <div key={i} className="group/skill relative">
                                        <Card className="h-full border border-border/80 dark:border-white/5 shadow-md dark:shadow-xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl hover:bg-card dark:hover:bg-white/[0.05] hover:border-primary/40 dark:hover:border-primary/20 rounded-2xl transition-all duration-700 overflow-hidden">

                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1.5">
                                                        <h4 className="text-base font-bold tracking-tight text-foreground uppercase leading-none">{skill.name}</h4>
                                                        <p className="text-[8px] text-primary/60 font-bold uppercase tracking-[0.3em] leading-none">Intelligence Metric</p>
                                                    </div>
                                                    <div className="text-2xl font-bold text-primary tabular-nums tracking-tighter shadow-primary/20 drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">{skill.score}%</div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="h-2 w-full bg-muted dark:bg-white/5 rounded-full overflow-hidden border border-border dark:border-white/5">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                                                            style={{ width: `${skill.score}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <div className="cursor-pointer group/text">
                                                            <p className="text-xs font-bold text-muted-foreground/80 leading-relaxed h-[3.5rem] line-clamp-3 group-hover/text:text-primary transition-colors">
                                                                {skill.feedback}
                                                            </p>
                                                            {skill.feedback && skill.feedback.length > 100 && (
                                                                <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest mt-2 group-hover/text:text-primary transition-colors">
                                                                    Click to read more →
                                                                </p>
                                                            )}
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl rounded-2xl border-2 border-white/10 bg-card/95 backdrop-blur-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                                    <Target className="h-5 w-5 text-primary" />
                                                                </div>
                                                                {skill.name}
                                                            </DialogTitle>
                                                            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                                Score: {skill.score}% • Detailed Analysis
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="mt-6 space-y-4">
                                                            <div className="p-6 rounded-2xl bg-muted/30 dark:bg-white/[0.03] border border-border dark:border-white/5">
                                                                <p className="text-sm font-medium text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                                                    {skill.feedback}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Technical Skills Section - Skills mentioned by candidate */}
                        {reportData.technicalSkills && reportData.technicalSkills.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Code className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold tracking-tight uppercase text-foreground">Technical Skills Assessment</h3>
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.4em]">Candidate-Specified Technologies</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reportData.technicalSkills.map((skill: Skill, i: number) => (
                                        <Card key={i} className="border border-border/80 dark:border-white/5 shadow-md dark:shadow-xl bg-card/80 dark:bg-card/40 backdrop-blur-3xl hover:bg-card dark:hover:bg-white/[0.05] hover:border-blue-500/40 dark:hover:border-blue-500/20 rounded-2xl transition-all duration-700 overflow-hidden group/tech">

                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-bold tracking-tight text-foreground uppercase leading-none">{skill.name}</h4>
                                                        <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-[0.3em] leading-none">Tech Stack</p>
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-500 tabular-nums tracking-tighter">{skill.score}%</div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="h-1.5 w-full bg-muted dark:bg-white/5 rounded-full overflow-hidden border border-border dark:border-white/5">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                                                            style={{ width: `${skill.score}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <div className="cursor-pointer group/techtext">
                                                            <p className="text-xs font-bold text-muted-foreground/80 leading-relaxed line-clamp-2 group-hover/techtext:text-blue-500 transition-colors">
                                                                {skill.feedback}
                                                            </p>
                                                            {skill.feedback && skill.feedback.length > 80 && (
                                                                <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-widest mt-2 group-hover/techtext:text-blue-500 transition-colors">
                                                                    View details →
                                                                </p>
                                                            )}
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl rounded-2xl border-2 border-white/10 bg-card/95 backdrop-blur-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                                    <Code className="h-5 w-5 text-blue-500" />
                                                                </div>
                                                                {skill.name}
                                                            </DialogTitle>
                                                            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                                Technical Proficiency: {skill.score}% • Detailed Feedback
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="mt-6 space-y-4">
                                                            <div className="p-6 rounded-2xl bg-muted/30 dark:bg-white/[0.03] border border-border dark:border-white/5">
                                                                <p className="text-sm font-medium text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                                                    {skill.feedback}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendation Tier */}
                        <Card className={cn(
                            "border-2 shadow-lg dark:shadow-2xl rounded-2xl overflow-hidden p-1 relative",
                            reportData.overallScore >= 70 ? "border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/5" : "border-rose-500/40 dark:border-rose-500/30 bg-rose-500/[0.03] dark:bg-rose-500/5"
                        )}>

                            <CardContent className="p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-center gap-6 sm:gap-10">
                                <div className={cn(
                                    "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 shadow-2xl",
                                    reportData.overallScore >= 70 ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                                )}>
                                    {reportData.overallScore >= 70 ? <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" /> : <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10" />}
                                </div>
                                <div className="flex-1 space-y-3 text-center lg:text-left">
                                    <h3 className={cn("text-xl sm:text-2xl font-bold uppercase tracking-tight", reportData.overallScore >= 70 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                                        {reportData.overallScore >= 70 ? "Strong Performance - Recommended" : "Performance Review Suggested"}
                                    </h3>
                                    <p className="text-sm sm:text-base font-medium text-foreground/80 leading-relaxed max-w-4xl">
                                        Based on a deep-dive analysis of tactical responses and core competencies, this profile exhibits
                                        {reportData.overallScore >= 70
                                            ? " strong alignment with organizational objectives."
                                            : " significant gaps. Further training and technical recalibration are advised."
                                        }
                                    </p>
                                </div>
                                <Button asChild className={cn(
                                    "h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[11px] group",
                                    reportData.overallScore >= 70 ? "bg-emerald-600 hover:bg-emerald-700 text-emerald-foreground" : "bg-rose-600 hover:bg-rose-700 text-rose-foreground"
                                )}>
                                    <Link href="/reports">
                                        Back to Archives
                                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transcript" className="outline-none animate-in fade-in slide-in-from-top-4 duration-700">
                        <Card className="border border-border shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl overflow-hidden">
                            <CardHeader className="p-4 sm:p-6 md:p-8 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <MessageSquare className="h-4 w-4 text-primary" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold tracking-tight uppercase text-foreground">Detailed Transcript</h3>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.4em] ml-11">Source: Interview Record • {reportData.transcript.length} Messages</p>
                                </div>
                                <Button
                                    onClick={copyTranscriptToClipboard}
                                    className="h-10 px-6 rounded-xl bg-muted/80 dark:bg-muted border border-border/80 dark:border-border hover:bg-muted dark:hover:bg-muted/80 text-foreground font-black uppercase tracking-[0.2em] text-[10px] transition-all ml-14 sm:ml-0 shadow-sm"
                                >
                                    <Copy className="h-3.5 w-3.5 mr-2" />
                                    Export Logs
                                </Button>

                            </CardHeader>
                            <CardContent className="p-6 sm:p-8 md:p-10 space-y-8 max-h-[800px] overflow-y-auto no-scrollbar relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
                                {reportData.transcript.map((msg: TranscriptMessage, i: number) => {
                                    const isAI = ['ai', 'agent', 'model'].includes((msg.speaker || msg.sender || '').toLowerCase());
                                    return (
                                        <div key={i} className={cn(
                                            "flex flex-col gap-3 max-w-[90%] md:max-w-[70%] animate-in fade-in slide-in-from-bottom-4 duration-700",
                                            !isAI ? "ml-auto items-end" : "items-start"
                                        )}>
                                            <div className="flex items-center gap-3 px-2">
                                                <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center border text-[8px] font-bold uppercase tracking-widest",
                                                    isAI ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
                                                )}>
                                                    {isAI ? 'AI' : 'YOU'}
                                                </div>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 tabular-nums">{msg.timestamp}</span>
                                            </div>
                                            <div className={cn(
                                                "p-4 sm:p-5 rounded-xl text-xs sm:text-sm font-black leading-relaxed shadow-lg dark:shadow-2xl relative group/msg transition-all duration-500",
                                                isAI
                                                    ? "bg-card/90 dark:bg-muted/50 text-foreground rounded-tl-none border border-border/80 dark:border-border hover:bg-card"
                                                    : "bg-primary text-primary-foreground rounded-tr-none shadow-primary/30 dark:shadow-primary/20 hover:scale-[1.01]"
                                            )}>

                                                {msg.text}
                                                {isAI && (
                                                    <div className="absolute -left-2 -top-2 h-4 w-4 bg-primary/20 blur-md rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
