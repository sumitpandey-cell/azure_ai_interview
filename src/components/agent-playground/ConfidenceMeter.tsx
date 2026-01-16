"use client";

import { useEffect, useState } from "react";
import { Smile, Meh, Frown, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
    sentiment: string;
    confidence: number;
    scores: {
        positive: number;
        neutral: number;
        negative: number;
    };
    className?: string;
}

export function ConfidenceMeter({ sentiment, confidence, scores, className }: ConfidenceMeterProps) {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        setPulse(true);
        const timer = setTimeout(() => setPulse(false), 1000);
        return () => clearTimeout(timer);
    }, [confidence]);

    const getSentimentConfig = (sentiment: string) => {
        switch (sentiment.toLowerCase()) {
            case "positive":
                return {
                    icon: <Smile className="h-4 w-4 text-emerald-500" />,
                    label: "Confident",
                    color: "bg-emerald-500",
                    glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
                    textColor: "text-emerald-500"
                };
            case "neutral":
                return {
                    icon: <Meh className="h-4 w-4 text-amber-500" />,
                    label: "Steady",
                    color: "bg-amber-500",
                    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
                    textColor: "text-amber-500"
                };
            case "negative":
                return {
                    icon: <Frown className="h-4 w-4 text-rose-500" />,
                    label: "Unsure",
                    color: "bg-rose-500",
                    glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
                    textColor: "text-rose-500"
                };
            default:
                return {
                    icon: <Sparkles className="h-4 w-4 text-primary" />,
                    label: "Analyzing",
                    color: "bg-primary",
                    glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
                    textColor: "text-primary"
                };
        }
    };

    const config = getSentimentConfig(sentiment);

    return (
        <div className={cn(
            "bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all duration-700",
            pulse && "ring-1 ring-primary/30",
            className
        )}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {config.icon}
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", config.textColor)}>
                        {config.label}
                    </span>
                </div>
                <span className="text-[10px] font-bold text-white/40">
                    Confidence Index
                </span>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <Progress value={confidence} className="h-1.5 bg-white/5" indicatorClassName={cn(config.color, config.glow, "transition-all duration-1000")} />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 rounded-full border border-white/20"
                        style={{ left: `${confidence}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        <div className="flex flex-col">
                            <span className="text-[7px] text-white/20 uppercase font-black">Pos</span>
                            <span className="text-[9px] font-bold text-emerald-500/80">{(scores.positive * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] text-white/20 uppercase font-black">Neu</span>
                            <span className="text-[9px] font-bold text-amber-500/80">{(scores.neutral * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] text-white/20 uppercase font-black">Neg</span>
                            <span className="text-[9px] font-bold text-rose-500/80">{(scores.negative * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="text-xl font-black text-white/90 tabular-nums">
                        {confidence.toFixed(0)}<span className="text-[10px] text-white/30 ml-0.5">%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
