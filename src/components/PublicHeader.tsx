"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TransitionButton } from "@/components/TransitionButton";

interface PublicHeaderProps {
    transparent?: boolean;
}

export function PublicHeader({ transparent = true }: PublicHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setScrolled(scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        // Run once on mount to set initial state
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "/about", label: "About" },
        { href: "/pricing", label: "Pricing" },
        { href: "/recruiter/auth", label: "Hire with AI" },
        { href: "/blog", label: "Blog" },
        { href: "/contact", label: "Contact" },
        { href: "/faq", label: "FAQ" },
    ];

    return (
        <>
            {/* Top Banner - Vivid Gradient Theme */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center px-4 overflow-hidden shadow-md">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_3s_infinite]"></div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3 text-[11px] sm:text-xs font-medium tracking-wide">
                    <span className="bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px] font-bold backdrop-blur-sm">Limited Offer</span>
                    <span className="text-white/90">
                        Launch Special: Get <span className="text-white font-bold">50% OFF</span> on all Pro plans.
                    </span>
                    <Link href="/pricing" className="group flex items-center gap-1 text-white hover:text-indigo-100 transition-colors ml-1 font-semibold">
                        Claim Offer
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>

            <header className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                <div className={`transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex items-center justify-between pointer-events-auto
                    ${scrolled || !transparent
                        ? "bg-white/90 backdrop-blur-xl border border-indigo-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-2.5 pl-5 pr-2.5 w-full max-w-5xl rounded-full"
                        : "bg-white/70 backdrop-blur-lg border border-white/40 shadow-[0_4px_20px_rgb(0,0,0,0.02)] py-3 pl-6 pr-3 w-full max-w-6xl rounded-full"
                    }`}>

                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-2.5 group mr-8">
                        <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Image
                                src="/arjuna_logo.png"
                                alt="Arjuna AI"
                                width={22}
                                height={22}
                                className="w-5 h-5 object-contain brightness-0 invert"
                            />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Arjuna
                        </span>
                    </Link>

                    {/* Desktop Navigation - Clean & Spaced */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${isActive
                                        ? "text-indigo-600 bg-indigo-50"
                                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 ml-auto md:ml-8">
                        <Link
                            href="/auth"
                            className="hidden sm:inline-flex text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-3 py-2 hover:bg-slate-50 rounded-full"
                        >
                            Sign In
                        </Link>
                        <TransitionButton
                            href="/auth"
                            className="hidden sm:inline-flex bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium px-6 py-2.5 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Get Started
                        </TransitionButton>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-4 right-4 mt-4 p-5 bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-3xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.15)] flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300 pointer-events-auto md:hidden">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-base font-medium text-slate-600 py-3 px-4 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="h-px bg-slate-100 my-2"></div>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/auth"
                                className="flex items-center justify-center w-full text-slate-700 font-semibold py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/auth"
                                className="flex items-center justify-center w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                )}
            </header>
        </>
    );
}