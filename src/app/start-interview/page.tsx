"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Briefcase, User, Code, FileText, Upload, Plus, X, Play } from "lucide-react";
import { toast } from "sonner";

export default function StartInterview() {
    const router = useRouter();
    const [interviewMode, setInterviewMode] = useState("general");
    const [interviewType, setInterviewType] = useState("");
    const [position, setPosition] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [jobDescriptionTab, setJobDescriptionTab] = useState("upload");
    const [jobDescription, setJobDescription] = useState("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput("");
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Please upload a PDF or DOCX file");
                return;
            }
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            setUploadedFile(file);
            toast.success("File uploaded successfully");
        }
    };

    const handleStartInterview = () => {
        // Validation
        if (!interviewType) {
            toast.error("Please select an interview type");
            return;
        }
        if (!position.trim()) {
            toast.error("Please enter a position");
            return;
        }
        if (skills.length === 0) {
            toast.error("Please add at least one skill");
            return;
        }

        // Prepare session data
        const sessionData = {
            type: interviewType,
            position: position,
            skills: skills.join(','),
            mode: interviewMode
        };

        // Save to sessionStorage for persistence
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('interviewSession', JSON.stringify(sessionData));
        }

        toast.success("Proceeding to setup...");

        // Redirect to interview setup page with data
        setTimeout(() => {
            const params = new URLSearchParams(sessionData);
            router.push(`/interview/setup?${params.toString()}`);
        }, 1000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6 pb-8">
                {/* Header */}
                <div>
                    <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
                        Start New Interview
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Configure your interview session with customization options
                    </p>
                </div>

                {/* Main Form Card */}
                <Card className="border-none shadow-lg bg-card">
                    <CardContent className="p-6 space-y-6">
                        {/* Interview Mode */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <Label className="text-base font-semibold">
                                    Interview Mode <span className="text-destructive">*</span>
                                </Label>
                            </div>
                            <RadioGroup value={interviewMode} onValueChange={setInterviewMode}>
                                <div className="space-y-3">
                                    <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${interviewMode === "general"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}>
                                        <RadioGroupItem value="general" id="general" className="mt-1" />
                                        <div className="flex-1">
                                            <Label htmlFor="general" className="font-medium cursor-pointer">
                                                General Interview
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Practice with domain-based questions
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${interviewMode === "company"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}>
                                        <RadioGroupItem value="company" id="company" className="mt-1" />
                                        <div className="flex-1">
                                            <Label htmlFor="company" className="font-medium cursor-pointer">
                                                Company-Specific Interview
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Practice with real questions from top companies
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Interview Type */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <Label className="text-base font-semibold">
                                    Interview Type <span className="text-destructive">*</span>
                                </Label>
                            </div>
                            <Select value={interviewType} onValueChange={setInterviewType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="technical">Technical Interview</SelectItem>
                                    <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                                    <SelectItem value="system-design">System Design</SelectItem>
                                    <SelectItem value="coding">Coding Interview</SelectItem>
                                    <SelectItem value="hr">HR Round</SelectItem>
                                    <SelectItem value="case-study">Case Study</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Choose Position */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <Label htmlFor="position" className="text-base font-semibold">
                                    Choose Position
                                </Label>
                            </div>
                            <Input
                                id="position"
                                placeholder="e.g. Senior Frontend Engineer"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Select Skills */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Code className="h-5 w-5 text-primary" />
                                <Label className="text-base font-semibold">
                                    Select Skills <span className="text-destructive">*</span>
                                </Label>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a skill (e.g. React, Python)"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSkill();
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddSkill}
                                    size="icon"
                                    className="shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {skills.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="px-3 py-1.5 text-sm"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="ml-2 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Job Description */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <Label className="text-base font-semibold">
                                    Job Description
                                </Label>
                            </div>
                            <Tabs value={jobDescriptionTab} onValueChange={setJobDescriptionTab}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="mt-4">
                                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="font-semibold mb-2">Upload job description file</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            PDF or DOCX (Max 5MB)
                                        </p>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            Choose File
                                        </Button>
                                        {uploadedFile && (
                                            <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                                                <span className="text-sm font-medium">{uploadedFile.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setUploadedFile(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="manual" className="mt-4">
                                    <textarea
                                        placeholder="Paste or type the job description here..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="w-full min-h-[200px] p-4 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Start Button */}
                        <Button
                            onClick={handleStartInterview}
                            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                            size="lg"
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Start Interview Session
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
