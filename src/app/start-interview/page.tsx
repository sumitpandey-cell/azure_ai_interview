'use client'
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Upload, Sparkles, Play, Briefcase, Clock, FileText, Code, User, Monitor, Building2, Target, CheckCircle2 } from "lucide-react";
import { CompanyTemplate } from "@/types/company-types";
import { useCompanyQuestions } from "@/hooks/use-company-questions";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useInterviewStore } from "@/stores/use-interview-store";
import { interviewService, subscriptionService } from "@/services";
import { InterviewConflictDialog } from "@/components/InterviewConflictDialog";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    interviewMode: z.enum(["general", "company"]),
    interviewType: z.string().min(1, "Interview type is required"),
    position: z.string().min(1, "Position is required"),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
    companyId: z.string().optional(),
    role: z.string().optional(),
    experienceLevel: z.string().optional(),
    skills: z.string().optional(),
    jobDescription: z.any().optional(),
});

const COMMON_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile Developer",
    "Software Engineer",
    "DevOps Engineer",
    "Data Scientist",
    "AI/ML Engineer",
    "UI/UX Designer",
    "Product Manager",
    "QA Automation Engineer",
    "Cybersecurity Analyst",
    "Cloud Architect",
    "Engineering Manager",
];

const ROLE_SKILLS: Record<string, string[]> = {
    "Frontend Developer": ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "Web Performance"],
    "Backend Developer": ["Node.js", "Python", "PostgreSQL", "Redis", "Distributed Systems", "REST APIs"],
    "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "System Design", "Docker"],
    "Mobile Developer": ["React Native", "Swift", "Kotlin", "Firebase", "Mobile CI/CD", "App Store Guidelines"],
    "Software Engineer": ["Data Structures", "Algorithms", "System Design", "Clean Code", "Unit Testing", "Git"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Monitoring"],
    "Data Scientist": ["Python", "SQL", "Pandas", "Machine Learning", "Statistics", "Data Visualization"],
    "AI/ML Engineer": ["PyTorch", "TensorFlow", "NLP", "Computer Vision", "Model Deployment", "Python"],
    "UI/UX Designer": ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Accessibility"],
    "Product Manager": ["Product Vision", "Agile/Scrum", "Data Analytics", "Stakeholder Management", "Roadmapping", "Market Research"],
    "QA Automation Engineer": ["Selenium", "Cypress", "Jest", "TDD", "Test Planning", "Bug Tracking"],
    "Cybersecurity Analyst": ["Network Security", "Penetration Testing", "Security Auditing", "Cryptography", "Incident Response", "Compliance"],
    "Cloud Architect": ["AWS", "Azure", "Serverless", "Cloud Security", "Cost Optimization", "High Availability"],
    "Engineering Manager": ["Leadership", "Team Building", "Project Management", "Technical Strategy", "Mentorship", "Budgeting"],
};

function StartInterviewContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [skillsList, setSkillsList] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [jobDescriptionType, setJobDescriptionType] = useState<'upload' | 'manual'>('upload');
    const [interviewMode, setInterviewMode] = useState<'general' | 'company'>(
        searchParams.get('mode') === 'company' ? 'company' : 'general'
    );
    const [companyTemplate, setCompanyTemplate] = useState<CompanyTemplate | null>(null);
    const { fetchCompanyTemplates, createInterviewSession } = useOptimizedQueries();
    const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([]);
    const { setCurrentSession } = useInterviewStore();
    const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
    const [conflictSession, setConflictSession] = useState<any>(null);
    const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            interviewMode: interviewMode,
            interviewType: "",
            position: companyTemplate?.common_roles?.[0] || "",
            difficulty: "Medium",
            companyId: companyTemplate?.id || "",
            role: "",
            experienceLevel: "",
            skills: "",
        },
    });

    // Fetch company templates for dropdown
    useEffect(() => {
        const loadCompanies = async () => {
            const templates = await fetchCompanyTemplates();
            setCompanyTemplates(templates);

            // If companyId is in URL params, set the company template
            const companyId = searchParams.get('companyId');
            if (companyId && templates.length > 0) {
                const template = templates.find(t => t.id === companyId);
                if (template) {
                    setCompanyTemplate(template);
                }
            }
        };
        loadCompanies();
    }, [fetchCompanyTemplates, searchParams]);

    // Update form when company template changes
    useEffect(() => {
        if (companyTemplate) {
            form.setValue('companyId', companyTemplate.id);
            form.setValue('position', companyTemplate.common_roles?.[0] || '');
        }
    }, [companyTemplate, form]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 1) {
            toast.error("Only one file can be uploaded at a time");
            return;
        }
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(fileExtension || '')) {
            toast.error("Unsupported file format. Please use PDF, DOCX, or TXT.");
            return;
        }

        setIsParsing(true);
        const toastId = toast.loading(`Analyzing ${file.name}...`);

        try {
            // If it's a text file, we can read it easily
            if (fileExtension === 'txt') {
                const text = await file.text();
                form.setValue('jobDescription', text);
                toast.success("Job description extracted successfully", { id: toastId });
            } else {
                // For PDF and DOCX, in a real app we'd send to an API
                // For now, we'll simulate the extraction or inform the user
                // To keep it functional, let's pretend we extracted basic info
                setTimeout(() => {
                    const ext = fileExtension?.toUpperCase() || 'FILE';
                    toast.success(`${file.name} attached. (Parsing logic for ${ext} would be connected here)`, { id: toastId });
                    form.setValue('jobDescription', `Attached file: ${file.name}\n(Content from ${ext} parsing payload)`);
                }, 1500);
            }
        } catch (error) {
            console.error("Error reading file:", error);
            toast.error("Failed to read file", { id: toastId });
        } finally {
            setIsParsing(false);
        }
    };

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            setSkillsList([...skillsList, skillInput.trim()]);
            setSkillInput("");
            form.setValue("skills", ""); // Clear the hidden input if we were using one, or just manage state
        }
    };

    const handleRoleSelection = (role: string) => {
        const suggestedSkills = ROLE_SKILLS[role] || [];
        if (suggestedSkills.length > 0) {
            // Merge with existing skills, avoiding duplicates
            setSkillsList(prev => Array.from(new Set([...prev, ...suggestedSkills])));
            toast.success(`Suggested skills added for ${role}`, {
                icon: <Sparkles className="h-4 w-4 text-primary" />,
                duration: 3000
            });
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) {
            toast.error("You must be logged in to start an interview");
            return;
        }

        setIsLoading(true);
        try {
            // Check message threshold (min 2 minutes)
            const usage = await subscriptionService.checkUsageLimit(user.id);
            if (usage.remainingMinutes < 120) {
                toast.error("Insufficient balance", {
                    description: "You need at least 2 minutes of interview time to start a new session.",
                    action: {
                        label: "Upgrade",
                        onClick: () => router.push("/pricing")
                    }
                });
                setIsLoading(false);
                return;
            }

            // ✅ CHECK FOR EXISTING IN-PROGRESS SESSIONS using service
            const existingSessions = await interviewService.getInProgressSessions(user.id);

            // Filter for session of the SAME DOMAIN (position and type)
            const sameDomainSession = existingSessions?.find(s =>
                s.position.toLowerCase() === values.position.toLowerCase() &&
                s.interview_type.toLowerCase() === values.interviewType.toLowerCase()
            );

            // If there is an in-progress session of the SAME DOMAIN, show dialog
            if (sameDomainSession) {
                setConflictSession(sameDomainSession);
                setPendingValues(values);
                setConflictDialogOpen(true);
                setIsLoading(false);
                return;
            }

            await executeStartInterview(values);
        } catch (error) {
            console.error("Error in onSubmit:", error);
            toast.error("Failed to start interview");
            setIsLoading(false);
        }
    };

    const handleContinuePrevious = () => {
        if (!conflictSession) return;
        toast.info("Redirecting to previous interview...");
        const stage = (conflictSession.config as any)?.currentStage || 'setup';
        router.push(`/interview/${conflictSession.id}/${stage}`);
        setConflictDialogOpen(false);
    };

    const handleStartNewAfterAbandon = async () => {
        if (!conflictSession || !pendingValues) return;

        setConflictDialogOpen(false);
        setIsLoading(true);

        try {
            // Abandon previous session using service
            const abandoned = await interviewService.abandonSession(conflictSession.id);

            if (abandoned) {
                toast.success("Previous interview abandoned. Starting new session...");
                await executeStartInterview(pendingValues);
            } else {
                toast.error("Failed to abandon previous session. Please try again.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error abandoning session:", error);
            toast.error("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const executeStartInterview = async (values: z.infer<typeof formSchema>) => {
        try {
            // Continue with creating new session
            const config: any = {
                skills: skillsList,
                jobDescription: values.jobDescription || null,
                difficulty: values.difficulty,
            };

            // Add company-specific config if company interview
            if (values.interviewMode === 'company' && values.companyId) {
                const selectedCompany = companyTemplates.find(c => c.id === values.companyId) || companyTemplate;
                config.companyInterviewConfig = {
                    companyTemplateId: values.companyId,
                    companyName: selectedCompany?.name || '',
                    role: values.role || values.position,
                    experienceLevel: values.experienceLevel || 'Mid'
                };
            }

            // ✅ CREATE NEW SESSION USING OPTIMIZED HOOK
            const session = await createInterviewSession({
                position: values.position,
                interview_type: values.interviewType,
                difficulty: values.difficulty,
                jobDescription: values.jobDescription,
                config: {
                    ...config,
                    currentStage: 'setup' // Initialize with setup stage
                }
            });

            if (session) {
                // Store complete session data in Zustand for immediate access
                console.log("💾 Storing session in Zustand:", session.id);
                setCurrentSession({
                    id: session.id,
                    user_id: session.user_id,
                    position: session.position,
                    interview_type: session.interview_type,
                    status: session.status,
                    config: (session.config as any) || {},
                    created_at: session.created_at
                });

                toast.success("Interview session created!");
                router.replace(`/interview/${session.id}/setup`);
            }
        } catch (error) {
            console.error("Error creating session:", error);
            toast.error("Failed to create interview session");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-3xl space-y-8 pb-12 pt-10 sm:pt-0">
                <div className="text-center space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary shadow-sm border border-primary/20">
                        <Sparkles className="mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        AI-Powered Career Prep
                    </div>
                    <div className="space-y-2 sm:space-y-3 px-4 sm:px-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            Ready to <span className="text-primary italic">Ace</span> it?
                        </h1>
                        <p className="text-muted-foreground max-w-xl mx-auto text-xs sm:text-sm md:text-lg font-medium leading-relaxed">
                            Customize your session below and let our AI simulate a high-stakes interview tailored just for you.
                        </p>
                    </div>
                </div>

                <Card className="border-2 border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-5 sm:p-10">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                {/* Step 1: Mode Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-l-4 border-primary pl-4 py-1">
                                        <h2 className="text-lg font-bold">1. Interview Mode</h2>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="interviewMode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            setInterviewMode(value as 'general' | 'company');
                                                        }}
                                                        defaultValue={field.value}
                                                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                                    >
                                                        <div
                                                            className={cn(
                                                                "relative flex items-start space-x-3 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300",
                                                                field.value === 'general'
                                                                    ? "border-primary bg-primary/5 shadow-md"
                                                                    : "border-border bg-card/50 hover:border-primary/50"
                                                            )}
                                                            onClick={() => {
                                                                field.onChange('general');
                                                                setInterviewMode('general');
                                                            }}
                                                        >
                                                            <RadioGroupItem value="general" id="general" className="mt-1" />
                                                            <Label htmlFor="general" className="flex-1 cursor-pointer">
                                                                <div className="font-black text-foreground uppercase tracking-wider text-xs sm:text-sm">General</div>
                                                                <div className="text-[10px] sm:text-xs mt-1 text-muted-foreground leading-relaxed font-medium">Focus on core domain skills and situational judgment.</div>
                                                            </Label>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "relative flex items-start space-x-3 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300",
                                                                field.value === 'company'
                                                                    ? "border-primary bg-primary/5 shadow-md"
                                                                    : "border-border bg-card/50 hover:border-primary/50"
                                                            )}
                                                            onClick={() => {
                                                                field.onChange('company');
                                                                setInterviewMode('company');
                                                            }}
                                                        >
                                                            <RadioGroupItem value="company" id="company" className="mt-1" />
                                                            <Label htmlFor="company" className="flex-1 cursor-pointer">
                                                                <div className="font-black text-foreground uppercase tracking-wider text-xs sm:text-sm">Company Specific</div>
                                                                <div className="text-[10px] sm:text-xs mt-1 text-muted-foreground leading-relaxed font-medium">Practice with curated questions from top-tier tech giants.</div>
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Step 2: Session Configuration */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-l-4 border-primary pl-4 py-1">
                                        <h2 className="text-lg font-bold">2. Session Configuration</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Company Selection - Only for company mode */}
                                        {interviewMode === 'company' && (
                                            <FormField
                                                control={form.control}
                                                name="companyId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 pl-1">
                                                            Select Company
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                const selected = companyTemplates.find(c => c.id === value);
                                                                setCompanyTemplate(selected || null);
                                                            }}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="bg-background/50 border-border/50 h-11 sm:h-12 rounded-xl focus:ring-primary focus:border-primary text-xs sm:text-sm font-bold">
                                                                    <SelectValue placeholder="Choose a company" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl sm:rounded-2xl border-border/50 shadow-2xl">
                                                                {companyTemplates.map((company) => (
                                                                    <SelectItem key={company.id} value={company.id} className="font-bold text-xs sm:text-sm py-2.5 sm:py-3 cursor-pointer">
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{company.name}</span>
                                                                            {company.industry && (
                                                                                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-widest font-black">{company.industry}</span>
                                                                            )}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[10px] font-bold" />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {interviewMode === 'company' ? (
                                            <FormField
                                                control={form.control}
                                                name="role"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 pl-1">
                                                            Specific Role
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative group">
                                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                <Input placeholder="e.g. Frontend Specialist" className="pl-11 bg-background/50 border-border/50 h-11 sm:h-12 rounded-xl focus-visible:ring-primary text-xs sm:text-sm font-bold" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] font-bold" />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="position"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 pl-1">
                                                            Target Position
                                                        </FormLabel>
                                                        <Select onValueChange={(value) => {
                                                            field.onChange(value);
                                                            handleRoleSelection(value);
                                                        }} defaultValue={field.value}>
                                                            <FormControl>
                                                                <div className="relative group">
                                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground z-10 transition-colors group-focus-within:text-primary" />
                                                                    <SelectTrigger className="pl-11 bg-background/50 border-border/50 h-11 sm:h-12 rounded-xl focus:ring-primary text-xs sm:text-sm font-bold">
                                                                        <SelectValue placeholder="e.g. Senior Frontend Engineer" />
                                                                    </SelectTrigger>
                                                                </div>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl sm:rounded-2xl border-border/50 shadow-2xl">
                                                                {COMMON_ROLES.map((role) => (
                                                                    <SelectItem key={role} value={role} className="font-bold text-xs sm:text-sm py-2.5 sm:py-3 cursor-pointer">
                                                                        {role}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[10px] font-bold" />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {interviewMode === 'company' && (
                                            <FormField
                                                control={form.control}
                                                name="experienceLevel"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 pl-1">
                                                            Experience Level
                                                        </FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-background/50 border-border/50 h-11 sm:h-12 rounded-xl focus:ring-primary focus:border-primary text-xs sm:text-sm font-bold">
                                                                    <SelectValue placeholder="Select level" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl sm:rounded-2xl border-border/50 shadow-2xl">
                                                                <SelectItem value="Junior" className="font-bold text-xs sm:text-sm py-2 sm:py-3 curso-pointer">Junior (0-2 years)</SelectItem>
                                                                <SelectItem value="Mid" className="font-bold text-xs sm:text-sm py-2 sm:py-3 curso-pointer">Mid-Level (3-5 years)</SelectItem>
                                                                <SelectItem value="Senior" className="font-bold text-xs sm:text-sm py-2 sm:py-3 curso-pointer">Senior (5+ years)</SelectItem>
                                                                <SelectItem value="Lead" className="font-bold text-xs sm:text-sm py-2 sm:py-3 curso-pointer">Lead / Principal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[10px] font-bold" />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="interviewType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 pl-1">
                                                        Interview Type
                                                    </FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/50 border-border/50 h-11 sm:h-12 rounded-xl focus:ring-primary focus:border-primary text-xs sm:text-sm font-bold">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl sm:rounded-2xl border-border/50 shadow-2xl">
                                                            <SelectItem value="Technical" className="font-bold text-xs sm:text-sm py-2 sm:py-3 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <Code className="h-4 w-4 text-primary" />
                                                                    Technical
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="Behavioral" className="font-bold text-xs sm:text-sm py-2 sm:py-3 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-primary" />
                                                                    Behavioral
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="System Design" className="font-bold text-xs sm:text-sm py-2 sm:py-3 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <Monitor className="h-4 w-4 text-primary" />
                                                                    System Design
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-[10px] font-bold" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="difficulty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 pl-1">
                                                        Challenge Level
                                                    </FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/50 border-border/50 h-11 sm:h-12 rounded-xl focus:ring-primary focus:border-primary text-xs sm:text-sm font-bold">
                                                                <SelectValue placeholder="Select difficulty" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl sm:rounded-2xl border-border/50 shadow-2xl">
                                                            <SelectItem value="Easy" className="font-bold text-xs sm:text-sm py-2 sm:py-3 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                                    <span>Novice / Entry</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="Medium" className="font-bold text-xs sm:text-sm py-2 sm:py-3 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                                                                    <span>Professional / Mid</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="Hard" className="font-bold text-xs sm:text-sm py-2 sm:py-3 cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                                                                    <span>Veteran / Senior</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-[10px] font-bold" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Step 3: Context & Experience */}
                                <div className="space-y-6 pt-2">
                                    <div className="flex items-center justify-between border-l-4 border-primary pl-4 py-1">
                                        <h2 className="text-lg font-bold">3. Tailor Your Session</h2>
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Recommended</span>
                                    </div>

                                    <div className="space-y-4">
                                        <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pl-1">
                                            Relevant Skills
                                        </FormLabel>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g. React, Docker, Leadership"
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                className="bg-card/50 border-border h-12 rounded-xl focus-visible:ring-primary"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddSkill();
                                                    }
                                                }}
                                            />
                                            <Button type="button" onClick={handleAddSkill} className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all active:scale-95">
                                                Add
                                            </Button>
                                        </div>
                                        {skillsList.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2 p-3 rounded-2xl bg-muted/20 border border-border/30">
                                                {skillsList.map((skill, index) => (
                                                    <div key={index} className="bg-card border border-border shadow-sm px-3 py-1.5 rounded-xl text-xs font-bold text-foreground flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                                        {skill}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSkillsList(skillsList.filter((_, i) => i !== index))}
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3 rotate-45" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground pl-1">
                                                Job Description (Optional)
                                            </FormLabel>
                                            <div className="inline-flex p-1 bg-muted/40 rounded-xl border border-border/50">
                                                <button
                                                    type="button"
                                                    onClick={() => setJobDescriptionType('upload')}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                        jobDescriptionType === 'upload' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    File Upload
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setJobDescriptionType('manual')}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                        jobDescriptionType === 'manual' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    Text Entry
                                                </button>
                                            </div>
                                        </div>

                                        {jobDescriptionType === 'upload' ? (
                                            <div
                                                className={cn(
                                                    "border-2 border-dashed border-border rounded-2xl bg-card/30 p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group relative overflow-hidden",
                                                    isParsing && "opacity-70 pointer-events-none"
                                                )}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept=".pdf,.docx,.txt"
                                                    multiple={false}
                                                />
                                                {form.watch('jobDescription') && typeof form.watch('jobDescription') === 'string' && form.watch('jobDescription').startsWith('Attached file:') ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </div>
                                                        <h3 className="text-sm font-bold mb-1 text-emerald-500">File Attached</h3>
                                                        <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest px-4 truncate max-w-full">
                                                            {form.watch('jobDescription').split('\n')[0].replace('Attached file: ', '')}
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    fileInputRef.current?.click();
                                                                }}
                                                                className="rounded-lg h-9 font-bold text-xs uppercase tracking-widest bg-background"
                                                            >
                                                                Change
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    form.setValue('jobDescription', '');
                                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                                }}
                                                                className="rounded-lg h-9 font-bold text-xs uppercase tracking-widest"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div onClick={() => fileInputRef.current?.click()}>
                                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                                                            {isParsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                                        </div>
                                                        <h3 className="text-sm font-bold mb-1">Upload JD</h3>
                                                        <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest">
                                                            PDF, DOCX up to 5MB
                                                        </p>
                                                        <Button type="button" variant="outline" size="sm" className="rounded-lg h-9 font-bold text-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
                                                            {isParsing ? "Analyzing..." : "Choose File"}
                                                        </Button>
                                                    </div>
                                                )}

                                                {isParsing && (
                                                    <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter text-primary">Intelligence Extraction Active</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="jobDescription"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Paste the job requirements to help AI tailor its questions..."
                                                                className="min-h-[140px] bg-card/50 border-border rounded-xl resize-none focus-visible:ring-primary"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 sm:h-14 text-xs sm:text-base uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                            Starting Session...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                            Start Interview Session
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div >
            <InterviewConflictDialog
                isOpen={conflictDialogOpen}
                onClose={() => setConflictDialogOpen(false)}
                onContinue={handleContinuePrevious}
                onStartNew={handleStartNewAfterAbandon}
                sessionDetails={conflictSession ? {
                    position: conflictSession.position,
                    type: conflictSession.interview_type,
                    startedAt: new Date(conflictSession.created_at).toLocaleString()
                } : null}
            />
        </DashboardLayout >
    );
}

export default function StartInterview() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </DashboardLayout>
        }>
            <StartInterviewContent />
        </Suspense>
    );
}
