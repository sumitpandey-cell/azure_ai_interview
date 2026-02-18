"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TransitionButton } from "@/components/TransitionButton";

interface PublicHeaderProps {
    transparent?: boolean;
}

export function PublicHeader({ }: PublicHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show background on scroll
            setScrolled(currentScrollY > 20);

            // Visibility logic: 
            // - Show when scrolling down
            // - Hide when scrolling up
            // - Always show at the top
            if (currentScrollY < 10) {
                setVisible(true);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling Down -> Hide
                setVisible(false);
            } else {
                // Scrolling Up -> Show
                setVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const navLinks = [
        { href: "/about", label: "About" },
        { href: "/pricing", label: "Pricing" },
        { href: "/recruiter/auth", label: "Hire with AI" },
        { href: "/blog", label: "Blog" },
        { href: "/contact", label: "Contact" },
        { href: "/faq", label: "FAQ" },
    ];

    return (
        <motion.header
            initial={false}
            animate={{
                y: visible ? 0 : -100,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center"
        >
            <div className={`transition-all duration-300 ease-out flex items-center justify-between px-6 lg:px-12 py-3 border-b w-full
                ${scrolled
                    ? "bg-background/80 backdrop-blur-md border-border shadow-sm"
                    : "bg-transparent border-transparent"
                }`}>

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative flex items-center justify-center w-9 h-9 bg-secondary/50 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/arjuna_logo.png"
                            alt="Arjuna AI"
                            width={28}
                            height={28}
                            className="w-7 h-7 object-contain"
                        />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                        ArjunaAI
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${isActive
                                    ? "text-primary bg-primary/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <TransitionButton
                        href="/auth"
                        className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2 rounded-xl shadow-md shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Sign In
                    </TransitionButton>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-foreground hover:bg-secondary rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 p-6 bg-background border-b border-border shadow-2xl flex flex-col gap-2 md:hidden"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-base font-medium text-muted-foreground py-3 px-4 hover:bg-secondary rounded-xl transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="h-px bg-border my-4"></div>
                        <Link
                            href="/auth"
                            className="flex items-center justify-center w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Get Started Free
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
