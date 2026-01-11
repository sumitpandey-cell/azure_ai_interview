"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Code, PenTool, Layout, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4 mb-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8">
                            We're Hiring
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
                            Build the future of <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">hiring with AI</span>
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12">
                            Join a team of passionate engineers, designers, and problem solvers working to make career growth accessible to everyone.
                        </p>
                    </div>
                </div>

                {/* Values/Culture */}
                <div className="container mx-auto px-4 mb-32">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Remote-First", desc: "Work from anywhere. We care about output, not hours or location." },
                            { title: "Competitive Pay", desc: "Top-tier salary and significant equity packages for all employees." },
                            { title: "Learning Budget", desc: "$2,000/year stipend for courses, books, and conferences." }
                        ].map((perk, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all">
                                <CheckCircle2 className="h-8 w-8 text-indigo-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">{perk.title}</h3>
                                <p className="text-slate-400">{perk.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Open Roles */}
                <div className="container mx-auto px-4 max-w-5xl">
                    <h2 className="text-3xl font-bold text-white mb-12">Open Positions</h2>
                    <div className="space-y-4">
                        {[
                            { title: "Senior AI Engineer", dept: "Engineering", loc: "Remote (US/EU)", type: "Full-time" },
                            { title: "Frontend Developer (React/Next.js)", dept: "Engineering", loc: "Remote", type: "Full-time" },
                            { title: "Product Designer", dept: "Design", loc: "Remote", type: "Full-time" },
                            { title: "Growth Marketing Manager", dept: "Marketing", loc: "New York / Remote", type: "Full-time" }
                        ].map((job, i) => (
                            <div key={i} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">{job.title}</h3>
                                    <div className="flex gap-4 text-sm text-slate-400">
                                        <span>{job.dept}</span>
                                        <span>•</span>
                                        <span>{job.loc}</span>
                                        <span>•</span>
                                        <span>{job.type}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" className="hidden sm:flex text-indigo-400 group-hover:translate-x-1 transition-transform">
                                    Apply <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
