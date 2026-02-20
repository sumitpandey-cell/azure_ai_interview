import { Mic, BarChart3, Trophy, Target, Sparkles, Brain, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import Three.js components to avoid SSR issues
const WaveVisual = dynamic(() => import("./features/WaveVisual"), { ssr: false });
const FeedbackVisual = dynamic(() => import("./features/FeedbackVisual"), { ssr: false });
const ProgressVisual = dynamic(() => import("./features/ProgressVisual"), { ssr: false });
const RolesVisual = dynamic(() => import("./features/RolesVisual"), { ssr: false });
const LogicVisual = dynamic(() => import("./features/LogicVisual"), { ssr: false });

// Reusable Bento Card Component
const BentoCard = ({
    children,
    className,
    title,
    description,
    icon: Icon,
    visual,
    delay = 0
}: {
    children?: React.ReactNode;
    className?: string;
    title: string;
    description: string;
    icon: any;
    visual?: React.ReactNode;
    delay?: number
}) => {
    return (
        <ScrollReveal
            delay={delay}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col justify-between",
                className
            )}
        >
            {/* Soft Gradient Background & Grain Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] pointer-events-none transition-opacity duration-700 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500"
                    >
                        <Icon className="h-6 w-6" />
                    </motion.div>
                    {/* Optional Arrow/Icon Top Right */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <ArrowRight className="h-4 w-4 text-slate-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-indigo-900 transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {description}
                    </p>
                </div>

                {/* Visual Container */}
                <div className="relative flex-1 w-full flex items-center justify-center mt-auto min-h-[220px] rounded-3xl bg-slate-50/30 border border-slate-100/50 overflow-hidden group-hover:border-indigo-100/50 group-hover:bg-indigo-50/10 transition-all duration-700 shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center">
                        {visual ? visual : children}
                    </div>
                    {/* Glass overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
            </div>
        </ScrollReveal>
    );
}

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">

                {/* Header */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                        <Sparkles className="h-3 w-3 fill-indigo-600" />
                        Powerful Features
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                        Everything you need to <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">ace the interview.</span>
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                        Designed to simplify your preparation. Our AI-powered features help you practice smarter, not harder.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(400px,auto)]">

                    {/* Feature 1: Real-time Voice (Large - Spans 2 Cols) */}
                    <BentoCard
                        className="md:col-span-2"
                        title="Real-Time Voice Analysis"
                        description="Speak naturally. Our AI listens, transcribes, and analyzes your speech patterns, tone, and clarity in real-time."
                        icon={Mic}
                        delay={0.1}
                        visual={<WaveVisual />}
                    />

                    {/* Feature 2: Smart Feedback (Span 1 Col) */}
                    <BentoCard
                        className="md:col-span-1"
                        title="Instant Feedback"
                        description="Get a detailed scorecard immediately after your session. Identify areas for improvement."
                        icon={Zap}
                        delay={0.2}
                        visual={<FeedbackVisual />}
                    />

                    {/* Feature 3: Analytics (Span 1 Col) */}
                    <BentoCard
                        className="md:col-span-1"
                        title="Progress Tracking"
                        description="Visualize your growth over time with interactive charts and performance insights."
                        icon={BarChart3}
                        delay={0.3}
                        visual={<ProgressVisual />}
                    />

                    {/* Feature 4: Skill Templates (Span 2 Cols) */}
                    <BentoCard
                        className="md:col-span-2"
                        title="Role-Specific Templates"
                        description="Practice for specific roles like Frontend, Backend, System Design, and Behavioral rounds with curated question banks."
                        icon={Target}
                        delay={0.4}
                        visual={<RolesVisual />}
                    />

                    {/* Feature 5: AI Roadmap (Span 3 Cols - Full Width) */}
                    <ScrollReveal
                        delay={0.5}
                        className="md:col-span-3 group relative overflow-hidden rounded-[2.5rem] bg-[#0B0F19] border border-slate-800 shadow-2xl flex flex-col md:flex-row"
                    >
                        {/* Custom Content Override for the Roadmap Panel */}
                        <div className="absolute inset-0 bg-[#0B0F19]">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                            {/* Glows */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 p-8 md:p-12 h-full w-full">
                            <div className="flex-1 space-y-6 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                    <Brain className="h-3 w-3" />
                                    <span>Smart Logic</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                    Personalized Growth Roadmaps
                                </h3>
                                <p className="text-slate-400 text-lg max-w-xl">
                                    Our AI analyzes your performance to build a custom curriculum, targeting your weak spots with precision.
                                </p>
                            </div>

                            <div className="relative w-full max-w-md min-h-[300px] flex items-center justify-center">
                                {/* 3D Visual in Background */}
                                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
                                    <LogicVisual />
                                </div>

                                {/* Video Container - Cool Glowing Border */}
                                <div className="relative z-10 w-full">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[1.5rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative rounded-[1.4rem] overflow-hidden bg-[#0A0A0B]/80 backdrop-blur-sm ring-1 ring-white/10 shadow-2xl transform group-hover:scale-[1.02] transition-all duration-700">
                                        <video
                                            src="/roadmapvideo.mp4"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                        />
                                        {/* Overlay Gradient for seamless blend */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-20 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
}
