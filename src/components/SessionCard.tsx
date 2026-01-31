"use client";

import React from 'react';
import { Building2, Play, XCircle, ArrowRight, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/format-duration";
import { type SessionConfig } from "@/types/interview";

// Define interface for session data
interface SessionData {
    id: string;
    score: number | null;
    feedback?: unknown;
    status: string;
    created_at: string;
    position?: string;
    duration_seconds?: number | null;
    config?: unknown;
}

interface SessionCardProps {
    session: SessionData;
    isGeneratingFeedback: boolean;
    onClick: () => void;
}

export const SessionCard = React.memo(function SessionCard({ session, isGeneratingFeedback, onClick }: SessionCardProps) {
    const [isNavigating, setIsNavigating] = React.useState(false);

    // Derive actual score from session column or nested feedback JSON
    let score = session.score;
    if (score === null && session.feedback) {
        const fb = session.feedback as Record<string, unknown>;
        const overall = fb.overall as { score?: number } | undefined;
        if (overall?.score !== undefined) {
            score = overall.score;
        } else if (typeof fb.score === 'number') {
            score = fb.score;
        } else if (fb.status === 'abandoned' || fb.note === 'Insufficient data for report generation') {
            score = 0;
        }
    }

    const feedback = session.feedback as { executiveSummary?: string, note?: string } | null;
    const summaryText = feedback?.executiveSummary || '';

    const isFailed = summaryText.includes('Feedback generation failed') ||
        summaryText.includes('Invalid feedback structure');

    let feedbackReason = '';
    if (isFailed) {
        feedbackReason = 'Analysis failed';
    }

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

    const handleClick = () => {
        if (isGeneratingFeedback) return;
        setIsNavigating(true);
        onClick();
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-border/80 dark:border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full",
                isGeneratingFeedback ? "cursor-wait opacity-90" : "cursor-pointer"
            )}
        >
            {/* Background Gradient Spot */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="p-6 h-full flex flex-col relative z-10">
                {/* Header: Type Badge & Status */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {session.config && (session.config as SessionConfig).companyInterviewConfig ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                                <Building2 className="h-3 w-3" />
                                Company Specific
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wide">
                                <Play className="h-3 w-3 fill-current" />
                                General
                            </span>
                        )}
                    </div>

                    {/* Date */}
                    <span className="text-[11px] font-medium text-muted-foreground/60 tabular-nums">
                        {new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                {/* Title & Role */}
                <div className="mb-6 space-y-1">
                    <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {session.position || "Untitled Interview"}
                    </h3>
                    <p className="text-xs text-muted-foreground/80 font-medium line-clamp-1">
                        Duration: {session.duration_seconds ? formatDurationShort(session.duration_seconds) : '---'}
                    </p>
                </div>

                <div className="mt-auto flex items-end justify-between">
                    <div>
                        {/* Show loading/analyzing state first if generating feedback */}
                        {isGeneratingFeedback ? (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground">Analyzing</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">Please wait</span>
                                </div>
                            </div>
                        ) : isFailed ? (
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-2xl flex items-center justify-center border bg-red-500/10 border-red-500/20">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-red-500">
                                        {feedbackReason}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Please try again
                                    </span>
                                </div>
                            </div>
                        ) : score !== null ? (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-3xl font-black tracking-tighter tabular-nums",
                                            score >= 70 ? "text-emerald-500" : score >= 40 ? "text-primary" : "text-rose-500"
                                        )}>
                                            {score}
                                        </span>
                                        <span className="text-sm font-bold text-muted-foreground/50">%</span>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black border",
                                        score >= 70 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                            score >= 40 ? "bg-primary/10 text-primary border-primary/20" :
                                                "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    )}>
                                        GRADE {calculateGrade(score)}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                                    Performance Score
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Progress</span>
                            </div>
                        )}
                    </div>

                    {/* Action Icon */}
                    <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                        isNavigating
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 dark:bg-muted/10 group-hover:bg-primary group-hover:text-primary-foreground"
                    )}>
                        {isNavigating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <ArrowRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
