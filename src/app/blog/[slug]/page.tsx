"use client";

import { useParams } from "next/navigation";
import { getPostBySlug, blogPosts } from "@/lib/blog-data";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Calendar, User, Clock, ArrowLeft, Share2, Twitter, Linkedin, Facebook, ArrowRight, Tag, TrendingUp, Mail, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogPostPage() {
    const { slug } = useParams();
    const post = getPostBySlug(slug as string);
    const categories = Array.from(new Set(blogPosts.map(p => p.category)));

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold mb-4 text-gradient">Post Not Found</h1>
                <p className="text-slate-400 mb-8">The article you're looking for doesn't exist.</p>
                <Button asChild className="rounded-full bg-white text-black hover:bg-slate-200">
                    <Link href="/blog">Back to Blog</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4">
                    {/* Breadcrumbs / Back */}
                    <div className="max-w-7xl mx-auto mb-12">
                        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-all group font-bold text-sm">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Dossier
                        </Link>
                    </div>

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16">
                        {/* Main Content */}
                        <article className="lg:col-span-8">
                            {/* Post Header */}
                            <header className="mb-12">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                                    {post.category}
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
                                    {post.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 border-b border-white/5 pb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-600/20">
                                            {post.author.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white leading-none mb-1">{post.author}</span>
                                            <span className="text-[10px] uppercase tracking-widest font-black opacity-50">Head of Content</span>
                                        </div>
                                    </div>
                                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                                    <div className="flex items-center gap-2 font-bold">
                                        <Calendar className="h-4 w-4 text-indigo-400" />
                                        {post.date}
                                    </div>
                                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                                    <div className="flex items-center gap-2 font-bold">
                                        <Clock className="h-4 w-4 text-indigo-400" />
                                        {post.readTime}
                                    </div>
                                </div>
                            </header>

                            {/* Featured Image */}
                            <div className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden mb-16 border border-white/10 shadow-2xl">
                                <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay" />
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Post Content */}
                            <div
                                className="prose prose-invert prose-indigo max-w-none 
                                prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-8
                                prose-li:text-slate-400 prose-li:text-lg prose-strong:text-white
                                prose-h3:text-3xl prose-h3:mt-16 prose-h3:mb-8 prose-h3:text-white
                                prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-2xl prose-blockquote:px-8 prose-blockquote:py-4 prose-blockquote:not-italic"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            {/* Engagement Footer */}
                            <div className="mt-20 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Spread the Word</div>
                                    <div className="flex gap-3">
                                        {[Twitter, Linkedin, Facebook].map((Icon, i) => (
                                            <button key={i} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all duration-300">
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 gap-2 px-6 h-12 text-xs font-black uppercase tracking-widest">
                                    <Share2 className="h-4 w-4" /> Copy Access Link
                                </Button>
                            </div>

                            {/* Author Bio Section */}
                            <div className="mt-20 p-8 sm:p-12 rounded-[2.5rem] bg-[#13151b] border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                                    <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-black shrink-0 shadow-2xl">
                                        {post.author.charAt(0)}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                            Intelligence Officer
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-3">Verified Intel: {post.author}</h4>
                                        <p className="text-slate-400 leading-relaxed text-lg max-w-2xl opacity-80">
                                            Expert in technical interview preparation and system design architecture. Helping the next generation of engineers land their dream roles at top tech companies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* Sidebar */}
                        <aside className="lg:col-span-4 space-y-10">
                            {/* Search */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Archive Search</h3>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Scan intelligence reports..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Side Navigation - Categories */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-indigo-400" /> Sector Navigation
                                </h3>
                                <nav className="flex flex-col gap-2">
                                    {categories.map((cat, i) => (
                                        <Link
                                            key={i}
                                            href={`/blog?category=${cat}`}
                                            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-slate-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 transition-all group"
                                        >
                                            {cat}
                                            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            {/* Trending Posts */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-indigo-400" /> Prioritized Intelligence
                                </h3>
                                <div className="space-y-8">
                                    {blogPosts.filter(p => p.slug !== post.slug).slice(0, 3).map((p, i) => (
                                        <Link href={`/blog/${p.slug}`} key={i} className="group flex gap-5">
                                            <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                                <img src={p.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors leading-tight mb-2">
                                                    {p.title}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    <span>{p.date}</span>
                                                    <span>•</span>
                                                    <span>{p.readTime}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Newsletter CTA */}
                            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/30 via-indigo-600/5 to-purple-600/20 border border-indigo-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                                <div className="relative z-10 text-center">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                        <Mail className="h-8 w-8 text-indigo-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight leading-none text-gradient">Join the Elite</h3>
                                    <p className="text-slate-400 mb-8 leading-relaxed font-medium">
                                        Get weekly intelligence briefings on distributed systems and AI recruitment shifts.
                                    </p>
                                    <div className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder="agent@company.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                                        />
                                        <Button className="w-full h-14 bg-white text-black hover:bg-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] shadow-xl">
                                            Initialize Protocol
                                        </Button>
                                    </div>
                                    <p className="mt-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        Secure Transmission • 0% Spam
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* Bottom CTA Section */}
                <div className="container mx-auto px-4 mt-32">
                    <div className="max-w-7xl mx-auto p-12 md:p-20 rounded-[3rem] bg-[#13151b] border border-white/5 relative overflow-hidden text-center group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-none relative z-10">
                            Ready to build your <br /> <span className="text-gradient italic">verified track record?</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto relative z-10 opacity-80">
                            Join 10,000+ engineers mastering the art of the interview through intelligent simulation.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all hover:scale-[1.05]" asChild>
                                <Link href="/auth">Start Your Interview</Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest transition-all" asChild>
                                <Link href="/pricing">View All Plans</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
