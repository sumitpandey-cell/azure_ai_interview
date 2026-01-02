"use client";

import { useState, useEffect } from "react";
import { Check, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import { subscriptionService, type Plan } from "@/services/subscription.service";

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
    const { type: subscriptionType, plan_name: currentPlanName } = useSubscription();
    const [fetchedPlans, setFetchedPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleSubscribe = (plan: Plan) => {
        if (plan.name === "Free") return;
        toast.info(`The ${plan.name} plan is coming soon! Payments are currently on hold.`);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">Initializing Protocols...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-10 sm:pt-0">
                {/* Header Section */}
                <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                        <Trophy className="h-3.5 w-3.5" />
                        Strategic Advancement
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                        Choose Your <span className="text-primary italic">Trajectory</span>
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                        Scale your career potential with advanced AI simulation protocols. Select the optimization level that fits your goals.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
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
                                    "flex flex-col relative transition-all duration-500 overflow-hidden border-2 bg-card/40 backdrop-blur-xl group hover:-translate-y-2",
                                    details.popular
                                        ? 'border-primary shadow-[0_0_40px_rgba(var(--primary),0.1)] lg:scale-105 z-10'
                                        : 'border-border/50 shadow-2xl'
                                )}
                            >
                                {details.popular && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-primary text-black px-6 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                                            Peak Value
                                        </div>
                                    </div>
                                )}

                                {/* Background Glow */}
                                <div className={cn("absolute -top-24 -right-24 h-48 w-48 blur-[80px] rounded-full opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity",
                                    details.popular ? "bg-primary" : "bg-muted"
                                )} />

                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-2xl font-black tracking-tight uppercase text-foreground">{plan.name}</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{details.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 p-8 pt-0 space-y-8">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-black tracking-tighter text-foreground">₹{plan.price_monthly}</span>
                                            {plan.price_monthly > 0 && <span className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">/month</span>}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-background/50 border border-border/20 w-fit mt-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">
                                                {plan.monthly_seconds >= 3600000 ? "Unlimited" : `${minutes.toLocaleString()} mins/month`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">Module Access</p>
                                        <ul className="space-y-4">
                                            {details.features.map((feature: string) => (
                                                <li key={feature} className="flex items-start gap-3 group/item">
                                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover/item:bg-primary transition-colors">
                                                        <Check className="h-3 w-3 text-primary group-hover/item:text-black" />
                                                    </div>
                                                    <span className="text-xs font-bold text-muted-foreground group-hover/item:text-foreground transition-colors leading-snug">{feature}</span>
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
                                                ? 'bg-muted/50 text-muted-foreground/40 border-border/20 hover:bg-muted/50 cursor-default'
                                                : details.popular
                                                    ? 'bg-primary text-black hover:bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105'
                                                    : 'bg-muted/50 hover:bg-muted/80 text-foreground border border-border/50 hover:scale-105'
                                        )}
                                        variant={isCurrentPlan ? "ghost" : "default"}
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={isCurrentPlan}
                                    >
                                        <span className="relative z-10">
                                            {isCurrentPlan ? "Active Protocol" : `Upgrade to ${plan.name}`}
                                        </span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Secure Payment Note */}
                <p className="text-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] pt-8">
                    Secure Encryption Enabled • Verified Merchant
                </p>
            </div>
        </DashboardLayout>
    );
}
