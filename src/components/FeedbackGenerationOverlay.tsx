"use client";

import React from "react";
import { useFeedback } from "@/context/FeedbackContext";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FeedbackGenerationOverlay() {
    const { isGenerating, progress, statusText, currentSessionId } = useFeedback();

    if (!isGenerating) return null;

    return (
        <div
            className="fixed bottom-6 right-6 z-[100] w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
        >
            <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-primary/10">
                <CardContent className="p-0">
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-xl animate-ping opacity-25" />
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse relative z-10" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">AI Analysis in Progress</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-all duration-300">{statusText}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-black text-primary tabular-nums">{progress}%</span>
                            </div>
                        </div>

                        <div className="relative pt-1">
                            <Progress value={progress} className="h-1.5" />
                            <div
                                className="absolute top-0 left-0 h-1.5 bg-primary/30 blur-sm transition-all duration-500 rounded-full animate-pulse"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">Session: {currentSessionId?.slice(0, 8)}...</span>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                Background Task
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
