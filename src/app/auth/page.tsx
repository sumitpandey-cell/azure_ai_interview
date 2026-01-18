"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Upload, Users, ArrowRight, ArrowLeft, Github, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import imageCompression from 'browser-image-compression';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const signUpSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    gender: z.string().optional(),
    acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
});

const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type SignUpForm = z.infer<typeof signUpSchema>;
type SignInForm = z.infer<typeof signInSchema>;

function AuthContent() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const { signUp, signIn, signInWithGoogle, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    const pendingRedirect = useRef(false);

    const testimonials = [
        {
            quote: "The difference between a successful interview and a missed opportunity is preparation. Master your story with AI-driven insights.",
            author: "The Arjuna Team",
            role: "AI Interview Platform"
        },
        {
            quote: "Search and find your dream job is now easier than ever. Just browse a job and apply if you need to.",
            author: "Mas Parjono",
            role: "UI Designer at Google"
        },
        {
            quote: "Be among the first founders to experience the easiest way to start run a business.",
            author: "Sarah Chen",
            role: "Product Manager at Meta"
        }
    ];

    const signUpForm = useForm<SignUpForm>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            gender: "",
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
    const watchPassword = signUpForm.watch("password");
    useEffect(() => {
        if (isSignUp && watchPassword) {
            setPasswordStrength(calculatePasswordStrength(watchPassword));
        } else {
            setPasswordStrength(0);
        }
    }, [watchPassword, isSignUp]);

    // Redirect if already logged in or after successful sign-in
    useEffect(() => {
        if (user && (pendingRedirect.current || !isSignUp)) {
            pendingRedirect.current = false;
            router.push(redirectTo);
        }
    }, [user, router, redirectTo, isSignUp]);

    // Reset forms when switching between sign in/sign up
    useEffect(() => {
        setShowPassword(false);
        if (isSignUp) {
            signInForm.reset();
        } else {
            signUpForm.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSignUp]);

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
            await signUp(values.email, values.password, values.fullName, values.gender);

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
            // Error is handled in the context
        }
    };

    const handleSignIn = async (values: SignInForm) => {
        try {
            pendingRedirect.current = true;
            await signIn(values.email, values.password);
        } catch (error) {
            pendingRedirect.current = false;
        }
    };

    const switchMode = (mode: boolean) => {
        setIsSignUp(mode);
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

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Google sign-in error:", error);
        }
    };

    const nextTestimonial = () => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <div className="relative min-h-screen flex flex-col lg:flex-row lg:grid lg:grid-cols-2">
            {/* Left Panel - Form */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative min-h-screen lg:h-screen flex-col bg-[#0A0F1E] p-4 sm:p-6 md:p-8 lg:p-10 text-white flex overflow-y-auto"
            >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                </div>

                {/* Header Logo */}
                <Link href="/" className="relative z-20 flex items-center text-lg font-medium tracking-tight mb-6 sm:mb-8 lg:mb-12 hover:opacity-80 transition-opacity">
                    <img src="/arjuna-icon.png" alt="Arjuna AI Logo" className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                    <span className="text-base sm:text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Arjuna AI</span>
                </Link>

                {/* Form Content */}
                <div className="relative z-20 flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-4 sm:py-0">
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-2">
                            {isSignUp ? "Create Your Account" : "Please Enter your Account details"}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            {isSignUp ? (
                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Form {...signUpForm}>
                                        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                                            {/* Avatar Upload */}
                                            <div className="flex flex-col items-center space-y-2 sm:space-y-3 pb-1 sm:pb-2">
                                                <Label htmlFor="avatar-upload" className="cursor-pointer group relative">
                                                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 border-2 border-white/20 group-hover:border-primary transition-all duration-300 shadow-lg">
                                                        <AvatarImage src={avatarPreview || ""} />
                                                        <AvatarFallback className="bg-white/10 text-white/60">
                                                            <Upload className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 sm:p-2 text-white shadow-lg group-hover:scale-110 transition-transform">
                                                        <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </div>
                                                </Label>
                                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                                <p className="text-[10px] sm:text-xs text-white/50">Upload profile picture (optional)</p>
                                            </div>

                                            {/* Name Field */}
                                            <FormField
                                                control={signUpForm.control}
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white text-sm">Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" className="h-11 sm:h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Email Field */}
                                            <FormField
                                                control={signUpForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white text-sm">Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="johndoe@gmail.com" className="h-11 sm:h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Password Field */}
                                            <FormField
                                                control={signUpForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white text-sm">Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="••••••••"
                                                                    type={showPassword ? "text" : "password"}
                                                                    className="h-11 sm:h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500 pr-10"
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
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Gender Field */}
                                            <FormField
                                                control={signUpForm.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white text-sm">Gender (Optional)</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-11 sm:h-12 bg-white/95 border-0 rounded-xl text-gray-900">
                                                                    <SelectValue placeholder="Select Gender" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-0 shadow-2xl">
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Terms and Conditions Field */}
                                            <FormField
                                                control={signUpForm.control}
                                                name="acceptTerms"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                className="mt-1 border-white/30 bg-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-xs text-white/80 font-normal leading-relaxed">
                                                                I accept the <Link href="/terms" className="text-primary hover:text-primary/80 underline">Terms & Conditions</Link>
                                                            </FormLabel>
                                                            <FormMessage className="text-xs" />
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg transition-all mt-4" disabled={signUpForm.formState.isSubmitting}>
                                                {signUpForm.formState.isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                        Creating Account...
                                                    </div>
                                                ) : (
                                                    "Sign up"
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signin"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Form {...signInForm}>
                                        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                                            {/* Email Field */}
                                            <FormField
                                                control={signInForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white text-sm">Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="johndoe@gmail.com" className="h-11 sm:h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Password Field */}
                                            <FormField
                                                control={signInForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white text-sm">Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="••••••••"
                                                                    className="h-11 sm:h-12 bg-white/95 border-0 rounded-xl text-gray-900 placeholder:text-gray-500 pr-10"
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
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="text-right">
                                                <Link href="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">
                                                    Forgot Password?
                                                </Link>
                                            </div>

                                            <Button type="submit" className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg transition-all" disabled={signInForm.formState.isSubmitting}>
                                                {signInForm.formState.isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                        Signing in...
                                                    </div>
                                                ) : (
                                                    "Sign in"
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Social Login */}
                        <div className="relative my-4 sm:my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                <span className="bg-[#0A0F1E] px-3 sm:px-4 text-white/40">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                type="button"
                                className="h-10 sm:h-11 border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-xl"
                                onClick={handleGoogleSignIn}
                            >
                                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                className="h-10 sm:h-11 border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-xl"
                            >
                                <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                className="h-10 sm:h-11 border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-xl"
                            >
                                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.54-2.12-9.92-5.04-.42.72-.66 1.55-.66 2.44 0 1.67.85 3.14 2.14 4-.79-.02-1.53-.24-2.18-.6v.06c0 2.33 1.66 4.28 3.86 4.72-.4.11-.83.17-1.27.17-.31 0-.62-.03-.92-.08.62 1.94 2.42 3.35 4.55 3.39-1.67 1.31-3.77 2.09-6.05 2.09-.39 0-.78-.02-1.17-.07 2.18 1.4 4.77 2.21 7.55 2.21 9.06 0 14-7.5 14-14 0-.21 0-.42-.02-.63.96-.69 1.8-1.56 2.46-2.55z" />
                                </svg>
                            </Button>
                        </div>

                        <p className="text-center text-xs sm:text-sm text-white/60 mt-4 sm:mt-6">
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            <button
                                onClick={() => switchMode(!isSignUp)}
                                className="text-primary hover:text-primary/80 font-semibold transition-colors"
                            >
                                {isSignUp ? "Sign in" : "Create an account"}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Right Panel - Testimonials */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="relative hidden lg:flex h-full flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-10 text-white overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                    {/* Top Section */}
                    <div>
                        <h1 className="text-4xl font-bold mb-4">What our<br />Jobseekers Said.</h1>
                        <div className="w-12 h-1 bg-white/30 rounded-full" />
                    </div>

                    {/* Testimonial Cards */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonial}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 text-gray-900 shadow-xl"
                            >
                                <p className="text-lg mb-6 leading-relaxed">
                                    "{testimonials[currentTestimonial].quote}"
                                </p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{testimonials[currentTestimonial].author}</p>
                                        <p className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={prevTestimonial}
                                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                        >
                                            <ChevronLeft className="h-5 w-5 text-gray-700" />
                                        </button>
                                        <button
                                            onClick={nextTestimonial}
                                            className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
                                        >
                                            <ChevronRight className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Secondary Card */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-gray-900 shadow-xl relative overflow-hidden">
                            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-2xl text-white">+</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Get your right job and right place apply now</h3>
                            <p className="text-sm text-gray-600 mb-4">Be among the first founders to experience the easiest way to start run a business.</p>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white" />
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-white" />
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 border-2 border-white" />
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-white" />
                            </div>
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentTestimonial(index)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    currentTestimonial === index ? "bg-white w-8" : "bg-white/40"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function Auth() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-primary/20 rounded-full animate-ping absolute" />
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent relative z-10" />
                </div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}