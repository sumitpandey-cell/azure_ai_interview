"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search, MessageCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { useState } from "react";
import { Footer } from "@/components/Footer";

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border-b border-slate-100 transition-all duration-300 ${isOpen ? 'bg-indigo-50/50 rounded-2xl border-transparent' : ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left py-6 px-4 md:px-6"
            >
                <h3 className={`text-lg md:text-xl font-semibold transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-700 hover:text-indigo-600'}`}>
                    {question}
                </h3>
                <div className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-600 rotate-45' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <Plus className={`h-5 w-5 transition-colors ${isOpen ? 'text-white' : 'text-slate-500'}`} />
                </div>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out px-4 md:px-6 ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
            >
                <div className="text-slate-600 leading-relaxed text-base md:text-lg border-t border-slate-100/50 pt-4">
                    {answer}
                </div>
            </div>
        </div>
    );
};

import { PublicHeader } from "@/components/PublicHeader";

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const categories = ["All", "General", "Subscription", "Interviews", "Technical"];

    const faqs = [
        {
            category: "General",
            question: "How does the AI interview work?",
            answer: "Our AI uses advanced Large Language Models and Speech-to-Text tech to simulate a real conversation. It listens to your answers, asks relevant follow-up questions, and evaluates your performance based on industry-standard hiring rubrics."
        },
        {
            category: "Subscription",
            question: "Is there a free version of Arjuna AI?",
            answer: "Yes! Every user gets 15 minutes of free practice time daily. This resets every 24 hours, allowing you to maintain a consistent practice routine without a paid subscription."
        },
        {
            category: "Interviews",
            question: "Can I practice for specific companies?",
            answer: "Absolutely. We have specialized templates for companies like Google, Meta, Amazon, and Microsoft. These include company-specific behavioral questions and technical expectations."
        },
        {
            category: "Interviews",
            question: "How detailed is the feedback?",
            answer: "After each interview, you get a comprehensive report covering your communication skills, technical accuracy, pace, and tone. We provide specific suggestions on how to rephrase answers for better impact."
        },
        {
            category: "General",
            question: "Which roles are supported?",
            answer: "We support a wide range of roles including Software Engineer (Junior to Staff), Product Manager, UX Designer, Data Scientist, Marketing Manager, and Business Analyst."
        },
        {
            category: "Technical",
            question: "Can I redo an interview session?",
            answer: "Yes, you can restart any session or use our 'Continue' feature to pick up where you left off. All your attempts are saved in your dashboard for progress tracking."
        },
        {
            category: "Subscription",
            question: "What is included in the Pro plan?",
            answer: "The Pro plan includes unlimited interview practice, access to all company-specific templates, advanced analytics, and priority support. You can cancel anytime."
        },
        {
            category: "Technical",
            question: "Do I need a microphone?",
            answer: "Yes, for the full voice interview experience, a microphone is required. However, we also support a text-only mode for practicing in quiet environments."
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4">
                    {/* Hero & Search */}
                    <div className="max-w-3xl mx-auto text-center mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <HelpCircle className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
                            How can we <span className="text-indigo-600">help?</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10">
                            Everything you need to know about preparing with Arjuna AI.
                        </p>

                        <div className="relative max-w-2xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
                            <div className="relative bg-white rounded-xl flex items-center p-2 border border-slate-200 group-hover:border-indigo-300 transition-colors shadow-sm">
                                <Search className="h-6 w-6 text-slate-400 ml-3 mr-4" />
                                <input
                                    type="text"
                                    placeholder="Search for answers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-lg py-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories & FAQs */}
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-wrap gap-2 justify-center mb-12">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 min-h-[400px]">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, i) => (
                                    <FAQItem key={i} question={faq.question} answer={faq.answer} />
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-400 font-medium">
                                    No questions found matching your search.
                                </div>
                            )}
                        </div>

                        {/* CTA Box */}
                        <div className="mt-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-12 text-center relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center mx-auto mb-6 border border-indigo-100">
                                    <MessageCircle className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h3>
                                <p className="text-slate-600 mb-8 max-w-md mx-auto font-medium">
                                    Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
                                </p>
                                <Button size="lg" className="h-12 px-8 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-bold shadow-lg" asChild>
                                    <Link href="/contact">Contact Support</Link>
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
