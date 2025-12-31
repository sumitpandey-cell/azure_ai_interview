import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, MapPin, Phone, Github, Twitter, Linkedin, Instagram, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden">
            <GlobalBackground />

            {/* Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8 object-contain" />
                        <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                            Arjuna AI
                        </span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/auth" className="text-sm font-medium hover:text-indigo-400 transition-colors">Login</Link>
                        <Button size="sm" className="bg-white text-black hover:bg-slate-200 rounded-full" asChild>
                            <Link href="/auth">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Get in <span className="text-indigo-500">Touch</span></h1>
                        <p className="text-xl text-slate-400">Have questions? We're here to help you ace your next interview.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <h3 className="text-2xl font-bold text-white mb-8">Contact Information</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                            <Mail className="h-6 w-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">Email us at</div>
                                            <div className="text-white font-medium">support@arjuna.ai</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                            <MessageSquare className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">Live Chat</div>
                                            <div className="text-white font-medium">Available 24/7 for Pro members</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                                            <MapPin className="h-6 w-6 text-pink-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">Our Location</div>
                                            <div className="text-white font-medium">Remote-first team, based in SF/Bangalore</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <h4 className="text-white font-semibold mb-6">Follow Us</h4>
                                    <div className="flex gap-4">
                                        {[Twitter, Github, Linkedin, Instagram].map((Icon, i) => (
                                            <a key={i} href="#" className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white transition-all duration-300">
                                                <Icon className="h-6 w-6" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Subject</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                                        <option className="bg-[#0A0A0B]">General Inquiry</option>
                                        <option className="bg-[#0A0A0B]">Technical Support</option>
                                        <option className="bg-[#0A0A0B]">Billing Question</option>
                                        <option className="bg-[#0A0A0B]">Partnership</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="How can we help you?"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    ></textarea>
                                </div>
                                <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg">
                                    Send Message
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-[#0A0A0B] border-t border-white/10 pt-20 pb-10">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">© 2025 Arjuna AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
