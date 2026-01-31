'use client'
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Loader2, Plus, Upload, Sparkles, Play, Briefcase, Code, User, Monitor, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { CompanyTemplate } from "@/types/company-types";
import { ResumeCheckDialog } from "@/components/ResumeCheckDialog";
import { InProgressSessionModal } from "@/components/InProgressSessionModal";


import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useInterviewStore } from "@/stores/use-interview-store";
import { subscriptionService, interviewService } from "@/services";
import { cn } from "@/lib/utils";
import { parseFile } from "@/lib/file-parser";
import { INTERVIEW_CONFIG } from "@/config/interview-config";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
    interviewMode: z.enum(["general", "company"]),
    interviewType: z.string().min(1, "Interview type is required"),
    position: z.string().min(1, "Position is required"),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
    companyId: z.string().optional(),
    role: z.string().optional(),
    experienceLevel: z.string().optional(),
    skills: z.string().optional(),
    jobDescription: z.string().optional(),
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
    const [positionInputType, setPositionInputType] = useState<'select' | 'custom'>('select');
    const [interviewMode, setInterviewMode] = useState<'general' | 'company'>(
        searchParams.get('mode') === 'company' ? 'company' : 'general'
    );
    const [companyTemplate, setCompanyTemplate] = useState<CompanyTemplate | null>(null);
    const { fetchCompanyTemplates, createInterviewSession } = useOptimizedQueries();
    const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([]);
    const { setCurrentSession } = useInterviewStore();
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showResumeCheck, setShowResumeCheck] = useState(false);
    const [showInProgressWarning, setShowInProgressWarning] = useState(false);
    const [existingSession, setExistingSession] = useState<{ id: string, position: string, created_at: string } | null>(null);
    const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: Mode, 2: Details, 3: Context


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            interviewMode: interviewMode,
            interviewType: "Technical", // Set default
            position: companyTemplate?.common_roles?.[0] || "",
            difficulty: "Medium",
            companyId: companyTemplate?.id || "",
            role: "",
            experienceLevel: "Mid", // Set default
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
            // Use the file parser utility for all file types
            const text = await parseFile(file);
            form.setValue('jobDescription', `Attached file: ${file.name}\n${text}`);
            toast.success("Job description extracted successfully", { id: toastId });
        } catch (error) {
            console.error("Error reading file:", error);
            toast.error("Failed to read file", { id: toastId });
        } finally {
            setIsParsing(false);
        }
    };

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            const newSkill = skillInput.trim();
            // Sanitize skill (allow only alphanumeric, spaces, and dashes)
            const sanitizedSkill = newSkill.replace(/[^a-zA-Z0-9\s-]/g, '');

            if (!sanitizedSkill) {
                toast.error("Invalid skill name");
                return;
            }

            const lowerSkills = skillsList.map(s => s.toLowerCase());
            if (lowerSkills.includes(sanitizedSkill.toLowerCase())) {
                toast.error("Skill already added");
                setSkillInput("");
                return;
            }

            setSkillsList([...skillsList, sanitizedSkill]);
            setSkillInput("");
        }
    };

    const handleRoleSelection = (role: string) => {
        const suggestedSkills = ROLE_SKILLS[role] || [];
        if (suggestedSkills.length > 0) {
            // Replace existing skills with suggested ones for the new role
            setSkillsList(suggestedSkills);

            toast.success(`Suggested skills updated for ${role}`, {
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
            // Check balance threshold from config
            const usage = await subscriptionService.checkUsageLimit(user.id);
            if (usage.remainingSeconds < INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS) {
                const minMins = Math.ceil(INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS / 60);
                toast.error("Insufficient balance", {
                    description: `You need at least ${minMins} minutes of interview time to start a new session.`,
                    action: {
                        label: "Upgrade",
                        onClick: () => router.push("/pricing")
                    }
                });
                setIsLoading(false);
                return;
            }

            // 1. Check for existing in-progress sessions for the same domain
            const inProgressSessions = await interviewService.getInProgressSessions(user.id);

            const duplicateSession = inProgressSessions?.find((s: { position?: string; id: string; created_at: string }) =>
                s.position?.toLowerCase() === values.position?.toLowerCase()
            );

            if (duplicateSession) {
                setExistingSession({
                    id: duplicateSession.id,
                    position: duplicateSession.position || values.position,
                    created_at: duplicateSession.created_at
                });
                setShowInProgressWarning(true);
                setIsLoading(false);
                return;
            }


            setPendingValues(values);
            setShowResumeCheck(true);
        } catch (error) {
            console.error("Error in onSubmit:", error);
            toast.error("Failed to process request");
            setIsLoading(false);
        }
    };


    const handleResumeContinue = async (useResume: boolean) => {
        if (!pendingValues) return;
        setShowResumeCheck(false);
        await executeStartInterview(pendingValues, useResume);
    };


    const executeStartInterview = async (values: z.infer<typeof formSchema>, useResume: boolean) => {
        try {
            // Continue with creating new session
            const config: Record<string, unknown> = {
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

            // CREATE NEW SESSION USING OPTIMIZED HOOK
            const session = await createInterviewSession({
                position: values.position,
                interview_type: values.interviewType,
                difficulty: values.difficulty,
                jobDescription: values.jobDescription,
                config: {
                    ...config,
                    useResume,
                    currentStage: 'setup' // Initialize with setup stage
                }
            });

            if (session) {
                // Store complete session data in Zustand for immediate access
                setCurrentSession({
                    id: session.id,
                    user_id: session.user_id,
                    position: session.position,
                    interview_type: session.interview_type,
                    status: session.status,
                    config: (session.config as Record<string, unknown>) || {},
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

    const nextStep = async () => {
        // Validate fields before moving to next step
        if (currentStep === 1) {
            // No strict validation needing trigger for mode selection as it has default
            setCurrentStep(2);
        } else if (currentStep === 2) {
            const valid = await form.trigger([
                'interviewType',
                'position',
                'difficulty',
                'companyId',
                'role',
                'experienceLevel'
            ]);
            if (valid) setCurrentStep(3);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-2xl px-4 py-8 h-full flex flex-col justify-center min-h-[80vh]">

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            currentStep >= step ? "w-8 bg-primary" : "w-2 bg-muted"
                        )} />
                    ))}
                </div>

                <div className="text-center space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {currentStep === 1 ? "Select Interview Mode" : currentStep === 2 ? "Configure Session" : "Tailor Experience"}
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        {currentStep === 1 ? "Choose how you want to practice today." : currentStep === 2 ? "Set the parameters for your mock interview." : "Add context to make it relevant."}
                    </p>
                </div>


                <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-2xl rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                    <CardContent className="p-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-6"
                                        >
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
                                                                className="grid grid-cols-1 gap-4"
                                                            >
                                                                {['general', 'company'].map((mode) => (
                                                                    <div
                                                                        key={mode}
                                                                        className={cn(
                                                                            "relative flex items-center space-x-4 rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                                                                            field.value === mode
                                                                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                                                : "border-border bg-background hover:border-primary/30"
                                                                        )}
                                                                        onClick={() => {
                                                                            field.onChange(mode);
                                                                            setInterviewMode(mode as 'general' | 'company');
                                                                        }}
                                                                    >
                                                                        <div className={cn(
                                                                            "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                                            field.value === mode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                                        )}>
                                                                            {mode === 'general' ? <Code className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="font-bold text-foreground text-lg capitalize">{mode} Interview</div>
                                                                            <div className="text-xs text-muted-foreground mt-1 font-medium">
                                                                                {mode === 'general' ? "Standard practice for core skills." : "Simulate top-tier tech company rounds."}
                                                                            </div>
                                                                        </div>
                                                                        <RadioGroupItem value={mode} id={mode} className="sr-only" />
                                                                        {field.value === mode && (
                                                                            <CheckCircle2 className="h-6 w-6 text-primary animate-in zoom-in spin-in-90 duration-300" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 gap-6">
                                                {/* Logic for Company/General Fields (Same as before but grid layout) */}
                                                {interviewMode === 'company' ? (
                                                    <>
                                                        <FormField
                                                            control={form.control}
                                                            name="companyId"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold">Target Company</FormLabel>
                                                                    <Select onValueChange={(v) => {
                                                                        field.onChange(v);
                                                                        const selected = companyTemplates.find(c => c.id === v);
                                                                        setCompanyTemplate(selected || null);
                                                                    }} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-12 rounded-xl bg-background border-border/60"><SelectValue placeholder="Select Company" /></SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {companyTemplates.map((c) => (
                                                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="role"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold">Target Role</FormLabel>
                                                                    <Select onValueChange={(v) => { field.onChange(v); handleRoleSelection(v); }} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-12 rounded-xl bg-background border-border/60"><SelectValue placeholder="Select Role" /></SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {COMMON_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </>
                                                ) : (
                                                    <FormField
                                                        control={form.control}
                                                        name="position"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <FormLabel className="font-semibold">Target Position</FormLabel>
                                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setPositionInputType(positionInputType === 'select' ? 'custom' : 'select')} className="h-6 text-[10px] uppercase font-bold text-primary">
                                                                        {positionInputType === 'select' ? "Type Manually" : "Select from list"}
                                                                    </Button>
                                                                </div>

                                                                {positionInputType === 'select' ? (
                                                                    <Select onValueChange={(v) => { field.onChange(v); handleRoleSelection(v); }} value={field.value || ""}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-12 rounded-xl bg-background border-border/60"><SelectValue placeholder="Select Position" /></SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {COMMON_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <FormControl>
                                                                        <Input {...field} className="h-12 rounded-xl bg-background border-border/60" placeholder="e.g. Senior Frontend Engineer" />
                                                                    </FormControl>
                                                                )}
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="interviewType"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold">Type</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 rounded-xl bg-background border-border/60"><SelectValue placeholder="Type" /></SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Technical">Technical</SelectItem>
                                                                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                                                                        <SelectItem value="System Design">System Design</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="difficulty"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold">Difficulty</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 rounded-xl bg-background border-border/60"><SelectValue placeholder="Level" /></SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Easy">Easy</SelectItem>
                                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                                        <SelectItem value="Hard">Hard</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-4">
                                                <Label className="font-semibold">Skills (Optional)</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={skillInput}
                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                        placeholder="Add key skills..."
                                                        className="h-12 rounded-xl bg-background border-border/60"
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                                    />
                                                    <Button type="button" onClick={handleAddSkill} className="h-12 rounded-xl px-6">Add</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                    {skillsList.map((skill, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                                            {skill}
                                                            <button type="button" onClick={() => setSkillsList(skillsList.filter((_, idx) => idx !== i))}><Plus className="h-3 w-3 rotate-45" /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="font-semibold">Job Description / Context (Optional)</Label>
                                                {jobDescriptionType === 'upload' ? (
                                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-center h-40">
                                                        <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt" />
                                                        {form.watch('jobDescription')?.startsWith('Attached file:') ? (
                                                            <div className="text-emerald-500 font-bold flex flex-col items-center">
                                                                <CheckCircle2 className="h-8 w-8 mb-2" />
                                                                <span className="text-sm">File Attached</span>
                                                                <span className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{form.watch('jobDescription')?.split('\n')[0].replace('Attached file: ', '')}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {isParsing ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                                                                <span className="text-sm font-medium text-foreground">Click to upload JD</span>
                                                                <span className="text-xs text-muted-foreground">PDF, DOCX, TXT</span>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Textarea
                                                        {...form.register('jobDescription')}
                                                        placeholder="Paste job requirements here..."
                                                        className="min-h-[160px] rounded-xl bg-background border-border/60 resize-none p-4"
                                                    />
                                                )}
                                                <div className="flex justify-center">
                                                    <button type="button" onClick={() => setJobDescriptionType(jobDescriptionType === 'upload' ? 'manual' : 'upload')} className="text-xs font-bold text-primary hover:underline">
                                                        Switch to {jobDescriptionType === 'upload' ? 'Manual Entry' : 'File Upload'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation Actions */}
                                <div className="flex items-center justify-between pt-4 mt-8 border-t border-border/40">
                                    {currentStep > 1 ? (
                                        <Button type="button" variant="ghost" onClick={prevStep} className="gap-2 h-12 rounded-xl text-muted-foreground hover:text-foreground">
                                            <ArrowLeft className="h-4 w-4" /> Back
                                        </Button>
                                    ) : (
                                        <div />
                                    )}

                                    {currentStep < 3 ? (
                                        <Button type="button" onClick={nextStep} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                            Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isLoading} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all min-w-[160px]">
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Start Session <Play className="ml-2 h-4 w-4 fill-current" /></>}
                                        </Button>
                                    )}
                                </div>

                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div >

            {user?.id && (
                <>
                    <ResumeCheckDialog
                        isOpen={showResumeCheck}
                        onOpenChange={setShowResumeCheck}
                        userId={user.id}
                        onContinue={handleResumeContinue}
                    />
                    <InProgressSessionModal
                        isOpen={showInProgressWarning}
                        onOpenChange={setShowInProgressWarning}
                        existingSession={existingSession}
                    />
                </>
            )}

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
