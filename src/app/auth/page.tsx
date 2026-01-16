"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Upload, Users, ArrowRight, Github } from "lucide-react";
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
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const pendingRedirect = useRef(false);

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

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Panel - Visuals */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative hidden h-full flex-col bg-[#050A14] p-10 text-white lg:flex dark:border-r border-indigo-500/10 overflow-hidden"
      >
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated Gradient Orbs */}
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse-subtle" />
          <div className="absolute top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-blue-600/20 blur-[120px] animate-blob" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[100px] animate-float-delayed" />

          {/* Cyber Grid */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Header Logo */}
        <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
          <img src="/arjuna-icon.png" alt="Arjuna AI Logo" className="mr-3 h-8 w-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Arjuna AI</span>
        </div>

        {/* Central Visual */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
          {/* Holographic Container */}
          <div className="relative w-full max-w-[480px] aspect-square animate-float flex items-center justify-center group">
            {/* Rotating Rings Effect */}
            <div className="absolute inset-0 border border-indigo-500/20 rounded-full scale-[0.8] animate-spin-slow" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-[0.9] -rotate-45" />

            {/* Core Glow */}
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />

            <img
              src="/arjuna-icon.png"
              alt="Arjuna AI Logo"
              className="relative w-[380px] h-[380px] object-contain drop-shadow-[0_0_60px_rgba(99,102,241,0.6)] z-10 hover:scale-105 transition-transform duration-700 hover:drop-shadow-[0_0_80px_rgba(99,102,241,0.8)]"
            />
          </div>
        </div>

        {/* Bottom Quote Card */}
        <div className="relative z-20 mt-auto">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <blockquote className="space-y-4 relative z-10">
              <p className="text-xl font-light leading-relaxed tracking-wide text-indigo-100">
                &ldquo;The difference between a successful interview and a missed opportunity is preparation. Master your story with AI-driven insights.&rdquo;
              </p>
              <footer className="flex items-center gap-3 pt-2">
                <div className="h-px bg-indigo-500/50 w-8" />
                <span className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">The Arjuna Team</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="lg:p-8 w-full min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[500px] py-12 px-6"
        >
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {isSignUp ? "Forge Your Future" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {isSignUp
                ? "Start your journey with precision AI preparation"
                : "Reconnect with your professional trajectory"}
            </p>
          </div>

          <div className="grid gap-6">
            <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/10 shadow-2xl bg-card/30 backdrop-blur-sm">
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
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center space-y-4 mb-4">
                          <Label htmlFor="avatar-upload" className="cursor-pointer group relative">
                            <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary transition-all duration-300 shadow-xl">
                              <AvatarImage src={avatarPreview || ""} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                <Upload className="h-10 w-10" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 bg-primary rounded-xl p-2 text-white shadow-lg group-hover:scale-110 transition-transform">
                              <Upload className="h-4 w-4" />
                            </div>
                          </Label>
                          <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </div>

                        {/* Name Field */}
                        <FormField
                          control={signUpForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative group">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input placeholder="Full Name" className="pl-12 h-14 bg-background/50 border-2 border-border/50 rounded-2xl focus:border-primary/50 transition-all font-medium" {...field} />
                                </div>
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
                              <FormControl>
                                <div className="relative group">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input placeholder="name@example.com" className="pl-12 h-14 bg-background/50 border-2 border-border/50 rounded-2xl focus:border-primary/50 transition-all font-medium" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signUpForm.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-14 bg-background/50 border-2 border-border/50 rounded-2xl focus:border-primary/50 text-muted-foreground">
                                    <SelectValue placeholder="Select Gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* Password Field */}
                        <FormField
                          control={signUpForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative group">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-12 pr-12 h-14 bg-background/50 border-2 border-border/50 rounded-2xl focus:border-primary/50 transition-all font-medium"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </FormControl>
                              {field.value && (
                                <div className="space-y-2 mt-3 px-1">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground">Entropy Level</span>
                                    <span className={cn(
                                      passwordStrength < 40 ? "text-red-500" : passwordStrength < 70 ? "text-yellow-500" : "text-green-500"
                                    )}>
                                      {getPasswordStrengthText()}
                                    </span>
                                  </div>
                                  <Progress value={passwordStrength} className={cn("h-1.5", getPasswordStrengthColor())} />
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Terms and Conditions Field */}
                        <FormField
                          control={signUpForm.control}
                          name="acceptTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 px-1">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1 border-border/50 bg-background/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                  I acknowledge the <Link href="/terms" className="text-primary hover:text-primary/80 underline decoration-2 decoration-primary/20 transition-colors">Terms of Engagement</Link> and data protocols.
                                </FormLabel>
                                <FormMessage className="text-[10px] uppercase font-black tracking-widest pt-1" />
                              </div>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 border-b-4 border-primary/20 active:border-b-0 transition-all mt-6" disabled={signUpForm.formState.isSubmitting}>
                          {signUpForm.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Initializing...
                            </div>
                          ) : (
                            <span className="flex items-center gap-2">
                              Create Account <ArrowRight className="h-4 w-4" />
                            </span>
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
                      <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                        {/* Email Field */}
                        <FormField
                          control={signInForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative group">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input placeholder="name@example.com" className="pl-12 h-14 bg-background/50 border-2 border-border/50 rounded-2xl focus:border-primary/50 transition-all font-medium" {...field} />
                                </div>
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
                              <FormControl>
                                <div className="relative group">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    className="pl-12 pr-12 h-14 bg-background/50 border-2 border-border/50 rounded-2xl focus:border-primary/50 transition-all font-medium"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 border-b-4 border-primary/20 active:border-b-0 transition-all mt-4" disabled={signInForm.formState.isSubmitting}>
                          {signInForm.formState.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Authorizing...
                            </div>
                          ) : (
                            <span className="flex items-center gap-2">
                              Authorize Access <ArrowRight className="h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
                  <span className="bg-[#0f172a] sm:bg-card px-4">Distributed Auth</span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full h-14 border-2 border-border/50 bg-background/50 hover:bg-muted font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                onClick={handleGoogleSignIn}
              >
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Google ActiveID
                </div>
              </Button>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground font-medium">
              {isSignUp ? "Already operational? " : "New to the collective? "}
              <button
                onClick={() => switchMode(!isSignUp)}
                className="text-primary hover:text-primary/80 font-black underline underline-offset-4 decoration-2 decoration-primary/30 transition-colors"
              >
                {isSignUp ? "Back to Login" : "Initialize Registration"}
              </button>
            </p>
          </div>
        </motion.div>
      </div >
    </div >
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
