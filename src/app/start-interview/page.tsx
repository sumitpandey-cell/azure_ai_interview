'use client'
import { useState, useEffect, Suspense } from "react";
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
import { Loader2, Plus, Upload, Sparkles, Play, Briefcase, Clock, FileText, Code, User, Monitor, Building2, Target } from "lucide-react";
import { CompanyTemplate } from "@/types/company-types";
import { useCompanyQuestions } from "@/hooks/use-company-questions";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useInterviewStore } from "@/stores/use-interview-store";
import { interviewService } from "@/services/interview.service";

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
    const { fetchCompanyTemplates } = useOptimizedQueries();
    const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([]);
    const { setCurrentSession } = useInterviewStore();

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

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            setSkillsList([...skillsList, skillInput.trim()]);
            setSkillInput("");
            form.setValue("skills", ""); // Clear the hidden input if we were using one, or just manage state
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) {
            toast.error("You must be logged in to start an interview");
            return;
        }

        setIsLoading(true);
        try {
            // ✅ CHECK FOR EXISTING IN-PROGRESS SESSIONS using service
            const existingSessions = await interviewService.getInProgressSessions(user.id);

            // If there are in-progress sessions, show dialog
            if (existingSessions && existingSessions.length > 0) {
                const previousSession = existingSessions[0];

                const userChoice = window.confirm(
                    `⚠️ You have an incomplete interview!\n\n` +
                    `Position: ${previousSession.position}\n` +
                    `Type: ${previousSession.interview_type}\n` +
                    `Started: ${new Date(previousSession.created_at).toLocaleString()}\n\n` +
                    `Would you like to:\n\n` +
                    `• Click "OK" to CONTINUE the previous interview\n` +
                    `• Click "Cancel" to START NEW (will abandon previous)`
                );

                if (userChoice) {
                    // User wants to continue previous interview
                    toast.info("Redirecting to previous interview...");
                    // Resume from the correct stage
                    const stage = (previousSession.config as any)?.currentStage || 'avatar';
                    router.push(`/interview/${previousSession.id}/${stage}`);
                    setIsLoading(false);
                    return;
                } else {
                    // User wants to start new - mark old session as abandoned
                    const abandonConfirm = window.confirm(
                        `⚠️ Are you sure you want to abandon the previous interview?\n\n` +
                        `This action cannot be undone. The previous interview will be marked as incomplete.`
                    );

                    if (!abandonConfirm) {
                        // User changed their mind
                        setIsLoading(false);
                        return;
                    }

                    // Abandon previous session using service
                    const abandoned = await interviewService.abandonSession(previousSession.id);

                    if (abandoned) {
                        toast.success("Previous interview abandoned. Starting new session...");
                    } else {
                        toast.error("Failed to abandon previous session. Please try again.");
                        setIsLoading(false);
                        return;
                    }
                }
            }

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

            const { data, error } = await supabase.from("interview_sessions").insert({
                user_id: user.id,
                interview_type: values.interviewType,
                position: values.position,
                duration_seconds: 0, // Will be set to actual duration when interview completes
                status: "pending",
                config: {
                    ...config,
                    currentStage: 'avatar' // Initialize with avatar stage
                }
            }).select();

            if (error) throw error;

            if (data && data.length > 0) {
                const session = data[0];

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
            <div className="mx-auto max-w-3xl space-y-8 pb-12">
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm border border-primary/20">
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI-Powered Interview
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Start Practice Interview</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                        Configure your AI-powered interview session with advanced customization options
                    </p>
                </div>

                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <CardContent className="p-8 sm:p-10">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                {/* Interview Mode Selection */}
                                <FormField
                                    control={form.control}
                                    name="interviewMode"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>
                                                Interview Mode <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setInterviewMode(value as 'general' | 'company');
                                                    }}
                                                    defaultValue={field.value}
                                                    className="flex flex-col space-y-2"
                                                >
                                                    <div className="flex items-center space-x-3 space-y-0 rounded-lg border border-input p-4 hover:bg-accent transition-colors">
                                                        <RadioGroupItem value="general" id="general" />
                                                        <Label htmlFor="general" className="flex-1 cursor-pointer">
                                                            <div className="font-medium">General Interview</div>
                                                            <div className="text-sm text-muted-foreground">Practice with domain-based questions</div>
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-3 space-y-0 rounded-lg border border-input p-4 hover:bg-accent transition-colors">
                                                        <RadioGroupItem value="company" id="company" />
                                                        <Label htmlFor="company" className="flex-1 cursor-pointer">
                                                            <div className="font-medium">Company-Specific Interview</div>
                                                            <div className="text-sm text-muted-foreground">Practice with real questions from top companies</div>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Company Selection - Only for company mode */}
                                {interviewMode === 'company' && (
                                    <FormField
                                        control={form.control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    Select Company <span className="text-red-500">*</span>
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
                                                        <SelectTrigger className="bg-background/50 border-input h-12 text-base">
                                                            <SelectValue placeholder="Choose a company" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {companyTemplates.map((company) => (
                                                            <SelectItem key={company.id} value={company.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <span>{company.name}</span>
                                                                    {company.industry && (
                                                                        <span className="text-xs text-muted-foreground">• {company.industry}</span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Role - Only for company mode */}
                                {interviewMode === 'company' && (
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    Target Role
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Software Engineer, Product Manager" className="bg-background/50 border-input h-12 text-base" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Experience Level - Only for company mode */}
                                {interviewMode === 'company' && (
                                    <FormField
                                        control={form.control}
                                        name="experienceLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                    <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                                        <Briefcase className="h-4 w-4" />
                                                    </div>
                                                    Experience Level
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value || "Mid"}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50 border-input h-12 text-base">
                                                            <SelectValue placeholder="Select experience level" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Entry">Entry Level</SelectItem>
                                                        <SelectItem value="Mid">Mid Level</SelectItem>
                                                        <SelectItem value="Senior">Senior Level</SelectItem>
                                                        <SelectItem value="Staff">Staff Level</SelectItem>
                                                        <SelectItem value="Principal">Principal Level</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="interviewType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                Interview Type <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50 border-input h-12 text-base">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Technical">
                                                        <div className="flex items-center gap-2">
                                                            <Code className="h-4 w-4 text-muted-foreground" />
                                                            Technical
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Behavioral">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            Behavioral
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="System Design">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                                            System Design
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                Choose Position
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Senior Frontend Engineer" className="bg-background/50 border-input h-12 text-base" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                                    <Target className="h-4 w-4" />
                                                </div>
                                                Difficulty Level <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50 border-input h-12 text-base">
                                                        <SelectValue placeholder="Select difficulty" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Easy">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <span>Easy</span>
                                                            <span className="text-xs text-muted-foreground ml-2">• Beginner-friendly questions</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                            <span>Medium</span>
                                                            <span className="text-xs text-muted-foreground ml-2">• Intermediate level questions</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Hard">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                            <span>Hard</span>
                                                            <span className="text-xs text-muted-foreground ml-2">• Advanced & challenging questions</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-3">
                                    <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        Select Skills <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a skill (e.g. React, Python)"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            className="bg-background/50 border-input h-12 text-base"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill();
                                                }
                                            }}
                                        />
                                        <Button type="button" onClick={handleAddSkill} className="h-12 w-12 bg-primary hover:bg-primary/90 shadow-sm">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    {skillsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                                            {skillsList.map((skill, index) => (
                                                <div key={index} className="bg-background border border-border px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSkillsList(skillsList.filter((_, i) => i !== index))}
                                                        className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-0.5 hover:bg-destructive/10"
                                                    >
                                                        <Plus className="h-3 w-3 rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                        <div className="p-1.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        Job Description
                                    </FormLabel>
                                    <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setJobDescriptionType('upload')}
                                            className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${jobDescriptionType === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                                        >
                                            Upload File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJobDescriptionType('manual')}
                                            className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${jobDescriptionType === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                                        >
                                            Manual Entry
                                        </button>
                                    </div>

                                    {jobDescriptionType === 'upload' ? (
                                        <div className="border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 p-10 text-center hover:bg-primary/10 transition-colors cursor-pointer group">
                                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <Upload className="h-7 w-7" />
                                            </div>
                                            <h3 className="text-foreground font-semibold mb-1 text-lg">Upload job description file</h3>
                                            <p className="text-muted-foreground text-sm mb-6">PDF or DOCX (Max 5MB)</p>
                                            <Button type="button" variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">Choose File</Button>
                                        </div>
                                    ) : (
                                        <FormField
                                            control={form.control}
                                            name="jobDescription"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Paste or type the job description here..."
                                                            className="min-h-[200px] bg-background/50 border-input resize-none focus-visible:ring-primary"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] hover:shadow-primary/40"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Starting Session...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-5 w-5 fill-current" />
                                            Start Interview Session
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
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
