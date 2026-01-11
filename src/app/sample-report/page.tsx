"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Calendar, User, Briefcase, Bot, ArrowRight, MessageSquare, Clock, Code, Award, Target, TrendingUp, Sparkles } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";

export default function SampleReport() {
    const mockData = {
        candidateName: "Alex Rivera",
        position: "Senior Software Engineer",
        overallScore: 88,
        date: "December 31, 2025",
        executiveSummary: "Alex demonstrated strong technical leadership and deep architectural knowledge. Their approach to scalability and system design was methodical, though there is slight room for improvement in articulating trade-offs for distributed caching layers.",
        strengths: [
            "Excellent understanding of microservices architecture",
            "Strong communication of complex technical concepts",
            "Methodical approach to problem-solving and edge-case handling",
            "Clearly articulated leadership style and conflict resolution skills"
        ],
        improvements: [
            "Could provide more concrete examples of database sharding trade-offs",
            "Minor hesitation when discussing low-level memory management in Go",
            "Pacing could be slightly more concise during behavioral responses"
        ],
        skills: [
            { name: "System Design", score: 92, feedback: "Exceptional mastery of high-level architecture." },
            { name: "Coding Ability", score: 85, feedback: "Clean, maintainable code with good error handling." },
            { name: "Communication", score: 90, feedback: "Very clear and professional delivery." },
            { name: "Leadership", score: 88, feedback: "Strong examples of mentorship and project ownership." },
            { name: "Problem Solving", score: 85, feedback: "Logical and structured approach to complexity." }
        ],
        technicalSkills: [
            { name: "React/Next.js", score: 95 },
            { name: "Node.js", score: 90 },
            { name: "PostgreSQL", score: 82 },
            { name: "AWS/Cloud", score: 88 }
        ],
        transcript: [
            { sender: "ai", text: "Welcome Alex. Let's start with a high-level system design question. How would you design a global rate-limiting service for a large-scale API?", timestamp: "0:00" },
            { sender: "user", text: "That's a great question. I would approach this by using a distributed cache like Redis. The key challenge is consistency across regions while maintaining low latency.", timestamp: "0:15" },
            { sender: "ai", text: "Interesting. How would you handle the 'thundering herd' problem if one of your Redis nodes goes down?", timestamp: "1:05" },
            { sender: "user", text: "I'd implement local in-memory caching on the application servers as a fallback with a shorter TTL, and use a consistent hashing ring to redistribute the load.", timestamp: "1:25" },
            { sender: "ai", text: "Good. Now, shifting to behavioral: tell me about a time you had a significant technical disagreement with a peer.", timestamp: "3:40" },
            { sender: "user", text: "In my last role, we were deciding between GraphQL and gRPC for internal service communication. I advocated for gRPC due to the performance requirements, but a senior peer preferred GraphQL for its flexibility...", timestamp: "4:00" }
        ]
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-x-hidden">
            <GlobalBackground />

            {/* Header Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8" />
                        <span className="font-bold text-xl bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">Arjuna AI</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">Sample Report</div>
                        <Button size="sm" className="bg-white text-black hover:bg-slate-200 rounded-full font-bold" asChild>
                            <Link href="/auth">Create Your Report</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-20">
                <div className="container mx-auto px-4">
                    {/* Hero Header */}
                    <div className="mb-8 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Bot className="h-40 w-40 text-indigo-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{mockData.candidateName}</h1>
                                <p className="text-xl text-indigo-400 font-medium mb-4">{mockData.position}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Calendar className="h-4 w-4" /> {mockData.date}
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Clock className="h-4 w-4" /> 45 Minute Duration
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Bot className="h-4 w-4" /> Comprehensive Type
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-indigo-600 shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)]">
                                <span className="text-sm font-bold text-indigo-100 uppercase mb-1">Overall Score</span>
                                <span className="text-5xl font-black text-white">{mockData.overallScore}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Summary & Insights */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Executive Summary */}
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-white/5 pb-6">
                                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-yellow-400" />
                                        Executive Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-lg text-slate-300 leading-relaxed italic">
                                        "{mockData.executiveSummary}"
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Strengths & Improvements */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="bg-emerald-500/5 border-emerald-500/20 backdrop-blur-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Key Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {mockData.strengths.map((s, i) => (
                                                <li key={i} className="flex gap-3 text-slate-300">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <Card className="bg-amber-500/5 border-amber-500/20 backdrop-blur-sm rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-amber-400 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Areas for Growth
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {mockData.improvements.map((s, i) => (
                                                <li key={i} className="flex gap-3 text-slate-300">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Skill Detailed Cards */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white pl-2">Skill Analysis</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {mockData.skills.map((skill, i) => (
                                        <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="font-bold text-slate-200">{skill.name}</span>
                                                <span className="text-2xl font-black text-indigo-400">{skill.score}</span>
                                            </div>
                                            <Progress value={skill.score} className="h-2 mb-4 bg-white/5" />
                                            <p className="text-sm text-slate-400 leading-relaxed">{skill.feedback}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Visuals & Transcript */}
                        <div className="space-y-8">
                            {/* Skill Radar */}
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                        <Target className="h-5 w-5 text-indigo-400" />
                                        Performance Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px] pt-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockData.skills}>
                                            <PolarGrid stroke="#ffffff10" />
                                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                            <Radar
                                                name="Score"
                                                dataKey="score"
                                                stroke="#6366f1"
                                                fill="#6366f1"
                                                fillOpacity={0.5}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Transcript Preview */}
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-indigo-400" />
                                        Session Transcript
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {mockData.transcript.map((msg, i) => (
                                            <div key={i} className={`flex flex-col gap-1 ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
                                                <div className="flex items-center gap-2 px-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{msg.sender === 'ai' ? 'Arjuna AI' : 'Candidate'}</span>
                                                    <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
                                                </div>
                                                <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed max-w-[90%] ${msg.sender === 'ai'
                                                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-slate-300 rounded-tl-none'
                                                        : 'bg-white/5 border border-white/10 text-white rounded-tr-none'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8">
                                        <Button className="w-full bg-white text-black hover:bg-slate-200 rounded-2xl h-12 font-bold" asChild>
                                            <Link href="/auth">
                                                Try It Yourself
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-[#0A0A0B] border-t border-white/10 pt-20 pb-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-2">
                            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-6">
                                <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8 object-contain" />
                                <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Arjuna AI</span>
                            </Link>
                            <p className="text-slate-400 max-w-xs mb-6">
                                The AI-powered interview preparation platform that helps you land your dream job.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-6">Company</h4>
                            <ul className="space-y-4">
                                <li><Link href="/about" className="text-slate-400 hover:text-indigo-400 transition-colors">About Us</Link></li>
                                <li><Link href="/contact" className="text-slate-400 hover:text-indigo-400 transition-colors">Contact</Link></li>
                                <li><Link href="/faq" className="text-slate-400 hover:text-indigo-400 transition-colors">FAQ</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-6">Legal</h4>
                            <ul className="space-y-4">
                                <li><Link href="/privacy" className="text-slate-400 hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="text-slate-400 hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 text-center">
                        <p className="text-slate-500 text-sm">© 2025 Arjuna AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
