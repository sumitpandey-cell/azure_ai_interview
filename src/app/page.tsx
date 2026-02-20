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
import { FeaturesSection } from "@/components/FeaturesSection";
import { DeepDiveSection } from "@/components/DeepDiveSection";
import { GlobalReachSection } from "@/components/GlobalReachSection";
import dynamic from "next/dynamic";
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
                    src="/hero_candidatefirst.png"
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



      {/* Features Section (Bento Grid Redesign) */}
      <FeaturesSection />

      {/* Deep Dive Feature Blocks */}
      <DeepDiveSection />

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

      {/* Global Reach Section - Creative Map Visualization */}
      <GlobalReachSection />



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

