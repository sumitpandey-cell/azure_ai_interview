"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Play, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { toast } from "sonner";
import { ReportPageSkeleton } from "@/components/ReportPageSkeleton";
import { ErrorSeverity, FeedbackError } from "@/lib/feedback-error";
import { useFeedback } from "@/context/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";
import { SessionFeedback } from "@/components/SessionFeedback";

import { FeedbackReport, type FeedbackReportData } from "@/components/FeedbackReport";

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

    const reportData: FeedbackReportData = {
        candidateName: userMetadata?.full_name || "Candidate",
        position: session?.position || "Interview Report",
        interviewType: session?.interview_type,
        overallScore: overallScore,
        date: session ? new Date(session.created_at).toLocaleString() : "-",
        durationSeconds: session?.duration_seconds || 0,
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
                    };
                })
                .filter((msg) => msg.text.trim())
            : [
                { id: 1, speaker: "ai", text: "No transcript available. The interview may not have contained any recorded conversation.", timestamp: "-" },
            ],
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
                    return <ReportPageSkeleton />;
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
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <FeedbackReport
                            data={reportData}
                            onGenerateRoadmap={() => router.push('/roadmap')}
                            onDelete={handleDelete}
                            themeKey={sessionId || 'student-report'}
                        />

                        <div className="mt-8">
                            <SessionFeedback sessionId={sessionId!} />
                        </div>
                    </div>
                );
            })()}
        </DashboardLayout>
    );
}
