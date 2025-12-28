"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";

const plans = [
    {
        name: "Free",
        price: "₹0",
        description: "Perfect for getting started",
        features: [
            "100 minutes monthly interview time",
            "Basic AI Interviewer",
            "Standard feedback report",
            "Community support",
            "Resets every day at midnight"
        ],
        limit: "100 mins/month",
        buttonText: "Current Plan",
        popular: false
    },
    {
        name: "Basic",
        price: "₹299",
        period: "/month",
        description: "For serious job seekers",
        features: [
            "300 minutes monthly interview time",
            "Advanced AI Interviewer",
            "Detailed performance analytics",
            "Priority email support",
            "No daily limits",
            "Access to all templates"
        ],
        limit: "300 mins/month",
        buttonText: "Upgrade to Basic",
        popular: false
    },
    {
        name: "Pro",
        price: "₹699",
        period: "/month",
        description: "Best for power users",
        features: [
            "1,000 minutes monthly interview time",
            "Premium AI Voices",
            "In-depth behavioral analysis",
            "Resume review assistance",
            "Priority 24/7 support",
            "Custom interview scenarios"
        ],
        limit: "1,000 mins/month",
        buttonText: "Upgrade to Pro",
        popular: true
    },
    {
        name: "Business",
        price: "₹1,499",
        period: "/month",
        description: "Unlimited access",
        features: [
            "Unlimited interview minutes",
            "All Pro features",
            "Custom interview scenarios",
            "Team management dashboard",
            "Dedicated account manager",
            "API access"
        ],
        limit: "Unlimited",
        buttonText: "Contact Sales",
        popular: false
    }
];

export default function Pricing() {
    const { type: subscriptionType } = useSubscription();

    const handleSubscribe = (planName: string) => {
        if (planName === "Free") return;
        toast.info(`The ${planName} plan is coming soon! Payments are currently on hold.`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Choose the plan that best fits your interview preparation needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`flex flex-col relative ${plan.popular
                                ? 'border-primary shadow-xl lg:scale-105 z-10 bg-card'
                                : 'border-border shadow-sm hover:shadow-md transition-shadow bg-card'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                                </div>
                                <div className="mb-6 p-3 bg-muted rounded-lg text-center">
                                    <span className="font-semibold text-foreground">{plan.limit}</span>
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className={`w-full ${plan.name === "Free" && subscriptionType === 'free'
                                        ? 'bg-muted text-muted-foreground hover:bg-muted cursor-default'
                                        : plan.popular
                                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                            : ''
                                        }`}
                                    variant={plan.name === "Free" && subscriptionType === 'free' ? "ghost" : "default"}
                                    onClick={() => handleSubscribe(plan.name)}
                                    disabled={plan.name === "Free" && subscriptionType === 'free'}
                                >
                                    {plan.name === "Free" && subscriptionType === 'free' ? "Current Plan" : plan.buttonText}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
