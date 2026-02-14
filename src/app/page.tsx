"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, MessageSquare, Award, Zap, CheckCircle2, ArrowRight, Sparkles, Star, Building2, Mic, PlayCircle, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
// No motion import needed
import { TransitionButton } from "@/components/TransitionButton";
import { PublicHeader } from "@/components/PublicHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";

// Animations removed for performance

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Section Wrapper - Animations Disabled for Performance
const SectionWrapper = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
};

function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipIntro = searchParams.get('skip_intro') === 'true';

  useEffect(() => {
    setMounted(true);
    // Optional: Clean up the URL after mounting if skip_intro is present
    if (skipIntro) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [skipIntro]);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push("/dashboard");
    }
  }, [mounted, loading, user, router]);


  if ((!mounted || loading || user) && !skipIntro) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <PremiumLogoLoader text="Initializing Arjuna AI..." />
        {/* Simple loader or just the background to prevent flash */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-0 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/4" />
          <div className="absolute bottom-[-10%] right-0 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-purple-600/20 rounded-full blur-[120px] translate-x-1/4" />
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden max-w-[100vw]">
      {/* JSON-LD Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Arjuna AI", "alternateName": ["ArjunaAI", "AI Interviewer", "Arjuna Interview Coach"], "operatingSystem": "Web", "applicationCategory": "EducationalApplication", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "description": "Arjuna AI is your personal AI Interviewer. Practice with realistic AI mock interviews for coding, system design, and behavioral rounds. Get real-time scoring, personalized feedback, and master your technical skills.", "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "20000" } }) }} />
      {/* Scroll Progress Bar - Disabled */}
      {/*  <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-[100]" style={{ scaleX }} /> */}
      <PublicHeader />
      {/* Hero Section */}
      {/* Hero Section - Pinterest Inspired Light Theme */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-slate-50 pt-32 md:pt-40 pb-20">
        {/* Cool Light Bluish Glowing Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Main Top Center Blue Glow - The "Cool" Factor */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[90vw] h-[80vh] bg-blue-500/15 rounded-full blur-[180px] opacity-70 mix-blend-screen" />

          {/* Side Accents for Depth */}
          <div className="absolute top-[0%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-400/10 rounded-full blur-[140px] opacity-60" />
          <div className="absolute top-[0%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-400/10 rounded-full blur-[140px] opacity-60" />

          {/* Central White/Blue Bloom */}
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] bg-sky-100/40 rounded-full blur-[100px] mix-blend-overlay"></div>

          {/* Sharper Grid Pattern for Technical Feel with Radial Mask */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"></div>

          {/* Subtle Radial Fade for Grid */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-10">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">

            {/* Top Badge */}
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm text-sm font-semibold text-slate-600">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                AI Voice Intelligence 2.0
              </div>
            </div>

            {/* Main Headline - Optimized Visual Hierarchy */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 mb-6 max-w-5xl mx-auto leading-[1.1]">
              <span className="font-semibold tracking-tighter text-slate-800">Master your interview</span> <br className="hidden md:block" />
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 drop-shadow-sm">
                talk like a pro.
              </span>
            </h1>

            {/* Subhead - Action Oriented & Emotional */}
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
              Stop guessing what interviewers think. <br className="hidden sm:block" />
              Get real-time feedback on clarity, tone, and body language to land your dream job.
            </p>

            {/* CTA Group with Micro-Trust */}
            <div className="flex flex-col items-center mb-4 relative z-20">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
                <TransitionButton size="lg" href="/auth" className="w-full sm:w-auto bg-[#0A0A0B] hover:bg-slate-800 text-white rounded-full px-8 h-12 text-base font-bold shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 transition-all">
                  Start Practicing Free
                </TransitionButton>

                <Button size="lg" variant="ghost" className="w-full sm:w-auto text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full px-6 h-12 text-base font-semibold transition-colors" asChild>
                  <Link href="#demo">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    See how it works
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-4 font-medium tracking-wide">
                No credit card required. Used by 5,000+ engineers.
              </p>
            </div>

            {/* Central Visual Composition - Inspired by Analyx */}
            <div className="relative w-full max-w-6xl h-[500px] md:h-[650px] mt-0 perspective-1000">

              {/* Central Circle/Glow - Stronger Focus */}
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>

              {/* Main Character Image - Confident Candidate */}
              <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[400px] md:w-[850px]">
                <div className="relative w-full aspect-square md:aspect-[1/0.9]">
                  {/* Gradient Textures behind */}
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl transform scale-90"></div>

                  <Image
                    src="/hero_candidate.png"
                    alt="Confident Candidate with Laptop"
                    fill
                    className="object-contain md:object-cover object-top drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-10 scale-110"
                    priority
                  />
                </div>
              </div>

              {/* Connected Feature Cards - Narrative Flow (Left to Right) */}

              {/* 1. INPUT: Live Audio (Bottom Left) */}
              <div className="absolute bottom-[10%] left-[-5%] md:bottom-[20%] md:left-[5%] z-20 animate-float scale-75 md:scale-100 origin-bottom-left">
                <div className="bg-[#0A0A0B]/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.4)] w-48 border border-white/10 ring-1 ring-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live Input</span>
                    </div>
                    <Mic className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="flex items-center justify-between gap-0.5 h-6">
                    {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7].map((h, i) => (
                      <div key={i} className="w-1 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-full" style={{ height: `${h * 100}%` }}></div>
                    ))}
                  </div>
                </div>
                {/* Connector suggested by dotted line closer to person */}
              </div>

              {/* 2. PROCESSING: Analysis Card (Top Left) */}
              <div className="absolute top-[10%] left-[-5%] md:top-[18%] md:left-[8%] z-20 animate-float-delayed scale-75 md:scale-100 origin-top-left">
                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200/50 w-52 ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">AI Analysis</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Clarity Score</span>
                      <span className="text-indigo-600">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[92%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. INSIGHT: Skills (Bottom Right) */}
              <div className="absolute bottom-[15%] right-[-5%] md:bottom-[25%] md:right-[5%] z-20 animate-float-delayed scale-75 md:scale-100 origin-bottom-right">
                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200/50 w-44 ring-1 ring-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Skills Detected</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 shadow-sm">React</span>
                    <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 shadow-sm">System Design</span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 shadow-sm">Leadership</span>
                  </div>
                </div>
              </div>

              {/* 4. OUTCOME: Offer (Top Right) */}
              <div className="absolute top-[8%] right-[-2%] md:top-[15%] md:right-[8%] z-20 animate-float scale-75 md:scale-100 origin-top-right">
                <div className="bg-white/95 backdrop-blur-xl p-3 pr-5 rounded-full shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18)] border border-slate-200/50 flex items-center gap-3 ring-1 ring-slate-100 hover:scale-105 transition-transform duration-500 cursor-default">
                  <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">You&apos;re Hired!</p>
                    <p className="text-[10px] text-slate-500 font-bold">Google • L4 Engineer</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <SectionWrapper id="features" className="py-24 bg-slate-50 relative overflow-hidden">

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need to ace the interview
            </h3>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Our AI-powered platform provides a comprehensive suite of tools to help you prepare, practice, and perform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Voice-based AI Interviews (Large Card - Spans 2 cols on desktop) */}
            <ScrollReveal className="md:col-span-2 relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl group bg-white" delay={0.1}>
              {/* Main Background Gradient - Light Theme */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>

              {/* Decorative Wave Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 800 400" preserveAspectRatio="none">
                <path d="M0,100 C150,200 350,0 500,100 C650,200 750,100 800,150" fill="none" stroke="url(#wave-gradient-1)" strokeWidth="2" />
                <path d="M0,150 C200,50 400,250 600,150 C700,100 800,200 800,200" fill="none" stroke="url(#wave-gradient-2)" strokeWidth="2" />
                <defs>
                  <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
                    <stop offset="50%" stopColor="#818CF8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity="0" />
                    <stop offset="50%" stopColor="#C084FC" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Floating Particles */}
              {/* Floating Particles */}
              <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full blur-[1px] opacity-20"></div>
              <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-purple-400 rounded-full blur-[2px] opacity-20"></div>
              <div className="absolute top-1/3 right-20 w-1.5 h-1.5 bg-indigo-400 rounded-full blur-[1px] opacity-20"></div>

              {/* Content Container */}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-10 h-full">

                {/* Left Text Content */}
                <div className="flex-1 text-left space-y-6">
                  <h3 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                    Voice-based <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI Interviews.</span>
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                    Practice real-time scenarios with instant feedback. Our AI adapts to your responses just like a human interviewer.
                  </p>
                </div>

                {/* Right Visual Content - Phone & Avatar */}
                <div className="hidden md:flex relative w-full md:w-1/2 justify-center items-center">



                  {/* Glassmorphism Phone Mockup */}
                  <div className="relative w-[280px] h-[540px] rounded-[3rem] border-[6px] border-white/20 bg-white/5 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 transform rotate-[-6deg] group-hover:rotate-0 transition-transform duration-700">
                    {/* Reflection */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-20"></div>

                    {/* Screen Content */}
                    <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-indigo-900/40 to-purple-900/20">
                      {/* Header */}
                      <div className="px-6 pt-10 pb-4 flex items-center gap-4 relative z-10">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md shadow-sm cursor-pointer hover:bg-white/20 transition-colors">
                          <ArrowRight className="h-4 w-4 text-white rotate-180" />
                        </div>
                        <span className="font-medium text-white">Start Interview</span>
                      </div>

                      {/* Central Visualization */}
                      <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative z-10">
                        <div className="relative w-56 h-56 flex items-center justify-center">
                          {/* Outer Glow Ring */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl animate-pulse"></div>

                          {/* Rotating Gradient Border */}
                          <div className="absolute inset-4 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500">
                            <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-md"></div>
                          </div>

                          {/* Static Dashed Ring */}
                          <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" fill="none" stroke="url(#ring-gradient)" strokeWidth="1" strokeDasharray="4 6" strokeLinecap="round" />
                            <defs>
                              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#60A5FA" />
                                <stop offset="100%" stopColor="#C084FC" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Center Circle */}
                          <div className="relative w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center z-20">
                            <Mic className="h-10 w-10 text-indigo-600" />
                            <div className="absolute inset-0 rounded-full border border-indigo-100 opacity-20"></div>
                          </div>
                        </div>

                        {/* Listening Status */}
                        <div className="mt-2 text-center space-y-3">
                          <div className="h-1.5 w-32 bg-slate-200/50 rounded-full mx-auto overflow-hidden backdrop-blur-sm">
                            <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-[translateX_1.5s_ease-in-out_infinite]"></div>
                          </div>
                          <p className="text-white text-sm font-medium">Listening now...</p>
                        </div>
                      </div>

                      {/* Bottom Waveform */}
                      <div className="h-24 w-full flex items-center justify-center gap-1.5 px-8 pb-8 relative z-10">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500 shadow-sm" style={{ height: `${20 + Math.random() * 60}%`, animation: `pulse 0.8s infinite ${i * 0.1}s alternate` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 2: Instant Score + Feedback */}
            <ScrollReveal className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500" delay={0.2}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Score + Feedback.</h3>
              <p className="text-slate-600 text-sm mb-6">Get detailed scoring and actionable tips immediately.</p>

              {/* Original Score Visualization */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500">Recent Interview</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-emerald-500" strokeDasharray="64, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className="absolute text-xl font-bold text-slate-900">64%</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Score</span>
                        <span className="text-slate-900">64%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-[64%] bg-gradient-to-r from-emerald-400 to-green-500"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Feedback</span>
                        <span className="text-slate-900">8%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-[8%] bg-red-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Skills Assessment Report */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900">Skills Assessment</h4>
                  <span className="text-xs font-medium text-indigo-600">Report #2401</span>
                </div>

                {/* Technical Knowledge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">Technical Knowledge</span>
                    <span className="text-indigo-400 font-bold">15%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[15%] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Superficial understanding of core concepts. Significant gaps in backend architecture.
                  </p>
                </div>

                {/* Communication */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">Communication</span>
                    <span className="text-indigo-400 font-bold">60%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Clear and direct articulation. Good at admitting knowledge gaps.
                  </p>
                </div>

                {/* Problem Solving */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">Problem Solving</span>
                    <span className="text-indigo-400 font-bold">10%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[10%] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Difficulty applying theory to practical scenarios. Needs improvement in diagnosis.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 3: Skill Templates */}
            <ScrollReveal className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500" delay={0.1}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Skill Templates.</h3>
                  <p className="text-slate-600">Choose from a wide range of role-specific interview templates.</p>
                </div>
                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mt-4 md:mt-0">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "BA", title: "Backend Developer", color: "bg-blue-500" },
                  { id: "BL", title: "Blockchain Developer", color: "bg-purple-500" },
                  { id: "DI", title: "AI/ML Engineer", color: "bg-green-500" },
                  { id: "DE", title: "DevOps Engineer", color: "bg-cyan-500" }
                ].map((template, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer group/card relative overflow-hidden">
                    {/* Left Strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>

                    <div className={`w-10 h-10 rounded-lg ${template.color}/10 flex items-center justify-center mb-4 text-${template.color.split('-')[1]}-600 font-bold ml-2`}>
                      {template.id}
                    </div>
                    <h4 className="text-slate-900 font-medium mb-2 ml-2">{template.title}</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 ml-2">Comprehensive assessment for {template.title} roles including technical and behavioral questions.</p>
                    <div className="text-xs font-medium text-indigo-400 group-hover/card:translate-x-1 transition-transform inline-flex items-center ml-2">
                      Learn more <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Feature 4: Leaderboard Gamification */}
            <ScrollReveal className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500" delay={0.1}>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Leaderboard Gamification.</h3>
              <p className="text-slate-600 text-sm mb-6">Compete with others and climb the rankings.</p>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-center items-end gap-4 mb-6">
                  {/* Rank 2 */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 mb-2 overflow-hidden">
                      <Image src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="Rank 2" width={100} height={100} className="w-full h-full object-cover" />
                    </div>
                    <div className="h-16 w-12 bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-600 font-bold text-sm">2</div>
                  </div>
                  {/* Rank 1 */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="absolute -top-6 text-yellow-500">
                      <Award className="h-6 w-6 fill-yellow-500" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-500 mb-2 overflow-hidden ring-4 ring-yellow-500/10">
                      <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="Rank 1" width={100} height={100} className="w-full h-full object-cover" />
                    </div>
                    <div className="h-24 w-16 bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 rounded-t-lg flex items-center justify-center text-yellow-500 font-bold text-lg border-t border-yellow-500/30">1</div>
                  </div>
                  {/* Rank 3 */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 mb-2 overflow-hidden">
                      <Image src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Rank 3" width={100} height={100} className="w-full h-full object-cover" />
                    </div>
                    <div className="h-12 w-12 bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-600 font-bold text-sm">3</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-200 shadow-sm mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">4</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold">You</div>
                    <div className="text-xs text-white font-medium">Ujjawal</div>
                  </div>
                  <span className="text-xs font-bold text-green-400">#1</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 5: Smart Analytics Reports */}
            <ScrollReveal className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500" delay={0.2}>
              <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Analytics Reports.</h3>
                  <p className="text-slate-600 mb-6">Track your progress with real-time data visualization. Identify strengths and weaknesses to focus your preparation.</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Interviews</div>
                      <div className="text-xl font-bold text-slate-900">21</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Avg Score</div>
                      <div className="text-xl font-bold text-slate-900">78%</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Rank</div>
                      <div className="text-xl font-bold text-slate-900">Top 7%</div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-1/2 bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-medium text-slate-500">Average Score Trend</span>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] text-slate-400">Score</span>
                      </div>

                    </div>
                  </div>

                  {/* Combined Chart */}
                  <div className="relative h-32 w-full">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      {/* Bars */}
                      {[30, 45, 35, 60, 55, 75, 85].map((h, i) => (
                        <rect key={`bar-${i}`} x={i * 14.28 + 3.14} y={100 - h} width="8" height={h} rx="2" fill="url(#barGradient)" className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                      ))}
                    </svg>
                  </div>

                  {/* X Axis */}
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500 px-2">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 6: AI-Powered Learning Roadmaps - High Quality UI Redesign */}
            <div className="md:col-span-3 relative rounded-[2.5rem] overflow-hidden bg-[#0B0F19] border border-slate-800 shadow-2xl group">
              {/* Cinematic Background Effects */}
              <div className="absolute inset-0">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
              </div>

              <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-16">

                {/* Content Side */}
                <div className="flex-1 space-y-8 text-center md:text-left">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
                      <Sparkles className="h-4 w-4" />
                      <span>Smart Evolution</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                      Your Personal <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Growth Engine.</span>
                    </h3>
                  </div>

                  <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto md:mx-0">
                    Stop practicing randomly. Our AI analyzes your performance DNA to build a dynamic curriculum that targets your weak spots and accelerates your mastery.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
                    <Button className="h-14 px-8 bg-white text-slate-950 hover:bg-slate-200 rounded-full text-lg font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105" asChild>
                      <Link href="/auth">
                        Generate Roadmap <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Visual Side - 3D Timeline UI */}
                <div className="w-full md:w-[45%] relative perspective-1000">
                  <div className="relative space-y-6 before:absolute before:left-8 before:top-8 before:bottom-8 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-transparent before:opacity-30">

                    {/* Step 1 */}
                    <div className="relative pl-20 group/step">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0B0F19] border-2 border-indigo-500 rounded-full flex items-center justify-center z-10 shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]">
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-indigo-400 font-bold text-xs tracking-wider uppercase">Phase 01</span>
                          <BarChart3 className="h-4 w-4 text-indigo-400" />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-1">Skill Baseline Analysis</h4>
                        <p className="text-slate-400 text-sm">Deep scan of your technical & behavioral strengths.</p>
                      </div>
                    </div>

                    {/* Step 2 (Active) */}
                    <div className="relative pl-20">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center z-10 shadow-[0_0_20px_0px_rgba(139,92,246,0.6)]">
                        <Zap className="h-4 w-4 text-white fill-white" />
                      </div>
                      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-md border border-indigo-500/50 p-6 rounded-2xl relative overflow-hidden shadow-2xl transform scale-105">
                        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold text-xs tracking-wider uppercase">Phase 02</span>
                            <span className="flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></span>
                          </div>
                          <h4 className="text-white font-bold text-lg mb-1">Gap Identification</h4>
                          <p className="text-indigo-200 text-sm">Prioritized micro-learning modules for rapid improvement.</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative pl-20 group/step">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0B0F19] border-2 border-slate-700 group-hover/step:border-purple-500 transition-colors rounded-full flex items-center justify-center z-10">
                        <Trophy className="h-4 w-4 text-slate-500 group-hover/step:text-purple-400 transition-colors" />
                      </div>
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-500 font-bold text-xs tracking-wider uppercase group-hover/step:text-purple-400 transition-colors">Phase 03</span>
                          <Target className="h-4 w-4 text-slate-600 group-hover/step:text-purple-400 transition-colors" />
                        </div>
                        <h4 className="text-slate-300 font-bold text-lg mb-1 group-hover/step:text-white transition-colors">Mastery & Placement</h4>
                        <p className="text-slate-500 text-sm group-hover/step:text-slate-400 transition-colors">Interview-ready status with top percentile ranking.</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Company Templates Section - Creative Redesign */}
      <SectionWrapper className="pt-32 pb-12 bg-[#0A0A0B] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-indigo-300 text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Building2 className="h-4 w-4" />
              <span>Premium Company Tracks</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Crack the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Big Tech</span> Code
            </h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Don&apos;t practice randomly. Train with the exact questions, patterns, and evaluation criteria used by top tech giants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Google Card */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 p-1 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className="relative h-full bg-[#0f1117] rounded-[1.9rem] p-8 overflow-hidden">
                {/* Floating Badge */}
                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                  Most Popular
                </div>

                {/* Logo Area */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative shadow-lg shadow-indigo-500/20">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <svg viewBox="0 0 24 24" className="w-8 h-8 relative z-10"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">Google</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Master the art of &quot;Googleyness&quot;, dynamic programming, and scalable system design.
                </p>

                <div className="flex flex-col gap-1 mb-8">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>Difficulty:</span>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-green-400">
                    Avg selection rate improvement: +23%
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: "Algorithm Challenges", color: "text-green-400" },
                    { label: "System Design", color: "text-blue-400" },
                    { label: "Googleyness & Leadership", color: "text-yellow-400" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 group/item">
                      <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text', 'bg')} group-hover/item:scale-150 transition-transform`}></div>
                      <span className="text-sm text-slate-300 group-hover/item:text-white transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-6 font-medium group-hover:border-indigo-500/50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300" asChild>
                  <Link href="/templates">
                    Start Practice
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-slate-500 mt-3">~45 mins guided practice</p>
              </div>
            </div>

            {/* Amazon Card */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 p-1 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className="relative h-full bg-[#0f1117] rounded-[1.9rem] p-8 overflow-hidden">
                {/* Logo Area */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative shadow-lg shadow-orange-500/20">
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Image src="/amazon-icon.png" alt="Amazon" width={64} height={64} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">Amazon</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Deep dive into the 16 Leadership Principles and survive the Bar Raiser.
                </p>

                <div className="flex flex-col gap-1 mb-8">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>Difficulty:</span>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-green-400">
                    Avg selection rate improvement: +23%
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: "Leadership Principles", color: "text-orange-400" },
                    { label: "Bar Raiser Prep", color: "text-red-400" },
                    { label: "System Design", color: "text-blue-400" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 group/item">
                      <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text', 'bg')} group-hover/item:scale-150 transition-transform`}></div>
                      <span className="text-sm text-slate-300 group-hover/item:text-white transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-6 font-medium group-hover:border-orange-500/50 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300" asChild>
                  <Link href="/templates">
                    Start Practice
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-slate-500 mt-3">~45 mins guided practice</p>
              </div>
            </div>

            {/* Microsoft Card */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 p-1 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className="relative h-full bg-[#0f1117] rounded-[1.9rem] p-8 overflow-hidden">
                {/* Logo Area */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative shadow-lg shadow-blue-500/20">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <svg viewBox="0 0 24 24" className="w-8 h-8 relative z-10"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#F25022" /><path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF" /><path d="M24 24H12.6V12.6H24V24z" fill="#7FBA00" /><path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022" /><path d="M24 11.4H12.6V0H24v11.4z" fill="#FFB900" /></svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">Microsoft</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Prepare for technical rounds, OOP design, and behavioral questions.
                </p>

                <div className="flex flex-col gap-1 mb-8">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>Difficulty:</span>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-green-400">
                    Avg selection rate improvement: +23%
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: "Data Structures", color: "text-blue-400" },
                    { label: "Object-Oriented Design", color: "text-green-400" },
                    { label: "Culture Fit", color: "text-yellow-400" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 group/item">
                      <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text', 'bg')} group-hover/item:scale-150 transition-transform`}></div>
                      <span className="text-sm text-slate-300 group-hover/item:text-white transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-6 font-medium group-hover:border-blue-500/50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300" asChild>
                  <Link href="/templates">
                    Start Practice
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-slate-500 mt-3">~45 mins guided practice</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/templates" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5 group">
              View all 50+ companies
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </SectionWrapper>

      {/* Testimonials Section */}
      <SectionWrapper id="testimonials" className="py-32 bg-[#0A0A0B] relative overflow-hidden">
        {/* Background Effect - Permanent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[min(600px,80vw)] h-[min(600px,80vw)] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse -translate-x-1/3" />
          <div className="absolute bottom-1/4 right-0 w-[min(600px,80vw)] h-[min(600px,80vw)] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700 translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,90vw)] h-[min(800px,90vw)] bg-blue-900/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                <span>What people say</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Trusted by thousands of{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  ambitious professionals
                </span>{" "}
                all across the globe.
              </h2>

              <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Join thousands of developers, product managers, and designers who are acing their interviews with Arjuna AI. Real stories, real results.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 pt-6">
                {/* Active Users */}
                <div className="text-center sm:text-left">
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-sm text-slate-500">Active Users</div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-12 bg-white/10"></div>

                {/* Rating with Facepile */}
                <div className="flex items-center gap-4">
                  {/* Facepile */}
                  <div className="flex -space-x-4">
                    {[
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                    ].map((src, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0A0A0B] overflow-hidden">
                        <Image src={src} alt="User" width={100} height={100} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {/* Stars & Rating */}
                  <div className="space-y-1">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <div className="font-semibold text-white">
                      4.9/5 <span className="text-slate-500 font-normal">Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Scrolling Cards */}
            <div className="lg:col-span-7 relative h-[700px] overflow-hidden p-6" style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Column 1 - Scroll Up */}
                <div className="space-y-4 animate-scroll-vertical">
                  <div className="text-center md:hidden mb-4">
                    <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">⭐ Student Success Stories</span>
                  </div>
                  {[
                    {
                      text: "I was super nervous about my campus placements. Aura's system design templates helped me structure my thoughts. The AI's follow-up questions felt just like the real thing!",
                      name: "Aarav Patel",
                      role: "Final Year CSE, IIT Bombay",
                      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                      hero: true,
                    },
                    {
                      text: "The behavioral round prep is underrated. I used the STAR method template and practiced my stories. Nailed my interview at a top fintech.",
                      name: "Rohan Gupta",
                      role: "Product Manager at Paytm",
                      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                    },
                    {
                      text: "The technical depth in the AI/ML mock interviews is impressive. It caught me on some edge cases I usually miss. Highly recommend for senior roles.",
                      name: "Vikram Singh",
                      role: "Data Scientist at Zomato",
                      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "I was super nervous about my campus placements. Aura's system design templates helped me structure my thoughts. The AI's follow-up questions felt just like the real thing!",
                      name: "Aarav Patel",
                      role: "Final Year CSE, IIT Bombay",
                      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                      hero: true,
                    },
                    {
                      text: "The behavioral round prep is underrated. I used the STAR method template and practiced my stories. Nailed my interview at a top fintech.",
                      name: "Rohan Gupta",
                      role: "Product Manager at Paytm",
                      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                    },
                    {
                      text: "The technical depth in the AI/ML mock interviews is impressive. It caught me on some edge cases I usually miss. Highly recommend for senior roles.",
                      name: "Vikram Singh",
                      role: "Data Scientist at Zomato",
                      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                  ].map((testimonial, i) => (
                    <Card key={`col1-${i}`} className="p-6 border border-white/10 shadow-lg bg-[#141821] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 group hover:-rotate-1 hover:scale-[1.02]">

                      <p className="text-slate-300 mb-6 leading-relaxed text-sm">&quot;{testimonial.text}&quot;</p>
                      <div className="flex items-center gap-3">
                        <Image src={testimonial.image} alt={testimonial.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover border-2 border-white/10 group-hover:border-indigo-500/50 transition-colors" />
                        <div>
                          <div className="font-bold text-white text-sm">{testimonial.name}</div>
                          <div className="text-xs text-slate-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Column 2 - Scroll Down */}
                <div className="space-y-4 animate-scroll-vertical-reverse hidden md:block">
                  {[
                    {
                      text: "Switching jobs after 3 years was scary. This tool helped me brush up on DSA. The voice feedback on my communication style was a game changer.",
                      name: "Priya Sharma",
                      role: "Software Engineer at Swiggy",
                      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "I love the daily challenges. It kept me consistent. The code review feature actually pointed out optimization tips I hadn't thought of.",
                      name: "Sneha Reddy",
                      role: "Frontend Dev at Razorpay",
                      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "Explaining design decisions is hard. Aura let me practice my rationale until I sounded confident. The 'why' is so important, and this tool gets it.",
                      name: "Ananya Iyer",
                      role: "UI/UX Designer at Cred",
                      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "Switching jobs after 3 years was scary. This tool helped me brush up on DSA. The voice feedback on my communication style was a game changer.",
                      name: "Priya Sharma",
                      role: "Software Engineer at Swiggy",
                      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "I love the daily challenges. It kept me consistent. The code review feature actually pointed out optimization tips I hadn't thought of.",
                      name: "Sneha Reddy",
                      role: "Frontend Dev at Razorpay",
                      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "Explaining design decisions is hard. Aura let me practice my rationale until I sounded confident. The 'why' is so important, and this tool gets it.",
                      name: "Ananya Iyer",
                      role: "UI/UX Designer at Cred",
                      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                  ].map((testimonial, i) => (
                    <Card key={`col2-${i}`} className="p-6 border border-white/10 shadow-lg bg-[#141821] hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 group hover:rotate-1">
                      <p className="text-slate-300 mb-6 leading-relaxed text-sm">&quot;{testimonial.text}&quot;</p>
                      <div className="flex items-center gap-3">
                        <Image src={testimonial.image} alt={testimonial.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover border-2 border-white/10 group-hover:border-indigo-500/50 transition-colors" />
                        <div>
                          <div className="font-bold text-white text-sm">{testimonial.name}</div>
                          <div className="text-xs text-slate-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>



      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Landing() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center"><PremiumLogoLoader text="Connecting..." /></div>}>
      <HomeContent />
    </Suspense>
  );
}