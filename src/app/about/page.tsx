import { Button } from "@/components/ui/button";
import { CheckCircle2, Target, Users, BookOpen, Globe, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";

const SectionWrapper = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
    return (
        <section id={id} className={className}>
            {children}
        </section>
    );
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden">
            <GlobalBackground />

            {/* Navigation - Simple version for SEO pages */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8 object-contain" />
                        <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                            Arjuna AI
                        </span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/auth" className="text-sm font-medium hover:text-indigo-400 transition-colors">Login</Link>
                        <Button size="sm" className="bg-white text-black hover:bg-slate-200 rounded-full" asChild>
                            <Link href="/auth">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    {/* Hero Section */}
                    <div className="max-w-4xl mx-auto text-center mb-20">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            Our Mission to <span className="text-indigo-500">Empower</span> Every Candidate
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed">
                            Arjuna AI was born from a simple observation: interview preparation is often biased, expensive, and stressful. We're changing that by providing world-class AI coaching to everyone, everywhere.
                        </p>
                    </div>

                    {/* Vision/Mission Cards */}
                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
                                <Target className="h-6 w-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Our Vision</h3>
                            <p className="text-slate-400 leading-relaxed">
                                To become the global standard for interview preparation, making career advancement accessible to all through intelligent automation.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                                <Users className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Our Values</h3>
                            <p className="text-slate-400 leading-relaxed">
                                We believe in fairness, transparency, and the power of technology to bridge the gap between potential and opportunity.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6">
                                <Globe className="h-6 w-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Our Commitment</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Continuous innovation in AI to provide the most realistic and helpful interview simulations possible.
                            </p>
                        </div>
                    </div>

                    {/* Story Section */}
                    <div className="max-w-4xl mx-auto mb-24">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">The Arjuna Story</h2>
                        <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                            <p>
                                Founded in 2024, Arjuna AI started as a tool to help developers practice system design interviews. As we saw the impact it had on their confidence and success, we realized the potential was much broader.
                            </p>
                            <p>
                                Today, we support dozens of roles from Product Management to UX Design, helping tens of thousands of users land offers at companies like Google, Meta, and Amazon. Our AI models are trained on real-world interview patterns and hiring rubrics from top tech firms.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="rounded-[3rem] bg-gradient-to-b from-indigo-500/20 to-transparent border border-indigo-500/20 p-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-6">Ready to start your journey?</h2>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                            Join thousands of professionals who have mastered their interview skills with Arjuna AI.
                        </p>
                        <Button size="lg" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold" asChild>
                            <Link href="/auth">
                                Start Practicing Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer - Simple version copied from landing */}
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
