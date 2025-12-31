"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2, XCircle, Calendar, User, Briefcase, Bot, ArrowRight, ExternalLink, MessageSquare, Copy, Trash2, Clock, Play, Code, Building2, RefreshCw, AlertTriangle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
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
        if (!rawFeedback.overall || Object.keys(rawFeedback.overall).length === 0) {
            console.log('📊 Using resumption data as overall is empty');
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

    const reportData = {
        candidateName: userMetadata?.full_name || "Candidate",
        position: session.position,
        overallScore: session.score || (feedbackData && feedbackData.overallSkills ? Math.round((feedbackData.overallSkills.reduce((acc: any, s: any) => acc + (s.score || 0), 0) / (feedbackData.overallSkills.length || 1))) : 0),
        date: new Date(session.created_at).toLocaleString(),
        executiveSummary: feedbackData.executiveSummary || "The interview session has been recorded. Detailed AI analysis is pending.",
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
            <div className="space-y-6 overflow-x-hidden max-w-full">
                {/* Header Section */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                    <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                        {/* Mobile Layout: Name + Score on top row, Buttons below */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-between w-full gap-4">
                                {/* Left Side: Name, Position, Badges */}
                                <div className="flex flex-col gap-2 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">{reportData.candidateName}</h1>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg truncate">{reportData.position}</p>
                                </div>

                                {/* Right Side: Score Circle */}
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div className="relative h-16 w-16 md:h-20 md:w-20">
                                        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-slate-100"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className="text-primary"
                                                strokeDasharray={`${reportData.overallScore}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">{reportData.overallScore}%</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">Overall Match</div>
                                </div>
                            </div>

                            {/* Bottom Row: Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
                                <Button onClick={downloadReport} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Full Report
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full sm:w-auto">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Report
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Interview Report</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this interview report? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs Navigation */}
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="bg-transparent p-0 gap-2 mb-6 overflow-x-auto scrollbar-hide flex-nowrap w-full justify-start">
                        <TabsTrigger
                            value="summary"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
                        >
                            Summary
                        </TabsTrigger>
                        <TabsTrigger
                            value="skills"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
                        >
                            Skills Analysis
                        </TabsTrigger>

                        <TabsTrigger
                            value="transcript"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
                        >
                            Full Transcript
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column (Main Content) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Executive Summary */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Executive Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                                            {reportData.executiveSummary}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Strengths & Improvements Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span className="text-2xl">👍</span> Key Strengths
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                {reportData.strengths.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 break-words">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                        <span className="break-words">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span className="text-2xl">⚠️</span> Areas for Improvement
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                {reportData.improvements.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 break-words">
                                                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                        <span className="break-words">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Skills Assessment & Action Plan Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Overall Assessment</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {reportData.overallSkills.map((skill: Skill, i: number) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-slate-100 gap-2">
                                                        <span className="break-words flex-1">{skill.name}</span>
                                                        <span className="text-orange-500 flex-shrink-0">{skill.score}%</span>
                                                    </div>
                                                    <Progress value={skill.score} className="h-2 bg-slate-100" indicatorClassName="bg-primary" />
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 break-words">{skill.feedback}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Recommended Action Plan</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-4">
                                                {reportData.actionPlan.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                        <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                                                            <ArrowRight className="h-3 w-3 text-slate-400" />
                                                        </div>
                                                        <span className="break-words">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Right Column (Sidebar) */}
                            <div className="space-y-6">
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
                                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{reportData.position}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                                Type:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">{session.interview_type}</span>
                                        </div>
                                        {session.config?.selectedAvatar && (
                                            <div className="flex items-center justify-between text-sm gap-2">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                    <Bot className="h-4 w-4" />
                                                    AI Interviewer:
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {(() => {
                                                        const { getAvatarById } = require('@/config/interviewer-avatars');
                                                        const avatar = getAvatarById(session.config.selectedAvatar);
                                                        return avatar ? `${avatar.avatar} ${avatar.name}` : 'AI Agent';
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                        {session.config?.companyInterviewConfig?.companyName && (
                                            <div className="flex items-center justify-between text-sm gap-2">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                    <Building2 className="h-4 w-4" />
                                                    Company:
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{session.config.companyInterviewConfig.companyName}</span>
                                            </div>
                                        )}
                                        {session.config?.companyInterviewConfig?.experienceLevel && (
                                            <div className="flex items-center justify-between text-sm gap-2">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                    <Briefcase className="h-4 w-4" />
                                                    Experience:
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{session.config.companyInterviewConfig.experienceLevel}</span>
                                            </div>
                                        )}
                                        {session.config?.skills && session.config.skills.length > 0 && (
                                            <div className="flex flex-col gap-2 text-sm">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    <Code className="h-4 w-4" />
                                                    Skills Assessed:
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {session.config.skills.map((skill: string, index: number) => (
                                                        <span key={index} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* AI Recommendation */}
                                <Card className={`border-none shadow-sm ${reportData.overallScore >= 70 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200'}`}>
                                    <CardHeader>
                                        <CardTitle className={`text-lg font-bold flex items-center gap-2 ${reportData.overallScore >= 70 ? 'text-green-900' : 'text-red-900'}`}>
                                            {reportData.overallScore >= 70 ? '✅' : '⚠️'} AI Recommendation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className={`text-xl font-bold ${reportData.overallScore >= 70 ? 'text-green-800' : 'text-red-800'}`}>
                                            {reportData.overallScore >= 70 ? 'Proceed to Next Round' : 'Additional Assessment Recommended'}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${reportData.overallScore >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                                            Based on the comprehensive analysis and overall match score of <span className="font-bold">{reportData.overallScore}%</span>, this candidate is {reportData.overallScore >= 70 ? <><span className="font-bold">recommended</span> to proceed to the next stage of the interview process</> : <><span className="font-bold">recommended</span> for additional assessment or skill development before proceeding</>} for the <span className="font-bold">{reportData.position}</span> role.
                                        </p>
                                    </CardContent>
                                </Card>

                            </div>

                        </div>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column (Main Content) */}
                            <div className="lg:col-span-2 space-y-6">
                                {reportData.technicalSkills.length > 0 ? (
                                    <>
                                        {/* Skills Overview Card */}
                                        <Card className="border-none shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Technical Skills Overview</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex flex-col md:flex-row items-center gap-8">
                                                <div className="h-[300px] w-full md:w-1/2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={reportData.technicalSkills}>
                                                            <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                                                            <PolarAngleAxis
                                                                dataKey="name"
                                                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                                                className="text-slate-600 dark:text-slate-300"
                                                            />
                                                            <Radar
                                                                name="Skills"
                                                                dataKey="score"
                                                                stroke="currentColor"
                                                                fill="currentColor"
                                                                fillOpacity={0.2}
                                                                className="text-primary"
                                                            />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
                                                    <div>
                                                        <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                                                            {Math.round(reportData.technicalSkills.reduce((acc: number, s: Skill) => acc + s.score, 0) / reportData.technicalSkills.length)}%
                                                        </div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">Average Technical Skill Score</div>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        Assessment based on {reportData.technicalSkills.length} technical skill{reportData.technicalSkills.length !== 1 ? 's' : ''} specified during interview setup.
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Detailed Skills Grid */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {reportData.technicalSkills.map((skill: Skill, i: number) => (
                                                <Card key={i} className="border-none shadow-sm">
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{skill.name}</CardTitle>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${skill.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {skill.score}%
                                                        </span>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 pt-4">
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed min-h-[60px]">
                                                            {skill.feedback}
                                                        </p>
                                                        <div className="pt-4 border-t border-slate-100">
                                                            <a href="#" className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                                                                Recommended Resources
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Card className="border-none shadow-sm">
                                        <CardContent className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Code className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Technical Skills Specified</h3>
                                                    <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-md mx-auto">
                                                        No specific technical skills were provided during interview setup. The overall assessment is available in the Summary tab.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right Column (Sidebar) - Duplicated for now as per design request to show same sidebar */}
                            <div className="space-y-6">
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
                                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{reportData.position}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                                Type:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">{session.interview_type}</span>
                                        </div>
                                        {session.config?.selectedAvatar && (
                                            <div className="flex items-center justify-between text-sm gap-2">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                    <Bot className="h-4 w-4" />
                                                    AI Interviewer:
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {(() => {
                                                        const { getAvatarById } = require('@/config/interviewer-avatars');
                                                        const avatar = getAvatarById(session.config.selectedAvatar);
                                                        return avatar ? `${avatar.avatar} ${avatar.name}` : 'AI Agent';
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                        {session.config?.companyInterviewConfig?.companyName && (
                                            <div className="flex items-center justify-between text-sm gap-2">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                    <Building2 className="h-4 w-4" />
                                                    Company:
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{session.config.companyInterviewConfig.companyName}</span>
                                            </div>
                                        )}
                                        {session.config?.companyInterviewConfig?.experienceLevel && (
                                            <div className="flex items-center justify-between text-sm gap-2">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                    <Briefcase className="h-4 w-4" />
                                                    Experience:
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{session.config.companyInterviewConfig.experienceLevel}</span>
                                            </div>
                                        )}
                                        {session.config?.skills && session.config.skills.length > 0 && (
                                            <div className="flex flex-col gap-2 text-sm">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    <Code className="h-4 w-4" />
                                                    Skills Assessed:
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {session.config.skills.map((skill: string, index: number) => (
                                                        <span key={index} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>


                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Full Width Transcript */}
                            <div className="lg:col-span-3">
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    Interview Transcript
                                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-white dark:text-slate-300">
                                                        {reportData.transcript.length} messages
                                                    </span>
                                                </CardTitle>

                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={copyTranscriptToClipboard}
                                                className="flex items-center gap-2"
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span className="hidden md:inline">Copy Transcript</span>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {reportData.transcript.length === 1 && reportData.transcript[0].text.includes("No transcript available") ? (
                                            // Empty state with helpful info
                                            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                                <p className="text-lg font-medium">No conversation recorded</p>
                                                <p className="text-sm mb-4">The interview transcript is not available or the session may have been too short.</p>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-xs text-amber-800 mt-6">
                                                    <p className="font-medium mb-2">💡 Why might the transcript be missing?</p>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        <li>The interview session ended before any conversation was recorded</li>
                                                        <li>There was a connection issue during the interview</li>
                                                        <li>The transcript is still being processed (refresh in a few seconds)</li>
                                                        <li>The interview was paused for a coding challenge and not resumed</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : (
                                            // Actual transcript messages
                                            reportData.transcript.map((msg: TranscriptMessage) => (
                                                <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-transparent text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {msg.sender === 'ai' ? <img src="/favicon.ico" alt="AI" className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                                    </div>
                                                    <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${msg.sender === 'ai'
                                                            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-white rounded-tl-none'
                                                            : 'bg-emerald-600 text-white rounded-tr-none'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                            {msg.timestamp}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
