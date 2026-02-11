"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { interviewService } from "@/services/interview.service";
import { toast } from "sonner";
import { ReportPageSkeleton } from "@/components/ReportPageSkeleton";
import type { InterviewSession } from "@/services/interview.service";

import { FeedbackReport, type FeedbackReportData } from "@/components/FeedbackReport";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackError } from "@/lib/feedback-error";

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

export default function RecruiterInterviewReport() {
    const router = useRouter();
    const params = useParams();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : params.sessionId?.[0];
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [feedbackTimeout, setFeedbackTimeout] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [errorState, setErrorState] = useState<FeedbackError | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchSession = useCallback(async (forceRefresh = false) => {
        if (forceRefresh) {
            // Placeholder for force refresh logic if needed
        }
        try {
            setLoading(true);
            if (sessionId) {
                const data = await interviewService.getSessionById(sessionId);
                if (data) {
                    setSession(data as unknown as InterviewSession);
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
        if (!authLoading && user && sessionId && !session) {
            fetchSession();
        }
    }, [authLoading, user, sessionId, session, fetchSession]);

    const isFeedbackGenerating = session?.status === 'completed' && !session?.feedback;

    useEffect(() => {
        if (!isFeedbackGenerating || !sessionId) return;

        const channel = supabase
            .channel(`recruiter_session_feedback_${sessionId}`)
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
                        setFeedbackTimeout(false);
                        toast.success("Candidate feedback report is ready!");
                    }
                }
            )
            .subscribe();

        const timeoutId = setTimeout(() => {
            if (isFeedbackGenerating) {
                setFeedbackTimeout(true);
            }
        }, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearTimeout(timeoutId);
        };
    }, [isFeedbackGenerating, sessionId]);

    if (!mounted || loading || authLoading) {
        return <ReportPageSkeleton />;
    }

    if (!session) return null;

    if (isFeedbackGenerating && !feedbackTimeout && !errorState) {
        return <ReportPageSkeleton />;
    }

    // Use the session fields directly since they are available on the InterviewSession type
    const sessionData = session;

    // Normalize Feedback Data (Unify with student side logic)
    let extractedFeedback = (sessionData.feedback || null) as Record<string, unknown> | null;
    if (extractedFeedback) {
        if (extractedFeedback.overall && typeof extractedFeedback.overall === 'object') {
            extractedFeedback = extractedFeedback.overall as Record<string, unknown>;
        } else if (Array.isArray(extractedFeedback.resumptions) && extractedFeedback.resumptions.length > 0) {
            if (!extractedFeedback.overall || Object.keys(extractedFeedback.overall).length === 0 || !extractedFeedback.executiveSummary) {
                extractedFeedback = extractedFeedback.resumptions[0];
            }
        }
    }

    const feedbackData = extractedFeedback || {};

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

    const overallScore = sessionData.score || Math.round((overallSkills as Skill[]).reduce((acc, s) => acc + (s.score || 0), 0) / (overallSkills.length || 1));

    let dbTranscript = sessionData.transcript || [];
    if (typeof dbTranscript === 'string') {
        try {
            dbTranscript = JSON.parse(dbTranscript);
        } catch (e) {
            console.error("Failed to parse transcript string:", e);
            dbTranscript = [];
        }
    }

    const reportData: FeedbackReportData = {
        candidateName: sessionData.candidate_name || "Guest Candidate",
        position: sessionData.position || "Interview Report",
        interviewType: sessionData.interview_type,
        overallScore: overallScore,
        date: sessionData.created_at ? new Date(sessionData.created_at).toLocaleString() : "-",
        durationSeconds: sessionData.duration_seconds || 0,
        executiveSummary: (typeof feedbackData.executiveSummary === 'string' ? feedbackData.executiveSummary : null) ||
            (typeof feedbackData.note === 'string' ? feedbackData.note : null) ||
            (typeof feedbackData.error === 'string' ? feedbackData.error : null) ||
            "The interview session has been recorded. Analysis insights are being processed based on your conversation.",
        rankGrade: calculateGrade(overallScore),
        strengths: (Array.isArray(feedbackData.strengths) ? feedbackData.strengths : null) || ["Analysis not available for this session"],
        improvements: (Array.isArray(feedbackData.improvements) ? feedbackData.improvements : null) || ["Analysis not available for this session"],
        overallSkills: overallSkills as Skill[],
        technicalSkills: technicalSkills as Skill[],
        actionPlan: (Array.isArray(feedbackData.actionPlan) ? feedbackData.actionPlan : null) || ["Review candidate transcript for manual evaluation."],
        transcript: Array.isArray(dbTranscript)
            ? (dbTranscript as Array<{ speaker?: string; sender?: string; role?: string; text?: string; id?: string | number; timestamp?: string }>)
                .filter((m) => m && (m.speaker || m.sender || m.role) && m.text)
                .map((m, i): TranscriptMessage => ({
                    id: m.id || i,
                    speaker: ['ai', 'agent', 'model', 'assistant'].includes(((m.speaker || m.sender || m.role || 'candidate') as string).toLowerCase()) ? 'ai' : 'user',
                    text: m.text || "",
                    timestamp: m.timestamp || '-'
                }))
            : [{ id: 1, speaker: "ai", text: "No transcript available.", timestamp: "-" }]
    };

    const isInProgress = session && session.status !== 'completed';

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-2">
                {(() => {
                    if (isInProgress) {
                        return (
                            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                                <Card className="max-w-md w-full border-none shadow-2xl bg-card/80 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] p-12 text-center space-y-8">
                                    <div className="relative mx-auto h-20 w-20 bg-amber-500/10 rounded-3xl flex items-center justify-center">
                                        <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold uppercase tracking-widest">
                                            Active Session
                                        </div>
                                        <h2 className="text-2xl font-bold uppercase tracking-tight">Interview In Progress</h2>
                                        <p className="text-muted-foreground text-sm font-medium">
                                            The candidate is currently in the middle of this interview.
                                            The evaluation report will be available once the session is completed.
                                        </p>
                                    </div>
                                    <Button onClick={() => router.back()} variant="outline" className="w-full rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">
                                        Go Back
                                    </Button>
                                </Card>
                            </div>
                        );
                    }

                    if (feedbackTimeout) {
                        return (
                            <div className="min-h-[60vh] flex items-center justify-center p-4">
                                <Card className="max-w-2xl w-full border-none shadow-2xl p-12 text-center space-y-6">
                                    <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                                        <XCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-red-600 tracking-tight">Evaluation Delayed</h2>
                                    <p className="text-muted-foreground text-lg">AI analysis is taking longer than expected for this candidate. Please refresh the page or check back later.</p>
                                    <div className="flex justify-center gap-4 pt-4">
                                        <Button onClick={() => { setFeedbackTimeout(false); fetchSession(true); }} className="bg-emerald-600">
                                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Now
                                        </Button>
                                        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                                    </div>
                                </Card>
                            </div>
                        );
                    }

                    return (
                        <FeedbackReport
                            data={reportData}
                            isRecruiterView={true}
                            themeKey={sessionId || 'recruiter-report'}
                        />
                    );
                })()}
            </div>
        </div>
    );
}
