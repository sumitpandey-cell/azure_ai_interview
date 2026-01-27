"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Search, Tag, TrendingUp, Mail, Twitter, Github, Linkedin, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { blogPosts } from "@/lib/blog-data";

export default function BlogPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const featuredPost = blogPosts[0];
    const regularPosts = blogPosts.slice(1);

    const categories = Array.from(new Set(blogPosts.map(post => post.category)));

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4">
                    {/* Hero Header */}
                    <div className="max-w-4xl mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                            Arjuna Insights
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                            The Future of <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Engineering Careers</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                            Deep dives into system design, AI recruitment shifts, and strategies to land elite engineering roles.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Main Content Column */}
                        <div className="lg:col-span-8 space-y-12">

                            {/* Featured Post Card */}
                            <Link href={`/blog/${featuredPost.slug}`} className="block group">
                                <div className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#13151b] shadow-2xl transition-all duration-500 group-hover:border-indigo-500/30">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent z-10" />
                                    <Image
                                        src={featuredPost.image}
                                        alt={featuredPost.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 z-20 p-8 md:p-12 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 text-xs font-bold text-indigo-400 mb-4 uppercase tracking-[0.2em]">
                                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">Featured</span>
                                            <span>•</span>
                                            <span>{featuredPost.readTime}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors tracking-tight">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-slate-300 text-lg line-clamp-2 max-w-2xl mb-6 opacity-80">
                                            {featuredPost.excerpt}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/10">
                                                {featuredPost.author.charAt(0)}
                                            </div>
                                            <div className="text-sm">
                                                <div className="text-white font-bold">{featuredPost.author}</div>
                                                <div className="text-slate-400">{featuredPost.date}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />

                            {/* Posts Grid */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {regularPosts.map((post, i) => (
                                    <Link href={`/blog/${post.slug}`} key={i} className="group flex flex-col h-full bg-[#13151b]/40 rounded-3xl overflow-hidden border border-white/5 hover:border-indigo-500/20 hover:bg-[#13151b]/60 transition-all duration-300">
                                        <div className="h-56 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay z-10" />
                                            <Image
                                                src={post.image}
                                                alt={post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-4 left-4 z-20">
                                                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                    {post.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {post.date}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {post.readTime}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                                                {post.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-3 opacity-70">
                                                {post.excerpt}
                                            </p>
                                            <div className="inline-flex items-center text-indigo-400 text-xs font-black uppercase tracking-widest group-hover:gap-2 transition-all">
                                                Intel Report <ArrowRight className="ml-2 h-4 w-4" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <aside className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-32">
                            {/* Search Box */}
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Search Knowledge</h3>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Topics or keywords..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-indigo-400" /> Categories
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat, i) => (
                                        <button key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 transition-all">
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trending / Recommended */}
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-indigo-400" /> Trending Reports
                                </h3>
                                <div className="space-y-6">
                                    {blogPosts.slice(0, 3).map((post, i) => (
                                        <Link href={`/blog/${post.slug}`} key={i} className="group flex gap-4">
                                            <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-white/10 relative">
                                                <Image
                                                    src={post.image}
                                                    alt=""
                                                    fill
                                                    className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors leading-snug mb-1">
                                                    {post.title}
                                                </h4>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{post.date}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Newsletter / Join CTA */}
                            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/20 via-indigo-600/5 to-purple-600/20 border border-indigo-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <Mail className="h-8 w-8 text-indigo-400 mb-6" />
                                <h3 className="text-xl font-bold text-white mb-2">Join the inner circle</h3>
                                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                                    Get our weekly briefing on AI hiring trends and system design deep dives.
                                </p>
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="agent@company.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                    <Button className="w-full h-12 bg-white text-black hover:bg-slate-200 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02]">
                                        Initialize Access
                                    </Button>
                                </div>
                            </div>

                            {/* Social Connectivity */}
                            <div className="flex items-center justify-between px-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Connect</div>
                                <div className="flex gap-4">
                                    {[Twitter, Github, Linkedin, MessageSquare].map((Icon, i) => (
                                        <Link key={i} href="#" className="text-slate-500 hover:text-white transition-colors">
                                            <Icon className="h-4 w-4" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
