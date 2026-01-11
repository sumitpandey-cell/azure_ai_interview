"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User, Tag } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

export default function BlogPage() {
    const posts = [
        {
            title: "How to Ace the System Design Interview in 2025",
            excerpt: "A comprehensive guide to mastering distributed systems, scalability, and trade-off analysis for L5+ engineering roles.",
            author: "Alex Chen",
            date: "Jan 10, 2025",
            category: "Interview Tips",
            image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop"
        },
        {
            title: "The Rise of AI in Tech Hiring: What Candidates Need to Know",
            excerpt: "Understanding how companies are using AI to screen candidates and how you can optimize your profile for the new era.",
            author: "Sarah Jones",
            date: "Jan 5, 2025",
            category: "Industry Trends",
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&h=300&fit=crop"
        },
        {
            title: "Top 10 Behavioral Interview Questions Answered",
            excerpt: "Breaking down the most common STAR method questions and how to structure your stories for maximum impact.",
            author: "Michael Ross",
            date: "Dec 28, 2024",
            category: "Behavioral",
            image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&h=300&fit=crop"
        },
        {
            title: "Cracking the Product Management Interview at Meta",
            excerpt: "Insider tips on product sense, execution, and leadership rounds from successful PM candidates.",
            author: "David Lee",
            date: "Dec 20, 2024",
            category: "Product Management",
            image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=300&fit=crop"
        },
        {
            title: "Data Structures You Actually Need for FAANG Interviews",
            excerpt: "Stop memorizing everything. Focus on these 7 core data structures that cover 90% of technical interview questions.",
            author: "Emily White",
            date: "Dec 15, 2024",
            category: "Coding",
            image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=500&h=300&fit=crop"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4 mb-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Insights & <span className="text-indigo-400">Updates</span>
                        </h1>
                        <p className="text-xl text-slate-400">
                            The latest interview strategies, success stories, and product updates from the Arjuna AI team.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, i) => (
                            <Link href="#" key={i} className="group flex flex-col h-full bg-[#13151b] rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                                <div className="h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay z-10" />
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <div className="inline-flex items-center text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
                                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
