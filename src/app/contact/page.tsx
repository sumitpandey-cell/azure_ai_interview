"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Twitter, Github, Linkedin, Instagram, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        topic: "General Inquiry",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await (supabase
                .from("contact_submissions" as any) as any)
                .insert([
                    {
                        full_name: formData.fullName,
                        email: formData.email,
                        topic: formData.topic,
                        message: formData.message
                    }
                ]);

            if (error) throw error;

            toast({
                title: "Message sent!",
                description: "We'll get back to you as soon as possible.",
            });

            setFormData({
                fullName: "",
                email: "",
                topic: "General Inquiry",
                message: ""
            });
        } catch (error: any) {
            console.error("Error submitting contact form:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send message. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

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



                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto items-start">
                        {/* Contact Form */}
                        <div className="order-1 lg:order-1 p-8 md:p-10 rounded-[2.5rem] bg-[#0F0F12] border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Send us a message</h3>
                            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            placeholder="John Doe"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@company.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic</label>
                                    <select
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all appearance-none cursor-pointer"
                                    >
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
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Tell us how we can help..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all resize-none"
                                    ></textarea>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Message"
                                    )}
                                </Button>
                            </form>
                        </div>

                        <div className="order-2 lg:order-2 space-y-8 py-8">
                            <div className="grid gap-6">
                                {[
                                    {
                                        title: "Email Us",
                                        desc: "Our friendly team is here to help and answer any questions.",
                                        icon: Mail,
                                        value: "contact@arjunaai.in",
                                        href: "mailto:contact@arjunaai.in"
                                    },
                                    {
                                        title: "Call Us",
                                        desc: "Available for direct support and business inquiries.",
                                        icon: Phone,
                                        value: "+91 8920609324",
                                        href: "tel:+918920609324"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <item.icon className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-4 leading-relaxed">{item.desc}</p>
                                        <a href={item.href} className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                                            {item.value} <ArrowRight className="ml-2 h-4 w-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-6">Connect with us</h3>
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
                                            className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 ${social.color} hover:border-transparent hover:-translate-y-1`}
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

