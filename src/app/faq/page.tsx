import { Button } from "@/components/ui/button";
import { Plus, Minus, Search, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { useState } from "react";

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    return (
        <details className="group border-b border-white/10 py-6">
            <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {question}
                </h3>
                <div className="flex-shrink-0 ml-4">
                    <Plus className="h-6 w-6 text-slate-500 group-open:hidden" />
                    <Minus className="h-6 w-6 text-indigo-400 hidden group-open:block" />
                </div>
            </summary>
            <div className="mt-4 text-slate-400 leading-relaxed text-lg animate-in fade-in slide-in-from-top-2 duration-300">
                {answer}
            </div>
        </details>
    );
};

export default function FAQPage() {
    const categories = [
        { name: "General", count: 8 },
        { name: "Subscription", count: 5 },
        { name: "Interviews", count: 12 },
        { name: "Technical", count: 6 },
    ];

    const faqs = [
        {
            question: "How does the AI interview work?",
            answer: "Our AI uses advanced Large Language Models and Speech-to-Text tech to simulate a real conversation. It listens to your answers, asks relevant follow-up questions, and evaluates your performance based on industry-standard hiring rubrics."
        },
        {
            question: "Is there a free version of Arjuna AI?",
            answer: "Yes! Every user gets 15 minutes of free practice time daily. This resets every 24 hours, allowing you to maintain a consistent practice routine without a paid subscription."
        },
        {
            question: "Can I practice for specific companies?",
            answer: "Absolutely. We have specialized templates for companies like Google, Meta, Amazon, and Microsoft. These include company-specific behavioral questions and technical expectations."
        },
        {
            question: "How detailed is the feedback?",
            answer: "After each interview, you get a comprehensive report covering your communication skills, technical accuracy, pace, and tone. We provide specific suggestions on how to rephrase answers for better impact."
        },
        {
            question: "Which roles are supported?",
            answer: "We support a wide range of roles including Software Engineer (Junior to Staff), Product Manager, UX Designer, Data Scientist, Marketing Manager, and Business Analyst."
        },
        {
            question: "Can I redo an interview session?",
            answer: "Yes, you can restart any session or use our 'Continue' feature to pick up where you left off. All your attempts are saved in your dashboard for progress tracking."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden">
            <GlobalBackground />

            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8 object-contain" />
                        <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Arjuna AI</span>
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
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h1 className="text-5xl font-bold text-white mb-6">Frequently Asked <span className="text-indigo-500">Questions</span></h1>
                        <p className="text-xl text-slate-400">Everything you need to know about preparing with Arjuna AI.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-4 mb-12">
                            {categories.map((cat) => (
                                <button key={cat.name} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-indigo-500/50 transition-all group">
                                    <div className="text-white font-semibold mb-1 group-hover:text-indigo-400">{cat.name}</div>
                                    <div className="text-xs text-slate-500">{cat.count} articles</div>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {faqs.map((faq, i) => (
                                <FAQItem key={i} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>

                        <div className="mt-20 p-8 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20 text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="h-8 w-8 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                Can't find the answer you're looking for? Please chat with our friendly team.
                            </p>
                            <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold" asChild>
                                <Link href="/contact">Contact Support</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-[#0A0A0B] border-t border-white/10 pt-20 pb-10">
                <div className="container mx-auto px-4 border-t border-white/5 pt-8 text-center">
                    <p className="text-slate-500 text-sm">© 2025 Arjuna AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
