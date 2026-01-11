import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, MapPin, Twitter, Github, Linkedin, Instagram, ArrowRight, Video, FileText } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Footer } from "@/components/Footer";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />

            {/* Navigation */}
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
                    <div className="flex items-center gap-6">
                        <Link href="/auth" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Login</Link>
                        <Button size="sm" className="bg-white text-black hover:bg-slate-200 rounded-full font-medium px-6" asChild>
                            <Link href="/auth">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 relative z-10">
                <div className="container mx-auto px-4">
                    {/* Hero */}
                    <div className="max-w-4xl mx-auto text-center mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
                            Let's start a <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">conversation</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Whether you're a candidate looking to ace your interview or an enterprise building a hiring pipeline, we're here to help.
                        </p>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
                        {[
                            { title: "Support", desc: "Get help with your account or technical issues.", icon: MessageSquare, email: "support@arjuna.ai" },
                            { title: "Sales", desc: "Discuss enterprise plans and custom solutions.", icon: FileText, email: "sales@arjuna.ai" },
                            { title: "Demo", desc: "Request a personalized walkthrough of the platform.", icon: Video, email: "demo@arjuna.ai" }
                        ].map((item, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <item.icon className="h-6 w-6 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm mb-6 min-h-[40px]">{item.desc}</p>
                                <a href={`mailto:${item.email}`} className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                                    {item.email} <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto items-start">
                        {/* Contact Form */}
                        <div className="order-2 lg:order-1 p-8 md:p-10 rounded-[2.5rem] bg-[#0F0F12] border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Send us a message</h3>
                            <form className="space-y-6 relative z-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="john@company.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all appearance-none cursor-pointer">
                                        <option className="bg-[#1a1a1e]">General Inquiry</option>
                                        <option className="bg-[#1a1a1e]">Enterprise Solutions</option>
                                        <option className="bg-[#1a1a1e]">Technical Support</option>
                                        <option className="bg-[#1a1a1e]">Billing</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="ell us how we can help..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all resize-none"
                                    ></textarea>
                                </div>
                                <Button className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                                    Send Message
                                </Button>
                            </form>
                        </div>

                        {/* Additional Info */}
                        <div className="order-1 lg:order-2 space-y-12 py-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">Our Offices</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4 items-start group">
                                        <div className="mt-1 w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                                            <MapPin className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">San Francisco HQ</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                100 Pine Street, Suite 1250<br />
                                                San Francisco, CA 94111<br />
                                                United States
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start group">
                                        <div className="mt-1 w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 group-hover:bg-pink-500/20 transition-colors">
                                            <Globe className="h-5 w-5 text-pink-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Bangalore Hub</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                WeWork Prestige Atlanta<br />
                                                Koramangala, Bangalore<br />
                                                India
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">Connect with us</h3>
                                <div className="flex gap-3">
                                    {[
                                        { icon: Twitter, href: "#", color: "hover:bg-blue-500" },
                                        { icon: Github, href: "#", color: "hover:bg-slate-700" },
                                        { icon: Linkedin, href: "#", color: "hover:bg-blue-600" },
                                        { icon: Instagram, href: "#", color: "hover:bg-pink-600" }
                                    ].map((social, i) => (
                                        <a
                                            key={i}
                                            href={social.href}
                                            className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 ${social.color} hover:border-transparent hover:-translate-y-1`}
                                        >
                                            <social.icon className="h-5 w-5" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Needed for the GlobeIcon used above - Lucide exports it as Globe
function Globe({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
