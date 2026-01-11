"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { TransitionButton } from "@/components/TransitionButton";

export function PublicHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8 object-contain relative z-10" />
                    </div>
                    <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent group-hover:to-indigo-300 transition-all">
                        Arjuna AI
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">About</Link>
                    <Link href="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</Link>
                    <Link href="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Blog</Link>
                    <Link href="/careers" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Careers</Link>
                </nav>

                <div className="flex items-center gap-6">
                    <Link href="/auth" className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Login</Link>
                    <TransitionButton
                        size="sm"
                        href="/auth"
                        className="hidden md:flex bg-white text-black hover:bg-slate-200 rounded-full font-medium px-6"
                        transitionColor="#ffffff"
                    >
                        Get Started
                    </TransitionButton>

                    {/* Mobile Toggle */}
                    <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-[#0A0A0B] border-b border-white/5 p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
                    <Link href="/about" className="text-slate-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
                    <Link href="/pricing" className="text-slate-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                    <Link href="/blog" className="text-slate-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                    <Link href="/careers" className="text-slate-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Careers</Link>
                    <Link href="/auth" className="text-slate-400 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    <Button className="w-full bg-white text-black hover:bg-slate-200 rounded-full font-medium" asChild>
                        <Link href="/auth">Get Started</Link>
                    </Button>
                </div>
            )}
        </header>
    );
}
