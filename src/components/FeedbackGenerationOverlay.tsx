"use client";

import React from "react";
import { useFeedback } from "@/context/FeedbackContext";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function FeedbackGenerationOverlay() {
    const { isGenerating, progress, statusText, currentSessionId } = useFeedback();

    if (!isGenerating) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-[100] w-full max-w-sm"
            >
                <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">AI Analysis in Progress</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{statusText}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-black text-primary tabular-nums">{progress}%</span>
                                </div>
                            </div>

                            <div className="relative pt-1">
                                <Progress value={progress} className="h-1.5" />
                                <div
                                    className="absolute top-0 left-0 h-1.5 bg-primary/20 blur-sm transition-all duration-500 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Processing interview data</span>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-medium">Session: {currentSessionId?.slice(0, 8)}...</span>
                            <span className="text-[10px] text-primary font-bold flex items-center gap-1 group cursor-default">
                                Background Task
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
