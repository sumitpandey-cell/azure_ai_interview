"use client";
import { Twitter, Github, Linkedin, Instagram, Mail, MapPin, Phone, ArrowUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/5 pt-24 pb-12 relative overflow-hidden text-slate-400">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

                    {/* Brand & Contact - Takes up 5 cols */}
                    <div className="lg:col-span-4 flex flex-col">
                        <Link href="/" className="flex items-center gap-4 text-3xl font-bold mb-8 group w-fit">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                                <Image src="/arjuna_logo.png" alt="Arjuna AI" width={36} height={36} className="h-9 w-9 object-contain relative z-10 brightness-110" />
                            </div>
                            <span className="text-white group-hover:text-indigo-400 transition-all tracking-tight">
                                Arjuna Ai
                            </span>
                        </Link>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-start gap-3 group">
                                <MapPin className="h-5 w-5 text-indigo-400/60 group-hover:text-indigo-400 transition-colors mt-0.5" />
                                <p className="text-sm leading-relaxed max-w-[240px] text-slate-300">
                                    Tech Hub, Innovation Drive,<br />
                                    Palo Alto, CA 94301
                                </p>
                            </div>
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <Mail className="h-5 w-5 text-indigo-400/60 group-hover:text-indigo-400 transition-colors" />
                                <span className="text-sm text-slate-300">support@arjunaai.com</span>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <Phone className="h-5 w-5 text-indigo-400/60 group-hover:text-indigo-400 transition-colors" />
                                <span className="text-sm text-slate-300">+1 (555) 012-3456</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {[Twitter, Github, Linkedin, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-300 hover:-translate-y-1 shadow-sm">
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Columns - Takes up 8 cols */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {/* Column 1 */}
                        <div className="flex flex-col gap-5">
                            <h4 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-50">Company</h4>
                            <Link href="/about" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">About Us</Link>
                            <Link href="/blog" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Blog</Link>
                            <Link href="/pricing" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Pricing</Link>
                            <Link href="/auth" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Sign In / Sign Up</Link>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col gap-5">
                            <h4 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-50">Quick Navigation</h4>
                            <Link href="/" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Home</Link>
                            <Link href="/templates" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Career Preparation</Link>
                            <Link href="/roadmap" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Learn & Grow</Link>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col gap-5">
                            <h4 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-50">Tools</h4>
                            <Link href="/dashboard" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Career Vault</Link>
                            <Link href="/start-interview" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">The Prep Engine</Link>
                            <Link href="/templates" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Mock Interview</Link>
                            <Link href="/roadmap" className="text-slate-400 hover:text-indigo-400 font-medium text-sm transition-colors w-fit">Smart Career Coach</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} Arjuna Ai. All Rights Reserved.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group"
                    >
                        Back to the top
                        <ArrowUp className="h-3 w-3 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Massive Background text */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden h-[300px]">
                <span className="text-[25vw] font-bold text-white/[0.01] whitespace-nowrap leading-none tracking-tighter">
                    Arjuna Ai
                </span>
            </div>
        </footer>
    );
}
