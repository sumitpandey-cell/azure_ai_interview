"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-duration";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2, XCircle, Calendar, User, Briefcase, Bot, ArrowRight, ExternalLink, MessageSquare, Copy, Trash2, Clock, Play, Code, Building2, RefreshCw, AlertTriangle, TrendingUp, Target, Shield, Award, Activity, FileText, Share2, Sparkles, Star, ChevronRight, Timer } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { downloadHTMLReport } from "@/lib/report-download";
import { Badge } from "@/components/ui/badge";
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
import { classifyError, ErrorSeverity, FeedbackError, shouldRetry, getRetryDelay, getRetryMessage } from "@/lib/feedback-error";
import { useFeedback } from "@/context/FeedbackContext";

interface InterviewSession {
    id: string;
    interview_type: string;
    position: string;
    score: number | null;
    status: string;
    created_at: string;
    duration_seconds: number | null;
    config?: any; // JSONB field for storing interview configuration
    feedback: any;
    transcript: any;
}

interface Skill {
    name: string;
    score: number;
    feedback: string;
}

interface TranscriptMessage {
    id: string | number;
    sender: string;
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
    const { user } = useAuth();
    const userMetadata = user?.user_metadata as UserMetadata | undefined;
    const [loading, setLoading] = useState(true);
    const { feedback: instantFeedback, transcript: instantTranscript, isSaving, saveError } = useInterviewStore();
    const { fetchSessionDetail, deleteInterviewSession } = useOptimizedQueries();
    const { generateFeedbackInBackground } = useFeedback();
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [feedbackTimeout, setFeedbackTimeout] = useState(false);
    const [errorState, setErrorState] = useState<FeedbackError | null>(null);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const MAX_RETRIES = 5;

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            if (sessionId) {
                const data = await fetchSessionDetail(sessionId);
                if (data) {
                    setSession(data as InterviewSession);
                    // Automatically trigger generation if report is missing
                    if (data.status === 'completed' && !data.feedback) {
                        console.log("🔍 [ReportPage] Report missing, triggering generation...");
                        generateFeedbackInBackground(sessionId);
                    }
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
    };

    // Poll for feedback if it's being generated
    const isFeedbackGenerating = session?.status === 'completed' &&
        !session?.feedback &&
        (!instantFeedback || !instantFeedback.skills || instantFeedback.skills.length === 0);

    useEffect(() => {
        if (!isFeedbackGenerating || !sessionId) return;

        let pollCount = 0;
        const MAX_POLLS = 20; // 20 polls × 3 seconds = 60 seconds timeout

        // Smart polling with retry logic
        const pollWithRetry = async (): Promise<'SUCCESS' | 'PENDING' | 'RETRY' | 'FATAL'> => {
            try {
                const data = await fetchSessionDetail(sessionId, true);

                if (data?.feedback) {
                    // Success! Feedback is ready
                    setSession(data as InterviewSession);
                    setErrorState(null);
                    setRetryAttempt(0);
                    toast.success("Feedback report is ready!");
                    return 'SUCCESS';
                }

                return 'PENDING';
            } catch (error) {
                console.error("Error polling for feedback:", error);

                // Classify the error
                const classified = classifyError(error, undefined, retryAttempt);

                // Check if we should retry
                if (shouldRetry(classified, MAX_RETRIES)) {
                    // Network issue - retry with exponential backoff
                    const nextRetryCount = retryAttempt + 1;
                    setRetryAttempt(nextRetryCount);

                    const retryMessage = getRetryMessage(retryAttempt, MAX_RETRIES);
                    toast.warning(retryMessage, { duration: getRetryDelay(retryAttempt) });

                    // Schedule next retry with exponential backoff
                    setTimeout(() => {
                        // Trigger re-poll by updating a dependency
                    }, getRetryDelay(retryAttempt));

                    return 'RETRY';
                } else {
                    // Fatal error or max retries exceeded
                    const finalError: FeedbackError = {
                        ...classified,
                        retryCount: retryAttempt,
                    };

                    if (retryAttempt >= MAX_RETRIES && classified.severity === ErrorSeverity.RETRYABLE) {
                        finalError.message = 'Network connection unstable. Please check your internet and try again.';
                        finalError.severity = ErrorSeverity.FATAL; // Treat as fatal after max retries
                    }

                    setErrorState(finalError);
                    toast.error(finalError.message);
                    return 'FATAL';
                }
            }
        };

        const pollInterval = setInterval(async () => {
            pollCount++;

            const result = await pollWithRetry();

            // Stop polling on success or fatal error
            if (result === 'SUCCESS' || result === 'FATAL') {
                clearInterval(pollInterval);
                return;
            }

            // Timeout after 60 seconds of pending state
            if (pollCount >= MAX_POLLS && result === 'PENDING') {
                clearInterval(pollInterval);
                setFeedbackTimeout(true);
                toast.error("Feedback generation is taking longer than expected.");
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [isFeedbackGenerating, sessionId, retryAttempt]);

    const copyTranscriptToClipboard = async () => {
        try {
            const transcriptText = reportData.transcript
                .map((msg: TranscriptMessage) => {
                    const speaker = msg.sender === 'ai' ? 'AI Interviewer' : 'Candidate';
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


    if (loading) {
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

    // Check for insufficient data
    if ((session.feedback as any)?.note === 'Insufficient data for report generation') {
        return (
            <DashboardLayout>
                <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
                    <Card className="max-w-md w-full border-none shadow-2xl bg-white dark:bg-slate-800">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Report Not Available
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    This interview was too short or had insufficient interaction to generate a meaningful AI feedback report.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-left space-y-3">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Requirements for report generation:</p>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        Minimum 2 minutes of duration
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        At least 2 unique user responses
                                    </li>
                                </ul>
                            </div>

                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl"
                            >
                                Return to Dashboard
                            </Button>
                        </CardContent>
                    </Card>

                    {session.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 && (
                        <div className="mt-8 w-full max-w-md">
                            <p className="text-xs text-center text-slate-500 mb-4 uppercase tracking-widest font-bold">Session Transcript</p>
                            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-h-60 overflow-y-auto space-y-3">
                                {(session.transcript as any[]).map((msg: any, idx: number) => (
                                    <div key={idx} className="text-xs">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase mr-2">{msg.sender === 'ai' ? 'AI' : 'You'}:</span>
                                        <span className="text-slate-600 dark:text-slate-400">{msg.text}</span>
                                    </div>
                                ))}
                            </div>
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
                <div className="space-y-6 overflow-x-hidden max-w-full">
                    {/* Header Section */}
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">{userMetadata?.full_name || "Candidate"}</h1>
                                        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg truncate">{session.position}</p>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div className="flex-shrink-0">
                                    <div className="text-sm px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 font-medium whitespace-nowrap">In Progress</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Incomplete Message */}
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Interview In Progress</h2>
                                    <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                                        This interview hasn't been completed yet. Continue your interview to receive detailed feedback and analysis.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => {
                                            if (sessionId) {
                                                const stage = (session.config as any)?.currentStage || 'avatar';
                                                router.push(`/interview/${sessionId}/${stage}`);
                                            }
                                        }}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        Continue Interview
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Details */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Interview Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    <User className="h-4 w-4" />
                                    Candidate:
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{userMetadata?.full_name || "Candidate"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    <Calendar className="h-4 w-4" />
                                    Started:
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words">{new Date(session.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    <Briefcase className="h-4 w-4" />
                                    Position:
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{session.position}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    <Bot className="h-4 w-4" />
                                    Type:
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">{session.interview_type.replace('_', ' ')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Show skeleton while generating feedback (non-blocking)
    if (isFeedbackGenerating && !feedbackTimeout && !errorState) {
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
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                        {userMetadata?.full_name || "Candidate"}
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 text-lg">
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
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                        {isFatal
                                            ? 'Feedback Generation Failed'
                                            : 'Network Connection Issue'}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 max-w-md">
                                        {errorState.message}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                {isRetryable ? (
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            onClick={() => {
                                                setErrorState(null);
                                                setRetryAttempt(0);
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
                                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-left">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Technical Details:
                                            </p>
                                            <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">
                                                Session ID: {sessionId}
                                            </p>
                                            {errorState.code && (
                                                <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                                    Error Code: {errorState.code}
                                                </p>
                                            )}
                                            {errorState.technicalDetails && (
                                                <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                    {errorState.technicalDetails}
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Please contact the developer with the above information if this issue persists.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button
                                                onClick={() => {
                                                    setErrorState(null);
                                                    setRetryAttempt(0);
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
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    Your interview conversation was saved. You can review it below while we work on the feedback issue.
                                </p>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {(session.transcript as any[]).slice(0, 5).map((msg: any, idx: number) => (
                                        <div key={idx} className={`p-3 rounded-lg ${msg.sender === 'ai'
                                            ? 'bg-blue-50 dark:bg-blue-950/20'
                                            : 'bg-slate-50 dark:bg-slate-800'
                                            }`}>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                                {msg.sender === 'ai' ? 'AI Interviewer' : 'You'}
                                            </p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                {msg.text}
                                            </p>
                                        </div>
                                    ))}
                                    {(session.transcript as any[]).length > 5 && (
                                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                            + {(session.transcript as any[]).length - 5} more messages
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
                                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                                        Feedback generation is taking longer than usual. This might be due to:
                                    </p>
                                </div>
                                <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    <li>• High server load or API rate limits</li>
                                    <li>• Complex interview requiring detailed analysis</li>
                                    <li>• Temporary service issue</li>
                                </ul>
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <Button
                                        onClick={() => {
                                            if (sessionId) {
                                                setFeedbackTimeout(false);
                                                generateFeedbackInBackground(sessionId);
                                                // Re-trigger polling by reloading or just setting pollCount=0 if we were in useEffect
                                                window.location.reload();
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

    const mergeFeedback = (dbFeedback: any, instant: any) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            // Instant is newer: shallow-merge, preferring instant fields when present
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

    // Handle feedback structure - check if it has resumptions array
    let rawFeedback = session?.feedback;
    if (rawFeedback && rawFeedback.resumptions && Array.isArray(rawFeedback.resumptions) && rawFeedback.resumptions.length > 0) {
        // If overall is empty but resumptions exist, use first resumption
        // Also check if overall lacks executiveSummary which is a sign of incomplete aggregation
        if (!rawFeedback.overall || Object.keys(rawFeedback.overall).length === 0 || !rawFeedback.overall.executiveSummary) {
            console.log('📊 Using resumption data as overall is empty or lacks summary');
            rawFeedback = rawFeedback.resumptions[0];
        } else {
            rawFeedback = rawFeedback.overall;
        }
    }

    const feedbackData = mergeFeedback(rawFeedback, instantFeedback);

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
    const overallSkills = feedbackData.overallSkills || feedbackData.skills || [
        { name: "Technical Knowledge", score: 0, feedback: "Pending..." },
        { name: "Communication", score: 0, feedback: "Pending..." },
        { name: "Problem Solving", score: 0, feedback: "Pending..." },
        { name: "Cultural Fit", score: 0, feedback: "Pending..." }
    ];

    const technicalSkills = feedbackData.technicalSkills || [];
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

    const overallScore = session.score || (feedbackData && feedbackData.overallSkills ? Math.round((feedbackData.overallSkills.reduce((acc: any, s: any) => acc + (s.score || 0), 0) / (feedbackData.overallSkills.length || 1))) : 0);

    const reportData = {
        candidateName: userMetadata?.full_name || "Candidate",
        position: session.position,
        overallScore: overallScore,
        date: new Date(session.created_at).toLocaleString(),
        executiveSummary: feedbackData.executiveSummary || "The interview session has been recorded. Detailed AI analysis is pending.",
        rankGrade: calculateGrade(overallScore),
        strengths: feedbackData.strengths || ["Pending analysis..."],
        improvements: feedbackData.improvements || ["Pending analysis..."],
        overallSkills: overallSkills,
        technicalSkills: technicalSkills,
        // Deprecated: kept for backward compatibility in downloads
        skills: feedbackData.skills || overallSkills,
        actionPlan: feedbackData.actionPlan || ["Wait for full AI report generation."],
        // Ensure transcript format is consistent and filter AI internal thoughts
        transcript: transcriptData.length > 0
            ? transcriptData
                .filter((msg: any) => msg && (msg.sender || msg.speaker) && msg.text && msg.text.trim()) // Filter out invalid messages
                .map((msg: any, index: number) => {
                    let cleanedText = msg.text.trim();
                    const sender = msg.sender || msg.speaker; // Handle both sender and speaker fields

                    // Remove AI internal thoughts (e.g., **Thinking**, **Analysis**, etc.)
                    if (sender === 'ai') {
                        cleanedText = cleanedText.replace(/\*\*[^*]+\*\*\s*/g, '');
                    }

                    return {
                        id: msg.id || index,
                        sender: sender,
                        text: cleanedText,
                        timestamp: msg.timestamp || "Just now"
                    };
                })
                .filter((msg: any) => msg.text.trim()) // Remove messages that became empty after filtering
            : [
                { id: 1, sender: "ai", text: "No transcript available. The interview may not have contained any recorded conversation.", timestamp: "-" },
            ]
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 sm:pt-0">
                {/* Header Section */}
                <div className="relative mb-2">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 relative z-10">
                        <div className="space-y-2 sm:space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm animate-in fade-in slide-in-from-left duration-1000">
                                <Bot className="h-3.5 w-3.5" />
                                Intelligence Profile
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                                    {reportData.candidateName} <span className="text-primary italic">Analytics</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                                    <div className="px-4 py-1.5 rounded-full bg-card/40 backdrop-blur-3xl border border-white/5 shadow-2xl">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">{reportData.position}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,195,77,0.4)]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">{session.interview_type.replace('_', ' ')} Protocol</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:pb-2">
                            <Button
                                onClick={downloadReport}
                                className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-card/40 backdrop-blur-3xl border border-white/5 hover:bg-card/60 text-foreground font-black uppercase tracking-[0.15em] text-[9px] sm:text-[10px] transition-all shadow-2xl group/btn"
                            >
                                <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                Export Intel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (sessionId) {
                                        generateFeedbackInBackground(sessionId);
                                        window.location.reload();
                                    }
                                }}
                                className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-[0.15em] text-[9px] sm:text-[10px] transition-all shadow-xl shadow-primary/20 group/btn"
                            >
                                <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-700" />
                                Recalibrate
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl flex items-center justify-center p-0"
                                    >
                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2.5rem] border-2 border-white/10 shadow-3xl p-10 bg-card/90 backdrop-blur-3xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-white">Purge Intelligence?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground/80 font-medium">
                                            This action will permanently delete this analysis record. This operational data cannot be recovered.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-8 gap-4">
                                        <AlertDialogCancel className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white">Abort</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="h-12 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20"
                                        >
                                            Execute Purge
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
                    <Card className="xl:col-span-1 border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative group">
                        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                        <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center h-full gap-6 sm:gap-8 text-center relative z-10">
                            <div className="relative h-40 w-40 sm:h-48 sm:w-48 group-hover:scale-105 transition-all duration-1000">
                                <svg className="h-full w-full transform -rotate-90 filter drop-shadow-[0_0_20px_rgba(var(--primary),0.2)]" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="42"
                                        className="fill-none stroke-white/5"
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
                                    <span className="text-5xl sm:text-6xl font-black tracking-tighter tabular-nums text-foreground">{reportData.overallScore}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mt-2">Analytical Grade</span>
                                </div>
                                <div className="absolute -inset-8 bg-primary/10 blur-[60px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            </div>

                            <div className="space-y-3">
                                <div className={cn(
                                    "px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl backdrop-blur-xl",
                                    reportData.overallScore >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/5" : "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-rose-500/5"
                                )}>
                                    {reportData.overallScore >= 70 ? 'Primary Deployment' : 'Tactical Recalibration'}
                                </div>
                                <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-2 leading-none">Status: <span className="text-foreground/60">{reportData.overallScore >= 70 ? 'Validated' : 'Needs Optimization'}</span></p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Executive Overview */}
                    <Card className="xl:col-span-3 border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative group/executive">
                        <div className="absolute top-0 right-0 h-full w-64 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                        <CardContent className="p-6 sm:p-8 md:p-10 relative z-10">
                            <div className="flex flex-col h-full gap-6 sm:gap-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase text-foreground">Executive Overview</h3>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">Protocol Intelligence Summary</p>
                                    </div>
                                    <div className="hidden sm:flex gap-6 px-5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Temporal Log</span>
                                            <span className="text-xs font-black tabular-nums text-white/70 uppercase">{reportData.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-base sm:text-lg font-medium leading-relaxed max-w-5xl italic border-l-4 border-primary/30 pl-4 sm:pl-6 py-2 bg-gradient-to-r from-primary/5 to-transparent rounded-r-2xl sm:rounded-r-3xl">
                                    "{reportData.executiveSummary}"
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-auto pt-6 sm:pt-8 border-t border-white/5">
                                    {[
                                        { label: "Duration", value: formatDuration(session.duration_seconds || 0), icon: Timer, color: "text-amber-500" },
                                        { label: "Competencies", value: reportData.overallSkills.length, icon: Target, color: "text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" },
                                        { label: "AI Response", value: reportData.transcript.filter((m: any) => m.sender === 'ai').length, icon: MessageSquare, color: "text-blue-500" },
                                        { label: "Rank Grade", value: reportData.rankGrade, icon: Award, color: "text-emerald-500" }
                                    ].map((m, i) => (
                                        <div key={i} className="flex items-center gap-4 group/metric">
                                            <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shadow-xl border border-white/10 group-hover/metric:scale-110 group-hover/metric:bg-white/10 transition-all duration-500", m.color)}>
                                                <m.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{m.label}</span>
                                                <span className="text-xs sm:text-sm font-black text-foreground uppercase truncate tracking-widest mt-0.5">{m.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tactical Analysis Tabs */}
                <Tabs defaultValue="insights" className="w-full">
                    <TabsList className="bg-white/5 p-1 sm:p-1.5 rounded-2xl sm:rounded-[2.5rem] h-12 sm:h-14 md:h-16 mb-6 sm:mb-8 md:mb-12 inline-flex border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <TabsTrigger value="insights" className="rounded-xl sm:rounded-[2rem] px-4 sm:px-8 md:px-12 data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] h-full transition-all duration-500">Insights</TabsTrigger>
                        <TabsTrigger value="skills" className="rounded-xl sm:rounded-[2rem] px-4 sm:px-8 md:px-12 data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] h-full transition-all duration-500">Competencies</TabsTrigger>
                        <TabsTrigger value="transcript" className="rounded-xl sm:rounded-[2rem] px-4 sm:px-8 md:px-12 data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] h-full transition-all duration-500">Transcript</TabsTrigger>
                    </TabsList>

                    <TabsContent value="insights" className="space-y-4 sm:space-y-6 md:space-y-8 outline-none animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                            {/* Strengths Card */}
                            <Card className="border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative group/strengths">
                                <div className="absolute top-0 right-0 h-48 w-48 bg-emerald-500/5 blur-[80px] rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
                                <CardHeader className="p-4 sm:p-6 md:p-8 pb-0">
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight flex items-center gap-3 sm:gap-4 uppercase text-emerald-500">
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                            <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        Tactical Strengths
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
                                    {reportData.strengths.map((item: string, i: number) => (
                                        <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 group-hover/strengths:bg-emerald-500/[0.05] group-hover/strengths:border-emerald-500/20 transition-all duration-700">
                                            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-foreground/80 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Improvements Card */}
                            <Card className="border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative group/improvements">
                                <div className="absolute top-0 right-0 h-48 w-48 bg-rose-500/5 blur-[80px] rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
                                <CardHeader className="p-4 sm:p-6 md:p-8 pb-0">
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight flex items-center gap-3 sm:gap-4 uppercase text-rose-500">
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
                                            <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        Growth Directives
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
                                    {reportData.improvements.map((item: string, i: number) => (
                                        <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 group-hover/improvements:bg-rose-500/[0.05] group-hover/improvements:border-rose-500/20 transition-all duration-700">
                                            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-foreground/80 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Plan - Navigate to Roadmap */}
                        <Card className="border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative group/plan">
                            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                            <div className="absolute top-0 right-0 h-full w-96 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

                            <CardContent className="p-6 sm:p-8 md:p-10 relative z-10">
                                <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
                                    {/* Icon and Title */}
                                    <div className="flex-shrink-0">
                                        <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-2xl shadow-primary/10 group-hover/plan:scale-110 group-hover/plan:rotate-6 transition-all duration-700">
                                            <Star className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-3 sm:space-y-4 text-center lg:text-left">
                                        <div className="space-y-1 sm:space-y-2">
                                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase text-foreground">
                                                Strategic Action Plan
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.4em]">
                                                Personalized Learning Roadmap
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
                                            className="w-full lg:w-auto h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group/btn"
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
                            <Card className="lg:col-span-1 border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative group/radar">
                                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                                <CardHeader className="p-8 sm:p-10 pb-0 relative z-10">
                                    <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-foreground">Competency Map</h3>
                                    <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.4em] mt-2">Vector Positioning</p>
                                </CardHeader>
                                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px] relative z-10">
                                    <div className="h-[350px] w-full group-hover:scale-110 transition-transform duration-1000">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={reportData.overallSkills}>
                                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                                <PolarAngleAxis
                                                    dataKey="name"
                                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                                                />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar
                                                    name="Competency"
                                                    dataKey="score"
                                                    stroke="#A855F7"
                                                    strokeWidth={3}
                                                    fill="#A855F7"
                                                    fillOpacity={0.2}
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
                                        <Card className="h-full border border-white/5 shadow-xl bg-card/40 backdrop-blur-3xl hover:bg-white/[0.05] hover:border-primary/20 rounded-[2rem] transition-all duration-700 overflow-hidden">
                                            <CardContent className="p-8 space-y-8">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <h4 className="text-lg font-black tracking-tight text-foreground uppercase leading-none">{skill.name}</h4>
                                                        <p className="text-[9px] text-primary/60 font-black uppercase tracking-[0.3em] leading-none">Intelligence Metric</p>
                                                    </div>
                                                    <div className="text-3xl font-black text-primary tabular-nums tracking-tighter shadow-primary/20 drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">{skill.score}%</div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
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
                                                                <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-2 group-hover/text:text-primary transition-colors">
                                                                    Click to read more →
                                                                </p>
                                                            )}
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl rounded-[2rem] border-2 border-white/10 bg-card/95 backdrop-blur-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
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
                                                            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
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
                                        <h3 className="text-2xl font-black tracking-tight uppercase text-foreground">Technical Skills Assessment</h3>
                                        <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.4em]">Candidate-Specified Technologies</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reportData.technicalSkills.map((skill: Skill, i: number) => (
                                        <Card key={i} className="border border-white/5 shadow-xl bg-card/40 backdrop-blur-3xl hover:bg-white/[0.05] hover:border-blue-500/20 rounded-[2rem] transition-all duration-700 overflow-hidden group/tech">
                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-black tracking-tight text-foreground uppercase leading-none">{skill.name}</h4>
                                                        <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-[0.3em] leading-none">Tech Stack</p>
                                                    </div>
                                                    <div className="text-2xl font-black text-blue-500 tabular-nums tracking-tighter">{skill.score}%</div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
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
                                                                <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-widest mt-2 group-hover/techtext:text-blue-500 transition-colors">
                                                                    View details →
                                                                </p>
                                                            )}
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl rounded-[2rem] border-2 border-white/10 bg-card/95 backdrop-blur-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
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
                                                            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
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
                            "border-2 shadow-2xl rounded-[2.5rem] overflow-hidden p-1 relative",
                            reportData.overallScore >= 70 ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"
                        )}>
                            <CardContent className="p-10 flex flex-col lg:flex-row items-center gap-10">
                                <div className={cn(
                                    "h-24 w-24 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl",
                                    reportData.overallScore >= 70 ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                                )}>
                                    {reportData.overallScore >= 70 ? <CheckCircle2 className="h-12 w-12" /> : <AlertTriangle className="h-12 w-12" />}
                                </div>
                                <div className="flex-1 space-y-4 text-center lg:text-left">
                                    <h3 className={cn("text-3xl font-black uppercase tracking-tight", reportData.overallScore >= 70 ? "text-emerald-500" : "text-rose-500")}>
                                        {reportData.overallScore >= 70 ? "Operational Deployment Recommended" : "Deployment Delay Suggested"}
                                    </h3>
                                    <p className="text-lg font-medium text-foreground/80 leading-relaxed max-w-4xl">
                                        Based on a deep-dive analysis of tactical responses and core competencies, this profile exhibits
                                        {reportData.overallScore >= 70
                                            ? " strong alignment with organizational objectives. Direct engagement in subsequent mission phases is highly recommended."
                                            : " significant gaps in critical operational areas. Further training and technical recalibration are advised prior to next engagement."
                                        }
                                    </p>
                                </div>
                                <Button asChild className={cn(
                                    "h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-[12px] group",
                                    reportData.overallScore >= 70 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
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
                        <Card className="border border-white/5 shadow-3xl bg-card/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 sm:p-10 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-foreground">Intelligence Transcript</h3>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.4em] ml-14">Source: Session Protocol Log • {reportData.transcript.length} Transmissions</p>
                                </div>
                                <Button
                                    onClick={copyTranscriptToClipboard}
                                    className="h-11 px-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all ml-14 sm:ml-0"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Export Logs
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8 sm:p-12 space-y-10 max-h-[800px] overflow-y-auto no-scrollbar relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />
                                {reportData.transcript.map((msg: TranscriptMessage, i: number) => {
                                    const isAI = msg.sender === 'ai';
                                    return (
                                        <div key={i} className={cn(
                                            "flex flex-col gap-3 max-w-[90%] md:max-w-[70%] animate-in fade-in slide-in-from-bottom-4 duration-700",
                                            !isAI ? "ml-auto items-end" : "items-start"
                                        )}>
                                            <div className={cn("flex items-center gap-3 px-2", !isAI && "flex-row-reverse")}>
                                                <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center border text-[8px] font-black uppercase tracking-widest",
                                                    isAI ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-white/40"
                                                )}>
                                                    {isAI ? 'AI' : 'YOU'}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 tabular-nums">{msg.timestamp}</span>
                                            </div>
                                            <div className={cn(
                                                "p-6 sm:p-8 rounded-[2.5rem] text-sm sm:text-base font-bold leading-relaxed shadow-2xl relative group/msg transition-all duration-500",
                                                isAI
                                                    ? "bg-white/[0.03] text-foreground rounded-tl-none border border-white/5 hover:bg-white/[0.05]"
                                                    : "bg-primary text-black rounded-tr-none shadow-primary/20 hover:scale-[1.01]"
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
