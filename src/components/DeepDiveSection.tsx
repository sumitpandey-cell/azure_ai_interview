"use strict";
import { useRef, useEffect } from "react";
import { CheckCircle2, Activity, MoveRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";

export function DeepDiveSection() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoRef2 = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.75;
        }
        if (videoRef2.current) {
            videoRef2.current.playbackRate = 0.75;
        }
    }, []);

    return (
        <section id="demo" className="py-32 bg-slate-50 relative overflow-hidden">
            {/* Global Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[120px] mix-blend-multiply" />
                <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[120px] mix-blend-multiply" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl space-y-32">

                {/* Feature Block 1: Speech Analysis (Text Left, Visual Right) */}
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Text Content */}
                    <ScrollReveal direction="right" className="flex-1 space-y-8 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 text-indigo-600 text-sm font-medium border border-indigo-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Global Leaderboard
                        </div>

                        <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.15] tracking-tight">
                            Don&apos;t just guess. <br />
                            <span className="text-indigo-600">Know you&apos;re ready.</span>
                        </h3>

                        <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                            Confidence comes from evidence. Stop wondering if you&apos;re good enough—benchmark your performance against thousands of ambitious engineers worldwide.
                        </p>

                        <div className="space-y-4">
                            {[
                                { title: "Global Peer Comparison", desc: "See your percentile rank against real candidates from top tech hubs." },
                                { title: "Gamified Growth", desc: "Turn preparation into a sport. Climb the ranks as you master new skills." },
                                { title: "Market Readiness", desc: "Know exactly where you stand before you walk into the real interview." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Button className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 transition-all hover:scale-105">
                                Check My Rank <MoveRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </ScrollReveal>

                    {/* Visual Content */}
                    <ScrollReveal direction="left" className="flex-1 w-full max-w-[600px] lg:max-w-none">
                        <div className="relative w-full flex items-center justify-center py-8">
                            {/* Abstract Backdrop */}
                            <div className="absolute inset-0 bg-indigo-50/50 rounded-full blur-3xl transform scale-75 opacity-50 pointer-events-none" />

                            {/* Video Container - Scaled down & Full visibility */}
                            {/* Video Container - Original Size Clean */}
                            <div className="relative z-10 flex justify-center">
                                <video
                                    ref={videoRef}
                                    src="/video2.webm"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="max-w-full h-auto scale-125"
                                />
                            </div>
                        </div>
                    </ScrollReveal>
                </div>


                {/* Feature Block 2: Performance Tracking (Visual Left, Text Right) */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">

                    {/* Text Content */}
                    <ScrollReveal direction="left" className="flex-1 space-y-8 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-sm font-medium border border-emerald-200">
                            <Activity className="h-4 w-4" />
                            Growth Tracking
                        </div>

                        <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.15] tracking-tight">
                            Visualize your <br />
                            <span className="text-emerald-600">path to mastery.</span>
                        </h3>

                        <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                            Don&apos;t practice in the dark. See exactly how your skills compare to successful candidates at top tech companies. Track your daily improvements and know when you&apos;re ready.
                        </p>

                        <div className="space-y-4">
                            {[
                                { title: "Skill-Specific Trendlines", desc: "Monitor progress in DSA, System Design, and Behavioral." },
                                { title: "Candidate Benchmarking", desc: "Compare yourself against top 1% percentiles." },
                                { title: "Readiness Prediction Score", desc: "AI-calculated probability of passing the interview." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Button variant="outline" className="h-12 px-8 rounded-full border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 transition-all hover:scale-105">
                                View Sample Report
                            </Button>
                        </div>
                    </ScrollReveal>

                    {/* Visual Content */}
                    <ScrollReveal direction="right" className="flex-1 w-full max-w-[600px] lg:max-w-none">
                        <div className="relative w-full flex items-center justify-center py-8">
                            {/* Abstract Backdrop */}
                            <div className="absolute inset-0 bg-emerald-50/50 rounded-full blur-3xl transform scale-75 opacity-50 pointer-events-none" />

                            {/* Video Container - Original Size Clean */}
                            <div className="relative z-10 flex justify-center">
                                <video
                                    ref={videoRef2}
                                    src="/video1.webm"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="max-w-full h-auto scale-125"
                                />
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

            </div>
        </section>
    );
}
