"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Building2, Sparkles, ArrowRight, CheckCircle2, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from 'browser-image-compression';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";

const signUpSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    orgName: z.string().min(2, "Organization name is required").max(100),
});

const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type SignUpForm = z.infer<typeof signUpSchema>;
type SignInForm = z.infer<typeof signInSchema>;

function RecruiterAuthContent() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const { signUp, signIn, signInWithGoogle, user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/recruiter/dashboard';
    const pendingRedirect = useRef(false);

    const signUpForm = useForm<SignUpForm>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            orgName: "",
        },
    });

    const signInForm = useForm<SignInForm>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (user && (pendingRedirect.current || !isSignUp)) {
            pendingRedirect.current = false;
            router.push(redirectTo);
        }
    }, [user, router, redirectTo, isSignUp]);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 500,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            setAvatarFile(compressedFile);
            setAvatarPreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            console.error("Error compressing image:", error);
        }
    };

    const handleSignUp = async (values: SignUpForm) => {
        try {
            await signUp(values.email, values.password, values.fullName, 'recruiter', values.orgName);

            const { data: { session } } = await supabase.auth.getSession();

            if (session && avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar.${fileExt}`;
                const filePath = `${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    await supabase.auth.updateUser({
                        data: { avatar_url: publicUrl }
                    });

                    await supabase
                        .from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('id', session.user.id);
                }
            }

            signUpForm.reset();
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (error) {
            console.error("Error signing up:", error);
        }
    };

    const handleSignIn = async (values: SignInForm) => {
        try {
            pendingRedirect.current = true;
            await signIn(values.email, values.password);
        } catch (error) {
            pendingRedirect.current = false;
            console.error("Error signing in:", error);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Google sign-in error:", error);
        }
    };

    if (loading && !user) {
        return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center"><PremiumLogoLoader text="Initializing Recruiter Portal..." /></div>;
    }

    const features = [
        { icon: Sparkles, title: "AI-Powered Screening", desc: "Intelligent candidate evaluation" },
        { icon: CheckCircle2, title: "Unbiased Assessment", desc: "Fair and objective scoring" },
        { icon: Building2, title: "Custom Branding", desc: "Your logo, your style" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Branding */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="hidden lg:block space-y-8"
                    >
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/50 blur-xl rounded-full group-hover:bg-indigo-400/60 transition-all" />
                                <Image
                                    src="/arjuna_logo.png"
                                    alt="Arjuna AI"
                                    width={56}
                                    height={56}
                                    className="relative object-contain drop-shadow-2xl"
                                />
                            </div>
                            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                                ARJUNA RECRUIT
                            </span>
                        </Link>

                        <div className="space-y-6">
                            <h1 className="text-5xl lg:text-6xl font-black leading-tight">
                                <span className="text-white">Hire Smarter,</span>
                                <br />
                                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Not Harder
                                </span>
                            </h1>
                            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
                                Transform your recruitment process with AI-powered interviews that scale infinitely while maintaining human-like conversations.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group"
                                >
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                                        <p className="text-sm text-slate-400">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-white/10">
                            <p className="text-sm text-slate-500 italic">
                                &quot;Reduced our time-to-hire by 60% while improving candidate quality.&quot;
                            </p>
                            <p className="text-sm text-slate-400 mt-2 font-semibold">— Sarah Chen, VP of Engineering</p>
                        </div>
                    </motion.div>

                    {/* Right Side - Auth Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full"
                    >
                        <div className="relative">
                            {/* Glow effect behind card */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20" />

                            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
                                {/* Mobile Logo */}
                                <div className="lg:hidden mb-8 text-center">
                                    <Link href="/" className="inline-flex items-center gap-2">
                                        <Image src="/arjuna_logo.png" alt="Arjuna AI" width={40} height={40} />
                                        <span className="text-xl font-black bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
                                            ARJUNA RECRUIT
                                        </span>
                                    </Link>
                                </div>

                                {/* Tab Switcher */}
                                <div className="flex gap-2 p-1.5 bg-slate-950/50 rounded-2xl mb-8">
                                    <button
                                        onClick={() => setIsSignUp(false)}
                                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${!isSignUp
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => setIsSignUp(true)}
                                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${isSignUp
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {isSignUp ? (
                                        <motion.div
                                            key="signup"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5">
                                                {/* Avatar Upload */}
                                                <div className="flex justify-center mb-6">
                                                    <label htmlFor="avatar-upload" className="cursor-pointer group">
                                                        <div className="relative">
                                                            <Avatar className="h-24 w-24 border-4 border-indigo-500/30 group-hover:border-indigo-500 transition-all">
                                                                <AvatarImage src={avatarPreview || ""} />
                                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
                                                                    <Upload className="h-8 w-8" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-500 rounded-full shadow-lg">
                                                                <Upload className="h-4 w-4 text-white" />
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-400 text-center mt-2">Upload Photo</p>
                                                    </label>
                                                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                                </div>

                                                {/* Organization Name */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-indigo-400" />
                                                        Organization Name
                                                    </label>
                                                    <Input
                                                        {...signUpForm.register("orgName")}
                                                        placeholder="Acme Corporation"
                                                        className="h-12 bg-slate-950/50 border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                                    />
                                                    {signUpForm.formState.errors.orgName && (
                                                        <p className="text-xs text-red-400">{signUpForm.formState.errors.orgName.message}</p>
                                                    )}
                                                </div>

                                                {/* Full Name */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                        <User className="w-4 h-4 text-indigo-400" />
                                                        Your Full Name
                                                    </label>
                                                    <Input
                                                        {...signUpForm.register("fullName")}
                                                        placeholder="John Doe"
                                                        className="h-12 bg-slate-950/50 border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                                    />
                                                    {signUpForm.formState.errors.fullName && (
                                                        <p className="text-xs text-red-400">{signUpForm.formState.errors.fullName.message}</p>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-indigo-400" />
                                                        Work Email
                                                    </label>
                                                    <Input
                                                        {...signUpForm.register("email")}
                                                        type="email"
                                                        placeholder="john@acme.com"
                                                        className="h-12 bg-slate-950/50 border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                                    />
                                                    {signUpForm.formState.errors.email && (
                                                        <p className="text-xs text-red-400">{signUpForm.formState.errors.email.message}</p>
                                                    )}
                                                </div>

                                                {/* Password */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-indigo-400" />
                                                        Password
                                                    </label>
                                                    <Input
                                                        {...signUpForm.register("password")}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-12 bg-slate-950/50 border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                                    />
                                                    {signUpForm.formState.errors.password && (
                                                        <p className="text-xs text-red-400">{signUpForm.formState.errors.password.message}</p>
                                                    )}
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/50 transition-all group"
                                                >
                                                    Create Account
                                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="signin"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-5">
                                                {/* Email */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-indigo-400" />
                                                        Email Address
                                                    </label>
                                                    <Input
                                                        {...signInForm.register("email")}
                                                        type="email"
                                                        placeholder="recruiter@company.com"
                                                        className="h-12 bg-slate-950/50 border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                                    />
                                                    {signInForm.formState.errors.email && (
                                                        <p className="text-xs text-red-400">{signInForm.formState.errors.email.message}</p>
                                                    )}
                                                </div>

                                                {/* Password */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                            <Lock className="w-4 h-4 text-indigo-400" />
                                                            Password
                                                        </label>
                                                        <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                                            Forgot?
                                                        </Link>
                                                    </div>
                                                    <Input
                                                        {...signInForm.register("password")}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-12 bg-slate-950/50 border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                                    />
                                                    {signInForm.formState.errors.password && (
                                                        <p className="text-xs text-red-400">{signInForm.formState.errors.password.message}</p>
                                                    )}
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/50 transition-all group"
                                                >
                                                    Sign In
                                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Divider */}
                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-700" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-slate-900 px-4 text-slate-500">Or continue with</span>
                                    </div>
                                </div>

                                {/* Google Sign In */}
                                <Button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    variant="outline"
                                    className="w-full h-12 bg-white/5 border-slate-700 hover:bg-white/10 text-white rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </Button>

                                {/* Footer Links */}
                                <p className="text-center text-sm text-slate-500 mt-6">
                                    By continuing, you agree to our{' '}
                                    <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                                        Terms of Service
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function RecruiterAuth() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center"><PremiumLogoLoader text="Loading..." /></div>}>
            <RecruiterAuthContent />
        </Suspense>
    );
}
