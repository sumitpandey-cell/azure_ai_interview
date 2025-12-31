import { Button } from "@/components/ui/button";
import { FileText, Scale, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GlobalBackground } from "@/components/GlobalBackground";

export default function TermsPage() {
    const lastUpdated = "December 31, 2025";

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden">
            <GlobalBackground />

            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <img src="/arjuna-icon.png" alt="Arjuna AI" className="h-8 w-8 object-contain" />
                        <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Arjuna AI</span>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                            <Scale className="h-4 w-4" />
                            Terms of Service
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms and Conditions</h1>
                        <p className="text-slate-400">Please read these terms carefully before using Arjuna AI. Last updated on {lastUpdated}</p>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-8 text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using Arjuna AI, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
                            <p>
                                Permission is granted to temporarily use the materials (information or software) on Arjuna AI's website for personal, non-commercial transitory viewing only.
                            </p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>You may not modify or copy the materials.</li>
                                <li>You may not use the materials for any commercial purpose or for any public display.</li>
                                <li>You may not attempt to decompile or reverse engineer any software contained on Arjuna AI's website.</li>
                                <li>You may not remove any copyright or other proprietary notations from the materials.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. AI-Generated Content</h2>
                            <p>
                                Arjuna AI uses artificial intelligence to provide interview practice and feedback. While we strive for accuracy, the AI-generated content (including scores, feedback, and suggested answers) is provided for educational purposes only and does not guarantee job placement or success in real interviews.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Subscriptions and Payments</h2>
                            <p>
                                Certain features of the Service require payment. All fees are non-refundable unless otherwise required by law. We reserve the right to change our subscription plans or adjust pricing for our service in any manner and at any time as we may determine in our sole and absolute discretion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
                            <p>
                                In no event shall Arjuna AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Arjuna AI's website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Governing Law</h2>
                            <p>
                                These terms and conditions are governed by and construed in accordance with the laws of Delaware, USA and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                            </p>
                        </section>
                    </div>

                    <div className="mt-16 p-8 rounded-3xl bg-white/5 border border-white/10 flex items-start gap-4">
                        <AlertCircle className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-white font-bold mb-2">Have questions about our terms?</h4>
                            <p className="text-slate-400 text-sm mb-4">
                                If you have any questions about these Terms, please contact us at legal@arjuna.ai.
                            </p>
                            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white" asChild>
                                <Link href="/contact">Contact Us</Link>
                            </Button>
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
