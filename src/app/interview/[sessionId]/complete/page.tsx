"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MessageCircle, ArrowRight, Home, LayoutDashboard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function InterviewComplete() {
    const router = useRouter();
    const { sessionId } = useParams();
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'student';
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (type === 'student') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        router.push(`/interview/${sessionId}/report`);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, [router, sessionId, type]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 font-sans overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-50/50 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-xl"
            >
                <Card className="p-8 sm:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-0 bg-white/80 backdrop-blur-xl rounded-[40px] overflow-hidden">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner"
                    >
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        {type === 'campaign' ? "Interview Submitted" : "Session Finalized"}
                    </h1>

                    <div className="space-y-4 text-slate-500 mb-10 px-4">
                        {type === 'campaign' ? (
                            <>
                                <p className="text-lg font-medium leading-relaxed">
                                    Thank you for completing the interview! Your responses have been securely transmitted to the hiring team.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 text-left border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 leading-tight">
                                        The recruiter will review your profile and contact you via email regarding the next steps.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-medium leading-relaxed">
                                    Great job! Your performance is being analyzed by our AI to provide you with detailed feedback.
                                </p>
                                <div className="space-y-2 mt-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Generating Analysis</span>
                                        <span className="text-xs font-black text-slate-400">{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-indigo-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ ease: "linear" }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-2">
                        {type === 'campaign' ? (
                            <Button
                                onClick={() => router.push('/')}
                                className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold gap-2 shadow-lg shadow-slate-200 transition-all hover:scale-[1.02]"
                            >
                                <Home className="h-4 w-4" />
                                Return Home
                            </Button>
                        ) : (
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="outline"
                                className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-white border-slate-200 text-slate-600 font-bold gap-2 hover:bg-slate-50 transition-all"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        )}

                        {type === 'student' && progress < 100 && (
                            <Button
                                disabled
                                className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border-none font-bold gap-2 opacity-50"
                            >
                                View Detailed Report
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </Card>

                <p className="text-center mt-8 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                    Powered by Arjuna AI
                </p>
            </motion.div>
        </div>
    );
}
