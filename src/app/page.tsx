"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, MessageSquare, Award, Zap, CheckCircle2, ArrowRight, Sparkles, Star, Building2, Mic, PlayCircle, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TransitionButton } from "@/components/TransitionButton";
import { PublicHeader } from "@/components/PublicHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Section Wrapper - Animations Disabled for Performance
const SectionWrapper = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
  return (
    <section
      id={id}
      className={className}
    >
      {children}
    </section>
  );
};

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push("/dashboard");
    }
  }, [mounted, loading, user, router]);


  if (!mounted || loading || user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        {/* Simple loader or just the background to prevent flash */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-0 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/4" />
          <div className="absolute bottom-[-10%] right-0 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-purple-600/20 rounded-full blur-[120px] translate-x-1/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] font-sans text-white overflow-x-hidden max-w-[100vw]">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Arjuna AI",
            "operatingSystem": "Web",
            "applicationCategory": "EducationalApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Arjuna AI is an AI-powered interview coaching platform that helps candidates practice real-time interviews with instant scoring and personalized feedback.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "20000"
            }
          })
        }}
      />
      {/* Scroll Progress Bar - Disabled */}
      {/* <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-[100]"
        style={{ scaleX }}
      /> */}
      <PublicHeader />
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0B] pt-32 md:pt-40 pb-20">
        {/* Animated Background Effects - Cool Blue/Purple/Indigo Theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-0 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/4" />
          <div className="absolute bottom-[-10%] right-0 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-purple-600/20 rounded-full blur-[120px] translate-x-1/4" />
          <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[min(800px,90vw)] h-[min(800px,90vw)] bg-blue-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-medium text-slate-300">
                  New: AI Voice Intelligence 2.0
                </span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-wide text-white mb-6">
              Ace Any Interview.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-6">
              Practice real interviews with AI scoring and feedback — built to train you like a real hiring manager.
            </motion.p>

            {/* Mini Text Line with Avatars */}
            <motion.div variants={fadeInUp} className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&q=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&q=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&fit=crop&crop=faces"
                ].map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt="User"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full border-2 border-[#0A0A0B] object-cover"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400/80">
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                Trusted by 20,000+ candidates
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <TransitionButton
                  size="lg"
                  href="/auth"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 text-lg font-semibold shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1"
                >
                  Start My Interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </TransitionButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-indigo-500/50 rounded-full px-8 h-14 text-lg font-semibold bg-transparent"
                  asChild
                >
                  <Link href="#demo">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              variants={scaleIn}
              className="relative mx-auto max-w-5xl"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-50 blur-3xl"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.2), transparent 70%)"
                }}
              ></div>

              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>

              <div className="relative rounded-2xl bg-[#0f1117] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5 group">
                {/* Mac Window Header */}
                <div className="relative h-11 bg-[#1a1b26] border-b border-white/5 flex items-center px-4 gap-2 z-10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]/50 shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]/50 shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]/50 shadow-inner"></div>
                  </div>
                  <div className="ml-4 flex-1 flex justify-center">
                    <div className="h-6 w-64 bg-white/5 rounded-md flex items-center justify-center border border-white/5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                        arjuna-interview.ai
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-0 bg-[#0f1117]">
                  <Image
                    src="/dashboard-preview.png"
                    alt="Dashboard Preview"
                    width={1920}
                    height={1080}
                    className="w-full h-auto object-cover opacity-100 brightness-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-20 pointer-events-none"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <SectionWrapper id="features" className="py-24 bg-slate-50 relative overflow-hidden">

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
            >
              Everything you need to ace the interview
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-slate-600 text-lg max-w-2xl mx-auto"
            >
              Our AI-powered platform provides a comprehensive suite of tools to help you prepare, practice, and perform.
            </motion.p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Feature 1: Voice-based AI Interviews (Large Card - Spans 2 cols on desktop) */}
            <motion.div variants={fadeInUp} className="md:col-span-2 relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl group bg-white">
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
                <div className="relative w-full md:w-1/2 flex justify-center items-center perspective-1000">



                  {/* Glassmorphism Phone Mockup */}
                  <div className="relative w-[280px] h-[540px] rounded-[3rem] border-[6px] border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 transform rotate-[-6deg] group-hover:rotate-0 transition-transform duration-700">
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
                            <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm"></div>
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
                          <div
                            key={i}
                            className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500 shadow-sm"
                            style={{
                              height: `${20 + Math.random() * 60}%`,
                              animation: `pulse 0.8s infinite ${i * 0.1}s alternate`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Instant Score + Feedback */}
            <motion.div variants={fadeInUp} className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
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
            </motion.div>

            {/* Feature 3: Skill Templates */}
            <motion.div variants={fadeInUp} className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
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
            </motion.div>

            {/* Feature 4: Leaderboard Gamification */}
            <motion.div variants={fadeInUp} className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
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
            </motion.div>

            {/* Feature 5: Smart Analytics Reports */}
            <motion.div variants={fadeInUp} className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
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
                        <rect
                          key={`bar-${i}`}
                          x={i * 14.28 + 3.14}
                          y={100 - h}
                          width="8"
                          height={h}
                          rx="2"
                          fill="url(#barGradient)"
                          className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        />
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
            </motion.div>

            {/* Feature 6: AI-Powered Learning Roadmaps - High Quality UI Redesign */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-3 relative rounded-[2.5rem] overflow-hidden bg-[#0B0F19] border border-slate-800 shadow-2xl group"
            >
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
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative pl-20 group/step"
                    >
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
                    </motion.div>

                    {/* Step 2 (Active) */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative pl-20"
                    >
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
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="relative pl-20 group/step"
                    >
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
                    </motion.div>

                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
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

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {/* Google Card */}
            <motion.div variants={fadeInUp} className="group relative rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 p-1 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20">
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
            </motion.div>

            {/* Amazon Card */}
            <motion.div variants={fadeInUp} className="group relative rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 p-1 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className="relative h-full bg-[#0f1117] rounded-[1.9rem] p-8 overflow-hidden">
                {/* Logo Area */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative shadow-lg shadow-orange-500/20">
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 relative z-10"><path d="M13.6 15.6c-.9.5-2.5.9-4.1.4-1.9-.6-3.1-2.6-2.8-4.6.2-1.3 1-2.4 2.2-2.9 1.6-.6 3.4-.1 4.5 1.1.2.2.2.6 0 .8-.2.2-.5.2-.7 0-.9-1-2.3-1.4-3.6-.9-1 .4-1.6 1.3-1.8 2.4-.2 1.6.8 3.2 2.4 3.7 1.3.4 2.6.1 3.4-.4.2-.1.5-.1.7.1.1.3.1.6-.2.7zm5.5-5.4h-1.6v4.6c0 .6-.4 1.1-1 1.1s-1-.5-1-1.1v-4.6h-1.6v4.7c0 1.4 1.1 2.6 2.5 2.6s2.6-1.1 2.6-2.6v-4.7z" /></svg>
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
            </motion.div>

            {/* Microsoft Card */}
            <motion.div variants={fadeInUp} className="group relative rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 p-1 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
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
            </motion.div>
          </motion.div>

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
        </div>
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
            <div
              className="lg:col-span-7 relative h-[700px] overflow-hidden p-6"
              style={{
                maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)"
              }}
            >

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
                    <Card
                      key={`col1-${i}`}
                      className="p-6 border border-white/10 shadow-lg bg-[#141821] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 group hover:-rotate-1 hover:scale-[1.02]"
                    >

                      <p className="text-slate-300 mb-6 leading-relaxed text-sm">&quot;{testimonial.text}&quot;</p>
                      <div className="flex items-center gap-3">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover border-2 border-white/10 group-hover:border-indigo-500/50 transition-colors"
                        />
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
                    <Card
                      key={`col2-${i}`}
                      className="p-6 border border-white/10 shadow-lg bg-[#141821] hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 group hover:rotate-1"
                    >
                      <p className="text-slate-300 mb-6 leading-relaxed text-sm">&quot;{testimonial.text}&quot;</p>
                      <div className="flex items-center gap-3">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover border-2 border-white/10 group-hover:border-indigo-500/50 transition-colors"
                        />
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

      {/* Final CTA Section - Creative Cosmic Design */}
      <SectionWrapper id="cta" className="py-10 relative overflow-hidden">
        {/* Background Grid & Glow */}
        <div className="absolute inset-0 bg-[#0A0A0B]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[min(500px,70vw)] w-[min(500px,70vw)] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[min(300px,50vw)] w-[min(300px,50vw)] rounded-full bg-purple-500/20 blur-[80px] animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto text-center relative">
            {/* Main Card */}
            <div className="relative p-8 md:p-16 group transition-all duration-500">

              {/* Content */}
              {/* Content */}
              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  <span>Join 50,000+ Successful Candidates</span>
                </div>

                <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                  Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">Transform</span> <br />
                  Your Career?
                </h2>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Stop guessing, start improving. Practice with AI that thinks like a hiring manager and land your dream offer at top tech companies.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                  <Button
                    size="lg"
                    className="h-16 px-10 text-lg bg-white text-black hover:bg-slate-100 hover:scale-105 transition-all duration-300 rounded-full font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                    asChild
                  >
                    <Link href="/auth">
                      Start Interviewing Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 px-10 text-lg border-white/10 text-white bg-transparent hover:bg-white/5 hover:text-white hover:border-indigo-500/50 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] rounded-full font-medium backdrop-blur-sm transition-all duration-300"
                    asChild
                  >
                    <Link href="/sample-report">
                      View Sample Report
                    </Link>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="pt-8 flex flex-col items-center gap-6 opacity-60">
                  <p className="text-sm text-slate-500 font-medium">Practice questions inspired by top tech interviews</p>
                  <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 grayscale hover:grayscale-0 transition-all duration-500">
                    {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix'].map((company) => (
                      <span key={company} className="text-lg font-semibold text-white">{company}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Decorative Elements */}
              <div className="absolute top-1/4 -left-12 p-4 bg-[#0A0A0B]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl hidden lg:block animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Offer Received</div>
                    <div className="text-xs text-slate-400">Senior Engineer</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 -right-12 p-4 bg-[#0A0A0B]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl hidden lg:block animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Top 1% Scorer</div>
                    <div className="text-xs text-slate-400">System Design</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Footer */}
      <Footer />
    </div >
  );
}