"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { campaignService } from "@/services/recruiter/campaign.service";
import { interviewService } from "@/services/interview.service";
import {
    Clock,
    BarChart2,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";
import { toast } from "sonner";
import Image from "next/image";

export default function PublicInvitePage() {
    const { token } = useParams();
    const router = useRouter();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: ""
    });

    useEffect(() => {
        if (token) {
            fetchCampaign();
        }
    }, [token]);

    const fetchCampaign = async () => {
        const data = await campaignService.getCampaignByToken(token as string);
        if (!data) {
            toast.error("Invalid or expired invite link.");
            router.push("/");
            return;
        }

        const campaignData = data as any;

        // 1. Check if campaign is active
        if (!campaignData.is_active) {
            toast.error("This invite link is no longer active.");
            router.push("/");
            return;
        }

        // 3. Check Expiry
        if (campaignData.expiry_date) {
            const expiry = new Date(campaignData.expiry_date);
            if (new Date() > expiry) {
                toast.error("This invite link has expired.");
                router.push("/");
                return;
            }
        }

        setCampaign(campaignData);
        setLoading(false);
    };

    const handleStartInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email) {
            toast.error("Please provide your name and email.");
            return;
        }

        setIsStarting(true);
        try {
            // 3. Check if candidate already used the link (One use per candidate)
            const hasUsed = (campaign.interview_sessions as any[])?.some(
                (s: any) => s.candidate_email?.toLowerCase() === formData.email.toLowerCase()
            );

            if (hasUsed) {
                toast.error("You have already used this invite link.");
                setIsStarting(false);
                return;
            }

            // 1. Create Guest Session
            const sessionData = {
                user_id: null,
                campaign_id: campaign.id,
                position: campaign.position,
                interview_type: "Technical", // Default or from config
                candidate_metadata: {
                    full_name: formData.fullName,
                    email: formData.email
                },
                candidate_name: formData.fullName,
                candidate_email: formData.email,
                status: 'in_progress',
                config: {
                    ...(campaign.config as Record<string, any>),
                    difficulty: campaign.difficulty,
                    jobDescription: campaign.description
                }
            };

            // Create session via service
            const session = await interviewService.createGuestSession(sessionData);

            if (session) {
                // 2. Store session identity in sessionStorage for setup/live page guards
                sessionStorage.setItem('arjuna_guest_session', JSON.stringify({
                    sessionId: session.id,
                    userType: 'guest',
                    campaignId: campaign.id
                }));

                toast.success("Interview session initialized!");

                // Redirect to setup
                router.push(`/interview/${session.id}/setup?guest=true`);
            }
        } catch (error) {
            console.error("Error starting guest interview:", error);
            toast.error("Failed to start interview. Please try again.");
        } finally {
            setIsStarting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <PremiumLogoLoader text="Loading invitation details..." />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
            {/* Navbar */}
            <nav className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Image src="/arjuna_logo.png" alt="Arjuna Logo" width={32} height={32} />
                    <span className="font-bold text-slate-800 text-lg">Arjuna AI</span>
                </div>
            </nav>

            <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-6 sm:p-12 gap-12">
                {/* Left: Job Info */}
                <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="space-y-4">
                        <Badge className="bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/10 border-indigo-200 font-bold px-4 py-1.5 rounded-full text-xs">
                            Direct Opportunity
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                            You&apos;ve been invited to interview for <span className="text-indigo-600">{campaign.position}</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
                            Complete your first-round interview with our AI agent to showcase your skills directly to the hiring team.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold">Duration</h4>
                                <p className="text-sm text-slate-500">~{campaign.max_duration || 60} minutes</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <BarChart2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold">Level</h4>
                                <p className="text-sm text-slate-500">{campaign.difficulty || 'Intermediate'}</p>
                            </div>
                        </div>
                    </div>

                    {(campaign.config as any)?.skills?.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold">Targeted Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {(campaign.config as any).skills.map((skill: string, i: number) => (
                                    <div key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 uppercase tracking-tight">
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Job Context</h3>
                        <div className="p-6 rounded-3xl bg-white border border-slate-200/60 shadow-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                            {campaign.description}
                        </div>
                    </div>
                </div>

                {/* Right: Registration Card */}
                <div className="w-full lg:w-[420px] animate-in fade-in slide-in-from-right-4 duration-700">
                    <Card className="border-0 shadow-2xl shadow-indigo-200/50 rounded-3xl overflow-hidden sticky top-32">
                        <div className="bg-indigo-600 p-8 text-white">
                            <h3 className="text-2xl font-bold">Get Started</h3>
                            <p className="text-indigo-100 mt-2 text-sm">Enter your details and begin whenever you&apos;re ready.</p>
                        </div>
                        <CardContent className="p-8 bg-white">
                            <form onSubmit={handleStartInterview} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-bold text-slate-700">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-600/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-600/20"
                                    />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-500 font-medium">Results will be sent to the hiring manager immediately.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-500 font-medium">No account required. Your progress is saved automatically.</p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isStarting}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl gap-3 text-lg transition-all active:scale-[0.98] shadow-xl shadow-indigo-100"
                                >
                                    {isStarting ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <>
                                            Start Interview
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <footer className="p-12 text-center text-slate-400 text-sm">
                Powered by Arjuna AI • Intelligent Interviewing for Modern Teams
            </footer>
        </div>
    );
}
