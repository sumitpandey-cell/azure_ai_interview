"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReactivatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [accountStatus, setAccountStatus] = useState<{
        isActive: boolean;
        deactivatedAt: string | null;
        deactivationReason: string | null;
    } | null>(null);

    useEffect(() => {
        const checkAccountStatus = async () => {
            try {
                setChecking(true);
                const response = await fetch("/api/account/status");
                const data = await response.json();

                if (response.ok && data.success) {
                    setAccountStatus({
                        isActive: data.isActive,
                        deactivatedAt: data.deactivatedAt,
                        deactivationReason: data.deactivationReason,
                    });

                    // If account is already active, redirect to dashboard
                    if (data.isActive) {
                        router.push("/dashboard");
                    }
                } else {
                    toast.error("Failed to check account status");
                    router.push("/auth");
                }
            } catch (error) {
                console.error("Error checking account status:", error);
                toast.error("Something went wrong");
                router.push("/auth");
            } finally {
                setChecking(false);
            }
        };

        checkAccountStatus();
    }, [router]);

    const handleReactivate = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/account/reactivate", {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Welcome back! Your account has been reactivated.", {
                    description: "All your data has been restored.",
                });
                router.push("/dashboard");
            } else {
                toast.error(data.error || "Failed to reactivate account");
            }
        } catch (error) {
            console.error("Error reactivating account:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Checking account status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg border-border shadow-lg">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto p-4 rounded-full bg-primary/10 border border-primary/20 w-fit">
                        <UserCheck className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight">
                        Welcome Back! 👋
                    </CardTitle>
                    <CardDescription className="text-base">
                        Your account was deactivated. Would you like to reactivate it?
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Deactivation info */}
                    {accountStatus?.deactivatedAt && (
                        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">
                                    Deactivated on {format(new Date(accountStatus.deactivatedAt), "MMMM d, yyyy 'at' h:mm a")}
                                </span>
                            </div>
                            {accountStatus.deactivationReason && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Reason: </span>
                                    <span className="font-medium text-foreground">
                                        {accountStatus.deactivationReason.replace(/_/g, " ")}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* What will be restored */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            What Will Be Restored
                        </p>
                        <ul className="space-y-2 text-sm text-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>All your interview history and reports</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Your earned badges and achievements</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Your subscription and remaining credits</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✓</span>
                                <span>Your learning roadmaps and progress</span>
                            </li>
                        </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            className="w-full h-12 rounded-2xl font-bold text-base transition-all active:scale-95"
                            onClick={handleReactivate}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Reactivating...
                                </>
                            ) : (
                                "Reactivate My Account"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full h-12 rounded-2xl font-medium"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const { supabase } = await import("@/integrations/supabase/client");
                                    await supabase.auth.signOut();
                                    router.push("/");
                                } catch (error) {
                                    console.error("Error signing out:", error);
                                    router.push("/auth");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
