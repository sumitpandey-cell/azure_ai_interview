"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Upload, Plus, Sparkles, CheckCircle2, User as UserIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import imageCompression from 'browser-image-compression';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";

const signUpSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    gender: z.string().optional(),
    userType: z.enum(['student', 'recruiter']).default('student'),
    orgName: z.string().max(100).optional(),
    acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
}).refine((data) => {
    if (data.userType === 'recruiter' && !data.orgName) {
        return false;
    }
    return true;
}, {
    message: "Organization name is required for recruiters",
    path: ["orgName"],
});

const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type SignUpForm = z.infer<typeof signUpSchema>;
type SignInForm = z.infer<typeof signInSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function AuthContent() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { signUp, signIn, signInWithGoogle, resetPassword, user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';

    const testimonials = [
        {
            quote: "This platform revolutionized how I prepare for technical interviews. The AI's feedback is incredibly precise.",
            author: "Alex Rivera",
            role: "Software Engineer at Google"
        },
        {
            quote: "I landed my dream job at Meta after using Arjuna to practice. The real-time scoring is a game-changer.",
            author: "Sarah Chen",
            role: "Product Manager"
        },
        {
            quote: "The most realistic interview experience I've had. No more platform anxiety during actual rounds.",
            author: "James Wilson",
            role: "Frontend Developer"
        }
    ];

    const studentFeatures = [
        { icon: Sparkles, title: "AI-Powered Practice", desc: "Sharpen your skills with realistic AI interactions." },
        { icon: CheckCircle2, title: "Instant Feedback", desc: "Get scored immediately after every session." },
        { icon: UserIcon, title: "Personal Branding", desc: "Build a profile that recruiters can't ignore." },
    ];

    const signUpForm = useForm<SignUpForm>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            gender: "",
            userType: "student",
            orgName: "",
            acceptTerms: false,
        },
    });

    const signInForm = useForm<SignInForm>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const forgotPasswordForm = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    // Middleware handles redirection if a user tries to access /auth while already logged in.
    // Manual login redirection is now handled in handleSignIn and handleSignUp to ensure role-verification completes first.

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setAvatarFile(compressedFile);
            setAvatarPreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            console.error("Error compressing image:", error);
        }
    };

    const handleSignUp = async (values: SignUpForm) => {
        try {
            await signUp(values.email, values.password, values.fullName, values.userType as 'student' | 'recruiter', values.orgName, values.gender);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                if (avatarFile) {
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `avatar.${fileExt}`;
                    const filePath = `${session.user.id}/${fileName}`;
                    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
                        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
                    }
                }
                router.push(redirectTo);
            }
            signUpForm.reset();
        } catch (error) {
            console.error("Error signing up:", error);
        }
    };

    const handleSignIn = async (values: SignInForm) => {
        try {
            await signIn(values.email, values.password, 'student');
            router.push(redirectTo);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    const handleForgotPassword = async (values: ForgotPasswordForm) => {
        try {
            await resetPassword(values.email);
            setShowForgotPassword(false);
            forgotPasswordForm.reset();
        } catch (error) {
            console.error("Error resetting password:", error);
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
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><PremiumLogoLoader text="Launching Arjuna Space..." /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0A0F1E] to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

            <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Side: Testimonials & Branding */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hidden lg:flex flex-col space-y-10"
                >
                    <Link href="/" className="inline-flex items-center gap-3">
                        <Image src="/arjuna_logo.png" alt="Arjuna AI" width={48} height={48} className="object-contain" />
                        <span className="text-2xl font-black tracking-tight text-white">ARJUNA AI</span>
                    </Link>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-black text-white leading-tight">
                            Master Your <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Interview Story</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                            Join thousands of students using AI to prepare for their career milestones with zero pressure and maximum growth.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {studentFeatures.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-all"
                            >
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                                    <p className="text-sm text-slate-400">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonial}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                <p className="text-slate-400 italic text-sm leading-relaxed">
                                    &quot;{testimonials[currentTestimonial].quote}&quot;
                                </p>
                                <div>
                                    <p className="text-white font-bold text-sm">{testimonials[currentTestimonial].author}</p>
                                    <p className="text-indigo-400 text-xs font-medium uppercase tracking-wider">{testimonials[currentTestimonial].role}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Right Side: Auth Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur-2xl opacity-10" />

                    <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10">
                        {/* Tab Switcher */}
                        <div className="flex gap-2 p-1.5 bg-slate-950/50 rounded-2xl mb-8">
                            <button
                                onClick={() => setIsSignUp(false)}
                                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${!isSignUp ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setIsSignUp(true)}
                                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${isSignUp ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {isSignUp ? (
                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Form {...signUpForm}>
                                        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                                            {/* Avatar Area */}
                                            <div className="flex justify-center pb-4">
                                                <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                                                    <Avatar className="h-20 w-20 border-2 border-slate-700 group-hover:border-indigo-500 transition-all">
                                                        <AvatarImage src={avatarPreview || ""} />
                                                        <AvatarFallback className="bg-slate-800 text-slate-400"><Upload className="h-6 w-6" /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-full text-white shadow-xl"><Plus className="h-3 w-3" /></div>
                                                </label>
                                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={signUpForm.control}
                                                    name="fullName"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</Label>
                                                                <FormControl>
                                                                    <Input placeholder="John Doe" className="h-12 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl text-white font-bold" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-[10px]" />
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={signUpForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</Label>
                                                                <FormControl>
                                                                    <Input placeholder="name@email.com" className="h-12 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl text-white font-bold" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-[10px]" />
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={signUpForm.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Password</Label>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl text-white font-bold pr-10" {...field} />
                                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                        </button>
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage className="text-[10px]" />
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={signUpForm.control}
                                                    name="gender"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Gender</Label>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 bg-slate-950/50 border-slate-800 rounded-xl text-white font-bold">
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-xl">
                                                                    <SelectItem value="male">Male</SelectItem>
                                                                    <SelectItem value="female">Female</SelectItem>
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex items-center gap-3 pt-6">
                                                    <FormField
                                                        control={signUpForm.control}
                                                        name="acceptTerms"
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="bg-slate-950/50 border-slate-800 data-[state=checked]:bg-indigo-600" />
                                                                </FormControl>
                                                                <Label className="text-[10px] font-bold text-slate-400">ACCEPT TERMS</Label>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-xl shadow-indigo-900/20 mt-4" disabled={signUpForm.formState.isSubmitting}>
                                                {signUpForm.formState.isSubmitting ? "CREATING..." : "START YOUR JOURNEY"}
                                            </Button>
                                        </form>
                                    </Form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signin"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Form {...signInForm}>
                                        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</Label>
                                                <FormControl>
                                                    <Input placeholder="name@email.com" className="h-12 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl text-white font-bold" {...signInForm.register("email")} />
                                                </FormControl>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</Label>
                                                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">FORGOT?</button>
                                                </div>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl text-white font-bold pr-10" {...signInForm.register("password")} />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                            </div>

                                            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-xl shadow-indigo-900/20" disabled={signInForm.formState.isSubmitting}>
                                                {signInForm.formState.isSubmitting ? "SIGNING IN..." : "WELCOME BACK"}
                                            </Button>
                                        </form>
                                    </Form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-500"><span className="bg-[#0A0F1E] px-4">Secure Access</span></div>
                        </div>

                        <Button onClick={handleGoogleSignIn} variant="outline" className="w-full h-12 bg-white/5 border-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex gap-3">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">Recover Account</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">Reset link will be sent to your email.</DialogDescription>
                    </DialogHeader>
                    <Form {...forgotPasswordForm}>
                        <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4 mt-4">
                            <FormField
                                control={forgotPasswordForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Enter your email" className="h-12 bg-slate-950 border-slate-800 rounded-xl text-white font-bold" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowForgotPassword(false)} className="flex-1 h-12 text-slate-400 font-bold">Cancel</Button>
                                <Button type="submit" className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl">Send Link</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function Auth() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><PremiumLogoLoader text="Connecting..." /></div>}>
            <AuthContent />
        </Suspense>
    );
}