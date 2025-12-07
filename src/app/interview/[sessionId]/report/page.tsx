"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2, XCircle, Calendar, User, Briefcase, Bot, ArrowRight, ExternalLink, MessageSquare, Copy, Trash2, Clock, Play } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
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

interface InterviewSession {
    id: string;
    interview_type: string;
    position: string;
    score: number | null;
    status: string;
    created_at: string;
    duration_minutes: number | null;
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
    const { fetchSessionDetail, isCached, deleteInterviewSession } = useOptimizedQueries();
    const [session, setSession] = useState<InterviewSession | null>(null);

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
                }
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            // router.push("/dashboard"); // Optional: redirect on error
        } finally {
            setLoading(false);
        }
    };

    const copyTranscriptToClipboard = async () => {
        try {
            const transcriptText = reportData.transcript
                .map((msg: TranscriptMessage) => `${msg.sender.toUpperCase()}: ${msg.text}`)
                .join('\\n\\n');

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
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Report - ${reportData.candidateName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f8fafc;
            padding: 40px 20px;
        }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 32px; color: #0f172a; margin-bottom: 8px; }
        .header .position { font-size: 20px; color: #64748b; margin-bottom: 12px; }
        .header .date { font-size: 14px; color: #94a3b8; }
        .score-section { background: #0f172a; color: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; }
        .score-section .score { font-size: 64px; font-weight: bold; margin-bottom: 8px; }
        .score-section .label { font-size: 18px; opacity: 0.9; }
        .section { margin: 30px 0; }
        .section h2 { font-size: 24px; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
        .section h3 { font-size: 18px; color: #334155; margin: 20px 0 12px; }
        .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #0f172a; }
        .list { list-style: none; }
        .list li { padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: start; }
        .list li:last-child { border-bottom: none; }
        .list li::before { content: "•"; color: #0f172a; font-weight: bold; font-size: 20px; margin-right: 12px; }
        .strength::before { content: "✓"; color: #10b981 !important; }
        .improvement::before { content: "⚠"; color: #f59e0b !important; }
        .skill-item { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
        .skill-header { display: flex; justify-between; align-items: center; margin-bottom: 8px; }
        .skill-name { font-weight: 600; color: #0f172a; }
        .skill-score { font-weight: bold; color: #0f172a; font-size: 18px; }
        .skill-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .skill-bar-fill { height: 100%; background: #0f172a; border-radius: 4px; }
        .skill-feedback { font-size: 14px; color: #64748b; }
        .transcript { background: #f8fafc; padding: 20px; border-radius: 8px; max-height: 600px; overflow-y: auto; }
        .message { margin-bottom: 16px; padding: 12px; border-radius: 8px; }
        .message.ai { background: #f1f5f9; border-left: 3px solid #0f172a; }
        .message.user { background: #f0fdf4; border-left: 3px solid #10b981; }
        .message-sender { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .message-text { color: #1e293b; }
        .recommendation { background: #dcfce7; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0; }
        .recommendation.negative { background: #fee2e2; border-color: #ef4444; }
        .recommendation h3 { color: #166534; margin-bottom: 8px; }
        .recommendation.negative h3 { color: #991b1b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 14px; }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.candidateName}</h1>
            <div class="position">${reportData.position}</div>
            <div class="date">Interview Date: ${reportData.date}</div>
        </div>

        <div class="score-section">
            <div class="score">${reportData.overallScore}%</div>
            <div class="label">Overall Match Score</div>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <div class="summary">${reportData.executiveSummary}</div>
        </div>

        <div class="section">
            <h2>Key Strengths</h2>
            <ul class="list">
                ${reportData.strengths.map((item: string) => `<li class="strength">${item}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Areas for Improvement</h2>
            <ul class="list">
                ${reportData.improvements.map((item: string) => `<li class="improvement">${item}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Skills Assessment</h2>
            ${reportData.skills.map((skill: Skill) => `
                <div class="skill-item">
                    <div class="skill-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-score">${skill.score}%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-bar-fill" style="width: ${skill.score}%"></div>
                    </div>
                    <div class="skill-feedback">${skill.feedback}</div>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>Recommended Action Plan</h2>
            <ul class="list">
                ${reportData.actionPlan.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Interview Transcript</h2>
            <div class="transcript">
                ${reportData.transcript.map((msg: TranscriptMessage) => `
                    <div class="message ${msg.sender}">
                        <div class="message-sender">${msg.sender === 'ai' ? 'AI Interviewer' : 'Candidate'}</div>
                        <div class="message-text">${msg.text}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="recommendation ${reportData.overallScore >= 70 ? '' : 'negative'}">
            <h3>AI Recommendation: ${reportData.overallScore >= 70 ? 'Proceed' : 'Do Not Proceed'}</h3>
            <p>Based on the overall match score of ${reportData.overallScore}%, this candidate is ${reportData.overallScore >= 70 ? 'recommended' : 'not recommended'} for the ${reportData.position} role at this time.</p>
        </div>

        <div class="footer">
            <p>Generated by Aura AI Interview Platform</p>
            <p>© ${new Date().getFullYear()} All rights reserved</p>
        </div>
    </div>
</body>
</html>
            `;

            // Create blob and download
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Interview_Report_${reportData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Report downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download report");
            console.error("Download error:", error);
        }
    };


    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
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

    // Check if interview is in progress (not completed or no score)
    // Also check Zustand store for instant feedback to handle the case where
    // the background save hasn't completed yet but we have feedback in memory
    const hasInstantFeedback = instantFeedback && instantFeedback.skills && instantFeedback.skills.length > 0;
    const isInProgress = (session.status !== 'completed' || session.score === null) && !hasInstantFeedback;

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
                                    {sessionId && isCached.sessionDetail(sessionId) && (
                                        <Badge variant="outline" className="text-xs px-1 flex-shrink-0">📦 Cached</Badge>
                                    )}
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
                                        onClick={() => router.push(`/interview/${sessionId}/active`)}
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

    // Check if feedback is being generated (session is completed but no feedback yet)
    const isFeedbackGenerating = session.status === 'completed' &&
        !session.feedback &&
        (!instantFeedback || !instantFeedback.skills || instantFeedback.skills.length === 0);

    // Beautiful loading state for feedback generation
    if (isFeedbackGenerating) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full border-none shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                        <CardContent className="p-8 md:p-12">
                            <div className="flex flex-col items-center text-center space-y-8">
                                {/* Animated AI Brain Icon */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                                    <div className="relative bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-full p-8 animate-bounce">
                                        <Bot className="h-16 w-16 text-white" />
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-3">
                                    <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                        Analyzing Your Interview
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                                        Our AI is carefully reviewing your responses...
                                    </p>
                                </div>

                                {/* Animated Progress Bar */}
                                <div className="w-full space-y-3">
                                    <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 animate-[shimmer_2s_ease-in-out_infinite]"
                                            style={{
                                                backgroundSize: '200% 100%',
                                                animation: 'shimmer 2s ease-in-out infinite'
                                            }}>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        This usually takes 10-30 seconds
                                    </p>
                                </div>

                                {/* Processing Steps */}
                                <div className="w-full space-y-4 pt-4">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">Transcribing conversation</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                                            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">Evaluating technical skills</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-left opacity-50">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">Generating insights</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-left opacity-50">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">Preparing your report</span>
                                    </div>
                                </div>

                                {/* Encouraging Message */}
                                <div className="pt-6 px-6 py-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                                        💡 <strong>Tip:</strong> Your detailed feedback report will include personalized recommendations for improvement!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add shimmer animation */}
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                `}</style>
            </DashboardLayout>
        );
    }

    // Merge DB feedback and in-memory (instant) feedback using generatedAt timestamps.
    // If instant feedback is newer, prefer its fields; otherwise use DB feedback.
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

    const feedbackData = mergeFeedback(session?.feedback, instantFeedback);

    // Use instant transcript if available (more up-to-date), fallback to DB transcript
    const transcriptData = instantTranscript.length > 0 ? instantTranscript : (session?.transcript || []);

    // Debug transcript data
    console.log('=== TRANSCRIPT DEBUG INFO ===');
    console.log('Instant transcript from Zustand:', instantTranscript.length, 'messages');
    instantTranscript.forEach((msg, idx) => {
        console.log(`  [${idx}] ${msg.sender}: ${msg.text?.substring(0, 30)}...`);
    });
    console.log('DB transcript from session:', session?.transcript?.length || 0, 'messages');
    if (session?.transcript) {
        session.transcript.forEach((msg: any, idx: number) => {
            console.log(`  [${idx}] ${msg.sender}: ${msg.text?.substring(0, 30)}...`);
        });
    }
    console.log('Final transcript data used:', transcriptData.length, 'messages');
    console.log('=============================');

    const reportData = {
        candidateName: userMetadata?.full_name || "Candidate",
        position: session.position,
        overallScore: session.score || (feedbackData && feedbackData.skills ? Math.round((feedbackData.skills.reduce((acc: any, s: any) => acc + (s.score || 0), 0) / (feedbackData.skills.length || 1))) : 0),
        date: new Date(session.created_at).toLocaleString(),
        executiveSummary: feedbackData.executiveSummary || "The interview session has been recorded. Detailed AI analysis is pending.",
        strengths: feedbackData.strengths || ["Pending analysis..."],
        improvements: feedbackData.improvements || ["Pending analysis..."],
        skills: feedbackData.skills || [
            { name: "Technical Expertise", score: 0, feedback: "Pending..." },
            { name: "Problem Solving", score: 0, feedback: "Pending..." },
            { name: "Communication", score: 0, feedback: "Pending..." },
            { name: "Cultural Fit", score: 0, feedback: "Pending..." }
        ],
        actionPlan: feedbackData.actionPlan || ["Wait for full AI report generation."],
        // Ensure transcript format is consistent and filter AI internal thoughts
        transcript: transcriptData.length > 0
            ? transcriptData
                .filter((msg: any) => msg && msg.sender && msg.text && msg.text.trim()) // Filter out invalid messages
                .map((msg: any, index: number) => {
                    let cleanedText = msg.text.trim();

                    // Remove AI internal thoughts (e.g., **Thinking**, **Analysis**, etc.)
                    if (msg.sender === 'ai') {
                        cleanedText = cleanedText.replace(/\*\*[^*]+\*\*\s*/g, '');
                    }

                    return {
                        id: msg.id || index,
                        sender: msg.sender,
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
                                        {sessionId && isCached.sessionDetail(sessionId) && (
                                            <Badge variant="outline" className="text-xs px-1 flex-shrink-0">📦 Cached</Badge>
                                        )}
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg truncate">{reportData.position}</p>

                                    {/* Saving status badge */}
                                    <div className="flex-shrink-0 mt-1">
                                        {isSaving ? (
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 font-medium w-fit">Saving…</div>
                                        ) : saveError ? (
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-800 font-medium w-fit">Save failed</div>
                                        ) : (
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-800 font-medium w-fit">Saved</div>
                                        )}
                                    </div>
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
                                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Skills Assessment</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {reportData.skills.map((skill: Skill, i: number) => (
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
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{reportData.position}</span>
                                        </div>
                                    </CardContent>
                                </Card>


                            </div>

                        </div>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column (Main Content) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Skills Overview Card */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Skills Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col md:flex-row items-center gap-8">
                                        <div className="h-[300px] w-full md:w-1/2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={reportData.skills}>
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
                                                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">{reportData.overallScore}%</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">Overall Skill Score</div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                Detailed skill analysis is pending.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Detailed Skills Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {reportData.skills.map((skill: Skill, i: number) => (
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
                            </div>

                            {/* Right Column (Sidebar) - Duplicated for now as per design request to show same sidebar */}
                            <div className="space-y-6">
                                {/* Download Report Button (Sidebar version if needed, though header has one) */}
                                <Button onClick={downloadReport} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base shadow-lg shadow-gray-200">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Full Report
                                </Button>

                                {/* Interview Details */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Interview Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <User className="h-4 w-4" />
                                                Candidate:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{reportData.position}</span>
                                        </div>
                                    </CardContent>
                                </Card>


                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column (Transcript) */}
                            <div className="lg:col-span-2">
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    Interview Transcript
                                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                                                        {reportData.transcript.length} messages
                                                    </span>
                                                </CardTitle>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${instantTranscript.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {instantTranscript.length > 0 ? '📍 Live Session' : '💾 Saved Session'}
                                                </span>
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
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {msg.sender === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                                    </div>
                                                    <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${msg.sender === 'ai'
                                                            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 rounded-tl-none'
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

                            {/* Right Column (Sidebar) - Duplicated for consistency */}
                            <div className="space-y-6">
                                <Button onClick={downloadReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-200">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Full Report
                                </Button>

                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Interview Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <User className="h-4 w-4" />
                                                Candidate:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{reportData.position}</span>
                                        </div>
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
