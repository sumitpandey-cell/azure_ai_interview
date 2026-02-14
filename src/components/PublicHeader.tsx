"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TransitionButton } from "@/components/TransitionButton";

interface PublicHeaderProps {
    transparent?: boolean;
}

export function PublicHeader({ transparent = true }: PublicHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const heroHeight = window.innerHeight;

            setScrolled(scrollY > 20);

            // Only hide on the landing page (where path is /)
            if (window.location.pathname === '/' && scrollY > heroHeight - 100) {
                setHidden(true);
            } else {
                setHidden(false);
            }
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
        <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex items-center justify-between pointer-events-auto
                ${scrolled || !transparent
                    ? "bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-2.5 pl-5 pr-2.5 w-full max-w-4xl rounded-full"
                    : "bg-white/60 backdrop-blur-lg border border-white/20 shadow-[0_4px_20px_rgb(0,0,0,0.02)] py-3 pl-6 pr-3 w-full max-w-5xl rounded-full"
                }`}>

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2.5 group mr-8">
                    <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/arjuna_logo.png"
                            alt="Arjuna AI"
                            width={20}
                            height={20}
                            className="w-5 h-5 object-contain brightness-0 invert"
                        />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Arjuna
                    </span>
                </Link>

                {/* Desktop Navigation - Centered */}
                <nav className="hidden md:flex items-center justify-center gap-1 bg-slate-100/50 rounded-full px-1.5 py-1 border border-white/50">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${isActive
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
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
                        className="hidden sm:inline-flex text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-2"
                    >
                        Sign In
                    </Link>
                    <TransitionButton
                        href="/auth"
                        className="hidden sm:inline-flex bg-[#0A0A0B] hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Get Started
                    </TransitionButton>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-4 right-4 mt-4 p-4 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300 pointer-events-auto md:hidden">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-base font-medium text-slate-600 py-3 px-4 hover:bg-slate-50 rounded-xl transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="h-px bg-slate-100 my-2"></div>
                    <Link
                        href="/auth"
                        className="flex items-center justify-center w-full bg-[#0A0A0B] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-slate-900/10"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Get Started Free
                    </Link>
                </div>
            )}
        </header>
    );
}
