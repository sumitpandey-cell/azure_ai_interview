import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

                    {/* Brand & Newsletter - Takes up 5 cols */}
                    <div className="lg:col-span-5 flex flex-col justify-between">
                        <div>
                            <Link href="/" className="flex items-center gap-3 text-2xl font-bold mb-6 group w-fit">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <Image src="/arjuna_logo.png" alt="Arjuna AI" width={40} height={40} className="h-10 w-10 object-contain relative z-10" />
                                </div>
                                <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:to-white transition-all">
                                    Arjuna AI
                                </span>
                            </Link>
                            <p className="text-slate-400 mb-8 leading-relaxed max-w-sm text-lg">
                                Mastering the art of the interview through intelligent simulation and feedback.
                            </p>

                            <div className="flex gap-4 mb-8 lg:mb-0">
                                {[Twitter, Github, Linkedin, Instagram].map((Icon, i) => (
                                    <a key={i} href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all duration-300 hover:-translate-y-1">
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Columns - Takes up 7 cols */}
                    <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-0">
                        {/* Column 1 */}
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-semibold mb-2">Product</h4>

                            <Link href="/#features" className="text-slate-400 hover:text-white transition-colors w-fit">Features</Link>
                            <Link href="/faq" className="text-slate-400 hover:text-white transition-colors w-fit">FAQ</Link>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-semibold mb-2">Company</h4>
                            <Link href="/about" className="text-slate-400 hover:text-white transition-colors w-fit">About</Link>
                            <Link href="/blog" className="text-slate-400 hover:text-white transition-colors w-fit">Blog</Link>
                            <Link href="/contact" className="text-slate-400 hover:text-white transition-colors w-fit">Contact</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-600 text-sm font-medium">
                        © 2025 Arjuna AI Inc.
                    </p>
                    <div className="flex gap-8 text-sm text-slate-500 font-medium">
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
