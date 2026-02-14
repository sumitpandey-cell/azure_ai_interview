"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Upload, ArrowRight, Sparkles, X } from "lucide-react";
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

// Schema Definitions
const signUpSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    gender: z.string().optional(),
    userType: z.enum(['student', 'recruiter']).default('student'),
    orgName: z.string().max(100).optional(),
    acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms"),
}).refine((data) => {
    if (data.userType === 'recruiter' && !data.orgName) return false;
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

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

function AuthContent() {
    const [isExiting, setIsExiting] = useState(false);
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
        }, 6000);
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

    const handleExit = () => {
        setIsExiting(true);
    };

    if (loading && !user) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><PremiumLogoLoader text="Launching Arjuna Space..." /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={isExiting ? { opacity: 0, scale: 0.95, filter: "blur(20px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => { if (isExiting) router.push('/?skip_intro=true'); }}
            className="w-full min-h-screen lg:h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-slate-950"
        >
            {/* Left Column: Immersive Visuals */}
            <div className="hidden lg:flex relative flex-col justify-between p-12 bg-slate-900 border-r border-white/5 overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/auth-sidebar-robot.png"
                        alt="Arjuna AI Background"
                        fill
                        className="object-cover opacity-90 scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-950/40 to-indigo-900/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-transparent via-slate-950/50 to-slate-950" />
                </div>

                {/* Brand Header */}
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-indigo-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Image src="/arjuna_logo.png" alt="Arjuna AI" width={42} height={42} className="relative object-contain" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">ARJUNA AI</span>
                    </Link>
                </div>

                {/* Testimonial / Featured Content */}
                <div className="relative z-10 max-w-md">
                    <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                        Unlock Your Potential.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Prepare without limits.</span>
                    </h2>

                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonial}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-4"
                            >
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-lg text-slate-100 font-medium leading-relaxed">
                                    &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider">
                                        {testimonials[currentTestimonial].author.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{testimonials[currentTestimonial].author}</p>
                                        <p className="text-indigo-200 text-xs font-medium tracking-wide">{testimonials[currentTestimonial].role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Right Column: Auth Form */}
            <div className="relative flex flex-col items-center justify-center p-4 sm:p-12 overflow-y-auto bg-white min-h-screen lg:min-h-0">
                <div className="absolute top-6 right-6 z-20">
                    <button onClick={handleExit} className="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute top-6 left-6 lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <Image src="/arjuna_logo.png" alt="Arjuna AI" width={32} height={32} className="object-contain invert" />
                        <span className="text-lg font-black text-slate-900">ARJUNA AI</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[440px] space-y-8"
                >
                    <div className="space-y-2 text-center lg:text-left mt-16 lg:mt-0">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                            {isSignUp ? "Create an account" : "Welcome back"}
                        </h1>
                        <p className="text-slate-500 text-base">
                            {isSignUp ? "Join thousands of developers mastering their craft." : "Enter your credentials to access your account."}
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <AnimatePresence mode="wait">
                            {isSignUp ? (
                                <motion.div
                                    key="signup-form"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Form {...signUpForm}>
                                        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5">
                                            <div className="flex justify-center pb-2">
                                                <label htmlFor="avatar-upload" className="relative cursor-pointer group">
                                                    <Avatar className="h-24 w-24 border-4 border-white ring-2 ring-slate-100 group-hover:ring-indigo-500 transition-all shadow-xl">
                                                        <AvatarImage src={avatarPreview || ""} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-400 group-hover:bg-slate-200 transition-colors"><Upload className="h-8 w-8" /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg border-4 border-white"><PlusIcon className="h-4 w-4" /></div>
                                                </label>
                                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            </div>

                                            <FormField
                                                control={signUpForm.control}
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Full Name</Label>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium placeholder:text-slate-400" />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] text-red-500 pl-1" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={signUpForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Email</Label>
                                                        <FormControl>
                                                            <Input placeholder="name@example.com" {...field} className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium placeholder:text-slate-400" />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] text-red-500 pl-1" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={signUpForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Password</Label>
                                                        <div className="relative">
                                                            <FormControl>
                                                                <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" {...field} className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 pr-10" />
                                                            </FormControl>
                                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                        <FormMessage className="text-[10px] text-red-500 pl-1" />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={signUpForm.control}
                                                    name="userType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Role</Label>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium transition-all">
                                                                        <SelectValue placeholder="Select role" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-white border-slate-100 text-slate-900">
                                                                    <SelectItem value="student">Student</SelectItem>
                                                                    <SelectItem value="recruiter">Recruiter</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={signUpForm.control}
                                                    name="gender"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Gender</Label>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium transition-all">
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-white border-slate-100 text-slate-900">
                                                                    <SelectItem value="male">Male</SelectItem>
                                                                    <SelectItem value="female">Female</SelectItem>
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={signUpForm.control}
                                                name="acceptTerms"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2 space-y-0 pt-2">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                                                        </FormControl>
                                                        <Label className="text-xs font-medium text-slate-500 leading-none cursor-pointer">
                                                            I agree to the <Link href="/terms" className="text-indigo-600 hover:text-indigo-800">Terms</Link> and <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</Link>
                                                        </Label>
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01]" disabled={signUpForm.formState.isSubmitting}>
                                                {signUpForm.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                                                {!signUpForm.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                                            </Button>
                                        </form>
                                    </Form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signin-form"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Form {...signInForm}>
                                        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-5">
                                            <FormField
                                                control={signInForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Email Address</Label>
                                                        <FormControl>
                                                            <Input placeholder="name@example.com" {...field} className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium placeholder:text-slate-400" />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] text-red-500 pl-1" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={signInForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Password</Label>
                                                            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot password?</button>
                                                        </div>
                                                        <div className="relative">
                                                            <FormControl>
                                                                <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} className="h-12 bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 pr-10" />
                                                            </FormControl>
                                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                        <FormMessage className="text-[10px] text-red-500 pl-1" />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01]" disabled={signInForm.formState.isSubmitting}>
                                                {signInForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
                                                {!signInForm.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                                            </Button>
                                        </form>
                                    </Form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-slate-500 font-bold tracking-wider">Or continue with</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="w-full h-12 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </Button>
                    </div>

                    <p className="text-center text-sm text-slate-500">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4">
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                    </p>
                </motion.div>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Recover Account</DialogTitle>
                        <DialogDescription className="text-slate-400">Enter your email to receive a reset link.</DialogDescription>
                    </DialogHeader>
                    <Form {...forgotPasswordForm}>
                        <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4 mt-2">
                            <FormField
                                control={forgotPasswordForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label className="sr-only">Email</Label>
                                        <FormControl>
                                            <Input placeholder="name@example.com" {...field} className="h-12 bg-slate-950 border-slate-800 rounded-xl text-white font-medium" />
                                        </FormControl>
                                        <FormMessage className="text-[10px] text-red-400 pl-1" />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowForgotPassword(false)} className="flex-1 h-12 text-slate-400 hover:text-white font-bold rounded-xl">Cancel</Button>
                                <Button type="submit" className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Send Link</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

export default function Auth() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><PremiumLogoLoader text="Connecting..." /></div>}>
            <AuthContent />
        </Suspense>
    );
}