"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { campaignService } from "@/services/recruiter/campaign.service";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Rocket, AlertCircle, Clock, Calendar } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import Link from "next/link";

const campaignSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    position: z.string().min(2, "Position must be at least 2 characters").max(100),
    description: z.string().min(10, "Description must be at least 10 characters").max(1000),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
    skills: z.string().optional(),
    expiryDate: z.string().optional(),
    duration: z.number().min(5, "Minimum 5 minutes").max(180, "Maximum 180 minutes").default(60),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CreateCampaign() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const { allowed, remaining_seconds, loading: subLoading } = useSubscription();

    const form = useForm<CampaignFormValues>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            title: "",
            position: "",
            description: "",
            difficulty: "Intermediate",
            skills: "",
            expiryDate: "",
            duration: 60,
        },
    });

    const onSubmit = async (values: CampaignFormValues) => {
        setIsSubmitting(true);
        try {
            const { skills: rawSkills, ...rest } = values;
            await campaignService.createCampaign({
                ...rest,
                skills: rawSkills ? rawSkills.split(',').map(s => s.trim()).filter(s => s !== '') : [],
                maxDuration: values.duration
            });
            toast.success("Campaign created successfully!");
            router.push("/recruiter/campaigns");
        } catch (error) {
            toast.error("Failed to create campaign. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Create New Campaign</h1>
                    <p className="text-slate-500 mt-1">Set up a new hiring flow for your candidates.</p>
                </div>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Q1 Frontend Hiring" {...field} className="rounded-xl h-11" />
                                            </FormControl>
                                            <FormDescription>Internal name for this campaign.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Position / Role</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Senior React Developer" {...field} className="rounded-xl h-11" />
                                            </FormControl>
                                            <FormDescription>The job title candidates will see.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Interview Difficulty</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl h-11">
                                                        <SelectValue placeholder="Select difficulty" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>AI question level.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="skills"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Skills</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    <Input
                                                        placeholder="e.g. React, TypeScript, System Design"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e.target.value);
                                                            setSkills(e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''));
                                                        }}
                                                        className="rounded-xl h-11"
                                                    />
                                                    <div className="flex flex-wrap gap-2">
                                                        {skills.map((skill, i) => (
                                                            <div key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                                                                {skill}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormDescription>Key skills the AI should focus on (comma separated).</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Interview Duration (Minutes)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                        className="rounded-xl h-11 pl-11"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>Minutes allowed for the interview session.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Date (Optional)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        className="rounded-xl h-11 pl-11"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>When this link should stop working.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Description / Context</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Provide details about the role, required skills, and what the interview should cover..."
                                                className="rounded-2xl min-h-[120px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>This context is used by the AI to generate relevant interview questions.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
                                {remaining_seconds <= 0 && !subLoading && (
                                    <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-sm font-medium">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>No interview credits remaining. Please upgrade to launch.</span>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.back()}
                                    className="rounded-xl h-12 px-6"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 gap-2 shadow-lg shadow-indigo-100"
                                    disabled={isSubmitting || subLoading || remaining_seconds <= 0}
                                >
                                    {isSubmitting ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : remaining_seconds <= 0 && !subLoading ? (
                                        "Top-up Required"
                                    ) : (
                                        <>
                                            <Rocket className="h-5 w-5" />
                                            Launch Campaign
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div >
    );
}
