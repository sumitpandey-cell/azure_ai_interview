"use client";

import { useState, useEffect } from "react";
import { Check, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription"; // Assuming this handles unauth state gracefully
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { subscriptionService, type Plan } from "@/services/subscription.service";
import { GlobalBackground } from "@/components/GlobalBackground";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { PaymentStatusModal, type PaymentStatus } from "@/components/PaymentStatusModal";
import { useAuth } from "@/contexts/AuthContext";

const PLAN_DETAILS: Record<string, any> = {
    "Free": {
        description: "Perfect for getting started",
        features: [
            "100 minutes monthly interview time",
            "Basic AI Interviewer",
            "Standard feedback report",
            "Community support",
            "Resets every month"
        ],
        popular: false
    },
    "Basic": {
        description: "For serious job seekers",
        features: [
            "300 minutes monthly interview time",
            "Advanced AI Interviewer",
            "Detailed performance analytics",
            "Priority email support",
            "No daily limits",
            "Access to all templates"
        ],
        popular: false
    },
    "Pro": {
        description: "Best for power users",
        features: [
            "1,000 minutes monthly interview time",
            "Premium AI Voices",
            "In-depth behavioral analysis",
            "Resume review assistance",
            "Priority 24/7 support",
            "Custom interview scenarios"
        ],
        popular: true
    },
    "Business": {
        description: "Unlimited access",
        features: [
            "Unlimited interview minutes",
            "All Pro features",
            "Custom interview scenarios",
            "Team management dashboard",
            "Dedicated account manager",
            "API access"
        ],
        popular: false
    }
};

export default function Pricing() {
    // We try to get subscription info, but it might be null if not logged in. 
    // We should handle that.
    const subscription = useSubscription();
    // Safely access properties
    const subscriptionType = subscription?.type;
    const currentPlanName = subscription?.plan_name;
    const { user } = useAuth();
    const [fetchedPlans, setFetchedPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        status: PaymentStatus;
        details?: string;
    }>({ isOpen: false, status: "success" });
    const searchParams = useSearchParams();

    // Handle payment feedback
    useEffect(() => {
        const status = searchParams.get('payment') as PaymentStatus | null;
        if (!status) return;

        // Skip success/pending on pricing page as they redirect to dashboard
        if (status === 'success' || status === 'pending') return;

        setPaymentModal({
            isOpen: true,
            status,
            details: searchParams.get('reason') || undefined
        });

        // Clear the query params
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }, [searchParams]);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const data = await subscriptionService.getPlans();
                setFetchedPlans(data);
            } catch (error) {
                console.error("Error loading plans:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPlans();
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        if (plan.name === "Free") return;

        if (!user) {
            toast.error("Please sign in to upgrade your plan");
            return;
        }

        setSubscribingPlanId(plan.id);
        try {
            const response = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planId: plan.id,
                    amount: plan.price_monthly,
                    customerName: user.user_metadata?.full_name || user.email?.split('@')[0],
                    customerEmail: user.email,
                    customerPhone: user.user_metadata?.phone || "9999999999",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create order");
            }

            const { payment_session_id } = data;

            // Import load here to avoid SSR issues if any, or at the top
            const { load } = await import("@cashfreepayments/cashfree-js");
            const cashfree = await load({
                mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") || "sandbox",
            });

            if (cashfree) {
                await cashfree.checkout({
                    paymentSessionId: payment_session_id,
                    redirectTarget: "_self",
                });
            }
        } catch (error: any) {
            console.error("Payment Error:", error);
            toast.error(error.message || "Payment initialization failed");
        } finally {
            setSubscribingPlanId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30">
            <GlobalBackground />
            <PublicHeader />

            <main className="pt-32 pb-20 relative z-10">
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 container mx-auto px-4">
                    {/* Header Section */}
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                            <Trophy className="h-3.5 w-3.5" />
                            Strategic Advancement
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
                            Choose Your <span className="text-indigo-400 italic">Trajectory</span>
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
                            Scale your career potential with advanced AI simulation protocols. Select the optimization level that fits your goals.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Initializing Protocols...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {fetchedPlans.map((plan, i) => {
                                const details = PLAN_DETAILS[plan.name] || {
                                    description: "Custom optimization protocol",
                                    features: ["Standard AI Access", "Performance Reports"],
                                    popular: false
                                };

                                const isCurrentPlan = currentPlanName === plan.name || (plan.name === "Free" && subscriptionType === "free");
                                const minutes = Math.floor(plan.monthly_seconds / 60);

                                return (
                                    <Card
                                        key={plan.id}
                                        className={cn(
                                            "flex flex-col relative transition-all duration-500 overflow-hidden border-2 bg-white/[0.02] backdrop-blur-xl group hover:-translate-y-2",
                                            details.popular
                                                ? 'border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.15)] lg:scale-105 z-10'
                                                : 'border-white/5 hover:border-indigo-500/30'
                                        )}
                                    >
                                        {details.popular && (
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                                                    Peak Value
                                                </div>
                                            </div>
                                        )}

                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl font-black tracking-tight uppercase text-white">{plan.name}</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">{details.description}</CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex-1 p-8 pt-0 space-y-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-black tracking-tighter text-white">₹{plan.price_monthly}</span>
                                                    {plan.price_monthly > 0 && <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">/month</span>}
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 w-fit mt-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        {plan.monthly_seconds >= 3600000 ? "Unlimited" : `${minutes.toLocaleString()} mins/month`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Module Access</p>
                                                <ul className="space-y-4">
                                                    {details.features.map((feature: string) => (
                                                        <li key={feature} className="flex items-start gap-3 group/item">
                                                            <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover/item:bg-indigo-500 transition-colors">
                                                                <Check className="h-3 w-3 text-indigo-400 group-hover/item:text-white" />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-400 group-hover/item:text-slate-200 transition-colors leading-snug">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="p-8 pt-0">
                                            <Button
                                                className={cn(
                                                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all relative overflow-hidden group/btn",
                                                    isCurrentPlan
                                                        ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/5 cursor-default'
                                                        : details.popular
                                                            ? 'bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02]'
                                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:scale-[1.02]'
                                                )}
                                                variant={isCurrentPlan ? "ghost" : "default"}
                                                onClick={() => handleSubscribe(plan)}
                                                disabled={isCurrentPlan || !!subscribingPlanId}
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    {subscribingPlanId === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {isCurrentPlan ? "Active Protocol" : `Upgrade to ${plan.name}`}
                                                </span>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Secure Payment Note */}
                    <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] pt-8">
                        Secure Encryption Enabled • Verified Merchant
                    </p>
                </div>
            </main>

            <Footer />

            <PaymentStatusModal
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                status={paymentModal.status}
                details={paymentModal.details}
            />
        </div>
    );
}
