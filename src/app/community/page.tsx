"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Github, Twitter, Linkedin, Heart, Trophy, Share2 } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4 mb-20 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8">
                        <Users className="h-4 w-4" />
                        Join 50,000+ Engineers
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
                        A community of <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ambitious builders</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
                        Connect with peers, share interview experiences, and prepare together. Your next job offer starts with your network.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full font-bold shadow-lg shadow-indigo-500/20" asChild>
                            <Link href="#">
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Join Discord
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 text-white hover:bg-white/5 rounded-full font-medium" asChild>
                            <Link href="#">
                                <Github className="mr-2 h-5 w-5" />
                                Star on GitHub
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-900/40 to-indigo-900/10 border border-indigo-500/20 text-center">
                            <div className="text-4xl font-bold text-white mb-2">50,000+</div>
                            <div className="text-indigo-200">Active Members</div>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-900/40 to-purple-900/10 border border-purple-500/20 text-center">
                            <div className="text-4xl font-bold text-white mb-2">1,000+</div>
                            <div className="text-purple-200">Offers Landed</div>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-pink-900/40 to-pink-900/10 border border-pink-500/20 text-center">
                            <div className="text-4xl font-bold text-white mb-2">24/7</div>
                            <div className="text-pink-200">Mock Interviews</div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-[#0F0F12] border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <h3 className="text-2xl font-bold text-white mb-4">Official Channels</h3>
                            <div className="space-y-4 relative z-10">
                                <a href="#" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center text-[#1DA1F2]">
                                            <Twitter className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">Twitter</div>
                                            <div className="text-xs text-slate-400">@ArjunaAI</div>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-slate-400">Follow</Button>
                                </a>
                                <a href="#" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#0A66C2]/20 flex items-center justify-center text-[#0A66C2]">
                                            <Linkedin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">LinkedIn</div>
                                            <div className="text-xs text-slate-400">Arjuna AI Inc.</div>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-slate-400">Follow</Button>
                                </a>
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-[#0F0F12] border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <h3 className="text-2xl font-bold text-white mb-4">Community Events</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded">UPCOMING</span>
                                        <span className="text-xs text-slate-500">Jan 15, 6:00 PM PST</span>
                                    </div>
                                    <h4 className="text-white font-bold mb-1">System Design Deep Dive</h4>
                                    <p className="text-sm text-slate-400 mb-3">Live mock interview session with ex-Google Staff Engineers.</p>
                                    <Button size="sm" variant="outline" className="w-full border-white/10 hover:bg-white/5 text-slate-300">RSVP</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
