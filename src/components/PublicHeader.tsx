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
        { href: "/blog", label: "Blog" },
        { href: "/contact", label: "Contact" },
        { href: "/faq", label: "FAQ" },
    ];

    return (
        <header
            className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                } ${scrolled ? "top-4 flex justify-center px-3" : "top-0 py-6"}`}
        >
            <div
                className={`transition-all duration-500 ease-in-out flex items-center justify-between ${scrolled
                    ? "bg-[#0f1117]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-full px-4 py-3 w-full max-w-5xl ring-1 ring-white/5"
                    : `w-full container mx-auto px-4 sm:px-6 ${transparent ? "bg-transparent border-transparent" : "bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5"} border ring-0`
                    }`}
            >
                <Link href="/" className="flex items-center gap-2 text-xl font-bold group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        <Image
                            src="/arjuna-icon.png"
                            alt="Arjuna AI"
                            width={36}
                            height={36}
                            className="h-9 w-9 object-contain drop-shadow-lg relative z-10"
                        />
                    </div>
                    <span className={`bg-clip-text text-transparent transition-all duration-300 ${scrolled
                        ? "bg-gradient-to-r from-white to-slate-400"
                        : "bg-gradient-to-r from-white to-indigo-200"
                        }`}>
                        Arjuna AI
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative text-sm font-medium transition-all duration-300 py-2 group ${isActive ? "text-white" : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {link.label}
                                <span
                                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full transition-all duration-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-50 group-hover:translate-y-0"
                                        }`}
                                />
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:block">
                        <TransitionButton
                            variant={scrolled ? "ghost" : "secondary"}
                            href="/auth"
                            className={`transition-all duration-300 ${scrolled
                                ? "text-white hover:bg-white/10 rounded-full px-6"
                                : "bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.45)]"
                                } font-medium border-0`}
                        >
                            {scrolled ? "Login" : "Get Started"}
                        </TransitionButton>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-5 z-50 lg:hidden">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-between ${isActive
                                    ? "bg-indigo-500/10 text-white border-l-2 border-indigo-500"
                                    : "text-slate-300 hover:text-white hover:bg-white/5"
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                            </Link>
                        );
                    })}
                    <div className="pt-2 border-t border-white/5 mt-2">
                        <Link
                            href="/auth"
                            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
