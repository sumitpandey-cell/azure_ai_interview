import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, Users, BookOpen, Award, ArrowRight, Zap, Shield, Briefcase } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />

            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                {/* Hero Section */}
                <div className="container mx-auto px-4 mb-24 md:mb-32">
                    <div className="max-w-5xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Revolutionizing Interview Prep
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
                            We're building the <br className="hidden md:block" />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">future of career growth</span>
                        </h1>

                        <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            Arjuna AI bridges the gap between potential and opportunity. We use advanced AI to democratize access to world-class coaching, making interview mastery accessible to everyone.
                        </p>
                    </div>
                </div>

                {/* Vision/Mission/Values Grid */}
                <div className="container mx-auto px-4 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-forwards" style={{ animationDelay: '200ms' }}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Vision - Large Card */}
                        <div className="lg:col-span-2 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/20 to-indigo-900/5 border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                <Target className="h-64 w-64 text-indigo-500 rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10 shadow-xl shadow-indigo-900/20">
                                    <Target className="h-8 w-8 text-indigo-300" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-6">Our Vision</h3>
                                <p className="text-xl text-indigo-100/70 leading-relaxed max-w-xl">
                                    To become the global standard for interview preparation, creating a world where every candidate is judged solely on their skills and potential, not their background or connections.
                                </p>
                            </div>
                        </div>

                        {/* Values - Tall Card */}
                        <div className="lg:row-span-2 p-8 md:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />

                            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-8 backdrop-blur-sm">
                                <Users className="h-8 w-8 text-purple-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-8">Our Core Values</h3>
                            <ul className="space-y-8">
                                {[
                                    { title: "Candidate First", desc: "We obsess over the user experience and their success." },
                                    { title: "Radical Transparency", desc: "We provide honest, actionable feedback without fluff." },
                                    { title: "Continuous Evolution", desc: "We improve our AI daily based on real-world hiring trends." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                                        <div>
                                            <div className="text-white font-semibold mb-1">{item.title}</div>
                                            <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Mission - Regular Card */}
                        <div className="p-8 md:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/10 hover:border-pink-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent to-pink-500/5 group-hover:to-pink-500/10 transition-all duration-500" />

                            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-8 backdrop-blur-sm relative z-10">
                                <Shield className="h-8 w-8 text-pink-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Our Mission</h3>
                            <p className="text-slate-400 leading-relaxed mb-6 relative z-10">
                                Empowering 10 million professionals to land their dream jobs by 2026 through accessible, high-quality, and personalized AI coaching.
                            </p>
                        </div>

                        {/* Technology - Regular Card */}
                        <div className="p-8 md:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent group-hover:from-emerald-500/10 transition-all duration-500" />

                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 backdrop-blur-sm relative z-10">
                                <Zap className="h-8 w-8 text-emerald-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Technology</h3>
                            <p className="text-slate-400 leading-relaxed relative z-10">
                                Leveraging state-of-the-art LLMs, Speech Recognition, and Behavioral Analysis to simulate reality with 99% accuracy.
                            </p>
                        </div>
                    </div>
                </div>

                {/* The "Timeline" Story Section */}
                <div className="container mx-auto px-4 mb-32">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Our Journey</h2>
                            <p className="text-slate-400 text-lg">From a dorm room idea to a global platform.</p>
                        </div>

                        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/20 before:to-transparent">
                            {[
                                { year: "2024", title: "The Inception", desc: "Founded by a group of engineers who realized the interview process was broken. Launched the first beta of the System Design interviewer." },
                                { year: "2024 Q3", title: "Market Validation", desc: "Reached 10,000 active users. Expanded into Behavioral and Product Management interviews." },
                                { year: "2025", title: "Arjuna 2.0", desc: "Introduced real-time voice feedback and partnership with top tech hiring boards to refine our rubrics." }
                            ].map((item, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-[#0A0A0B] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-white text-xl">{item.title}</h3>
                                            <span className="text-indigo-400 font-mono text-sm">{item.year}</span>
                                        </div>
                                        <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Big CTA */}
                <div className="container mx-auto px-4">
                    <div className="rounded-[3rem] relative overflow-hidden bg-[#0F0F12] border border-white/10 p-12 md:p-24 text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_70%)]" />
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                                Ready to master your <br />
                                <span className="text-indigo-400">next interview?</span>
                            </h2>
                            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                                Join the thousands of high-performers who trust Arjuna AI to help them land offers at the world's most competitive companies.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button size="lg" className="h-16 px-10 text-lg bg-white text-black hover:bg-slate-100 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105" asChild>
                                    <Link href="/auth">
                                        Start For Free
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="h-16 px-10 text-lg border-white/10 text-white hover:bg-white/5 rounded-full font-medium" asChild>
                                    <Link href="/contact">
                                        Contact Sales
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Needed for the GlobeIcon used above - Lucide exports it as Globe
function Globe({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
