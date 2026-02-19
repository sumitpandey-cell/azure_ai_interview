import { Mic, BarChart3, Target, Sparkles, Brain, ArrowRight, Zap } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

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
    icon: React.ElementType;
    visual?: React.ReactNode;
    delay?: number
}) => {
    return (
        <ScrollReveal
            delay={delay}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between",
                className
            )}
        >
            {/* Soft Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Icon className="h-6 w-6" />
                    </div>
                    {/* Optional Arrow/Icon Top Right */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="h-5 w-5 text-slate-300" />
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
                <div className="relative flex-1 w-full flex items-center justify-center mt-auto min-h-[160px] rounded-2xl bg-slate-50/50 border border-slate-100 overflow-hidden group-hover:border-indigo-100 transition-colors">
                    {visual ? visual : children}
                    {/* Glass overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
                        visual={
                            <div className="w-full h-full flex items-center justify-center p-6 relative">
                                {/* Abstract Waveform Visualization */}
                                <div className="flex items-end gap-1.5 h-32 w-full justify-center opacity-80">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2.5 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full shadow-sm"
                                            style={{
                                                height: `${Math.max(20, Math.random() * 100)}%`,
                                                animation: `pulse-height 1.5s infinite ${i * 0.1}s ease-in-out alternate`
                                            }}
                                        />
                                    ))}
                                </div>
                                {/* Floater */}
                                <div className="absolute top-[20%] right-[20%] bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-float">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-700">Recording...</span>
                                </div>
                            </div>
                        }
                    />

                    {/* Feature 2: Smart Feedback (Span 1 Col) */}
                    <BentoCard
                        className="md:col-span-1"
                        title="Instant Feedback"
                        description="Get a detailed scorecard immediately after your session. Identify areas for improvement."
                        icon={Zap}
                        delay={0.2}
                        visual={
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                                <div className="bg-white w-48 rounded-2xl shadow-xl border border-slate-100 p-4 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Clarity Score</span>
                                        <span className="text-emerald-500 font-bold text-sm">92%</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full w-[92%] bg-emerald-500 rounded-full" />
                                        </div>
                                        <div className="h-2 w-3/4 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full w-[78%] bg-indigo-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    />

                    {/* Feature 3: Analytics (Span 1 Col) */}
                    <BentoCard
                        className="md:col-span-1"
                        title="Progress Tracking"
                        description="Visualize your growth over time with interactive charts and performance insights."
                        icon={BarChart3}
                        delay={0.3}
                        visual={
                            <div className="w-full h-full flex items-center justify-center p-6 bg-slate-50/50">
                                <div className="relative w-full h-32">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                                        <path d="M0,50 Q25,20 50,30 T100,10" fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#a855f7" />
                                            </linearGradient>
                                        </defs>
                                        {/* Points */}
                                        <circle cx="0" cy="50" r="3" fill="#6366f1" />
                                        <circle cx="50" cy="30" r="3" fill="#8b5cf6" />
                                        <circle cx="100" cy="10" r="3" fill="#a855f7" />
                                    </svg>
                                </div>
                            </div>
                        }
                    />

                    {/* Feature 4: Skill Templates (Span 2 Cols) */}
                    <BentoCard
                        className="md:col-span-2"
                        title="Role-Specific Templates"
                        description="Practice for specific roles like Frontend, Backend, System Design, and Behavioral rounds with curated question banks."
                        icon={Target}
                        delay={0.4}
                        visual={
                            <div className="w-full h-full p-8 flex flex-wrap content-center justify-center gap-4 relative">
                                {[
                                    { l: "React", c: "bg-cyan-50 text-cyan-600 border-cyan-100" },
                                    { l: "System Design", c: "bg-purple-50 text-purple-600 border-purple-100" },
                                    { l: "Behavioral", c: "bg-amber-50 text-amber-600 border-amber-100" },
                                    { l: "Node.js", c: "bg-green-50 text-green-600 border-green-100" },
                                    { l: "Leadership", c: "bg-rose-50 text-rose-600 border-rose-100" }
                                ].map((tag, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-bold border shadow-sm transform hover:scale-110 transition-transform duration-300 cursor-default",
                                            tag.c
                                        )}
                                        style={{
                                            animation: `float 3s infinite ${i * 0.5}s ease-in-out alternate`
                                        }}
                                    >
                                        {tag.l}
                                    </span>
                                ))}
                            </div>
                        }
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

                            <div className="relative w-full max-w-md">
                                {/* Video Container - Cool Glowing Border */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[1.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative rounded-[1.4rem] overflow-hidden bg-[#0A0A0B] ring-1 ring-white/10 shadow-2xl transform skew-y-3 group-hover:skew-y-0 text-clip transition-all duration-500">
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
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
}
