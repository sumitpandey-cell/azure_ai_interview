"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const resetPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const { updatePassword } = useAuth();
    const router = useRouter();

    const form = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    // Check if user has a valid session (from the reset link)
    useEffect(() => {
        const checkSession = async () => {
            try {
                // First, check if there's already a session
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    setIsValidToken(true);
                    return;
                }

                // If no session, check for hash parameters (Supabase sends token in URL hash)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');




                // If we have a recovery token, exchange it for a session
                if (accessToken && type === 'recovery') {

                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (error) {
                        console.error('❌ Error setting session:', error);
                        setIsValidToken(false);
                        return;
                    }

                    if (data.session) {
                        setIsValidToken(true);
                        return;
                    }
                }

                // No valid token or session found
                setIsValidToken(false);
            } catch (error) {
                console.error('❌ Error checking session:', error);
                setIsValidToken(false);
            }
        };

        checkSession();

        // Also listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidToken(true);
            } else if (event === 'SIGNED_OUT') {
                setIsValidToken(false);
            } else if (session) {
                setIsValidToken(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Calculate password strength
    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 10) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
        return Math.min(strength, 100);
    };

    // Watch password field for strength calculation
    const watchPassword = form.watch("password");
    useEffect(() => {
        if (watchPassword) {
            setPasswordStrength(calculatePasswordStrength(watchPassword));
        } else {
            setPasswordStrength(0);
        }
    }, [watchPassword]);

    const handleResetPassword = async (values: ResetPasswordForm) => {
        try {
            await updatePassword(values.password);
            setIsSuccess(true);

            // Redirect to auth page after 3 seconds
            setTimeout(() => {
                router.push("/auth");
            }, 3000);
        } catch (error) {
            // Error is handled in the context
            console.error("Error updating password:", error);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength < 40) return "bg-red-500/50";
        if (passwordStrength < 70) return "bg-yellow-500/50";
        return "bg-green-500/50";
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength < 40) return "Weak";
        if (passwordStrength < 70) return "Medium";
        return "Strong";
    };

    // Loading state while checking token
    if (isValidToken === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E]">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-primary/20 rounded-full animate-ping absolute" />
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent relative z-10" />
                </div>
            </div>
        );
    }

    // Invalid token state
    if (isValidToken === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full"
                >
                    <div className="bg-[#0A0F1E] border border-white/10 rounded-3xl p-8 text-center">
                        <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Invalid or Expired Link</h2>
                        <p className="text-white/60 mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Button
                            onClick={() => router.push("/auth")}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <div className="bg-[#0A0F1E] border border-white/10 rounded-3xl p-8 text-center">
                        <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successful!</h2>
                        <p className="text-white/60 mb-6">
                            Your password has been updated successfully. Redirecting you to sign in...
                        </p>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-[progress_3s_ease-in-out]" style={{ animation: 'progress 3s ease-in-out forwards' }} />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="bg-[#0A0F1E] border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center text-lg font-medium tracking-tight mb-6 hover:opacity-80 transition-opacity">
                            <Image src="/arjuna-icon.png" alt="Arjuna AI Logo" width={36} height={36} className="mr-3 h-9 w-9 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Arjuna AI</span>
                        </Link>
                        <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
                        <p className="text-white/60 text-sm">Enter your new password below</p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                            {/* Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white text-sm">New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showPassword ? "text" : "password"}
                                                    className="h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500 pr-10"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />

                                        {/* Password Strength Indicator */}
                                        {watchPassword && (
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-white/60">Password Strength</span>
                                                    <span className={`font-semibold ${passwordStrength < 40 ? 'text-red-400' :
                                                        passwordStrength < 70 ? 'text-yellow-400' :
                                                            'text-green-400'
                                                        }`}>
                                                        {getPasswordStrengthText()}
                                                    </span>
                                                </div>
                                                <Progress value={passwordStrength} className={`h-1.5 ${getPasswordStrengthColor()}`} />
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password Field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white text-sm">Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500 pr-10"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg transition-all mt-6"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Updating Password...
                                    </div>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    </Form>

                    {/* Back to Sign In */}
                    <div className="text-center mt-6">
                        <Link href="/auth" className="text-sm text-white/60 hover:text-white transition-colors">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>

            <style jsx>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E]">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-primary/20 rounded-full animate-ping absolute" />
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent relative z-10" />
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
