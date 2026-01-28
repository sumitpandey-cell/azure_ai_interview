"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileUp,
    Download,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profile.service";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import { cn } from "@/lib/utils";

interface ResumeManagerProps {
    userId: string;
}

export function ResumeManager({ userId }: ResumeManagerProps) {
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resumeData, setResumeData] = useState<{
        url: string | null;
        updatedAt: string | null;
        contentPreview: string | null;
    }>({ url: null, updatedAt: null, contentPreview: null });

    useEffect(() => {
        loadResumeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const loadResumeData = async () => {
        try {
            setLoading(true);
            const profile = await profileService.getProfile(userId);
            if (profile) {
                // Cast to Record<string, unknown> for safe access to resume fields
                const data = profile as Record<string, unknown>;
                setResumeData({
                    url: (data.resume_url as string) || null,
                    updatedAt: (data.resume_updated_at as string) || null,
                    contentPreview: data.resume_content ? (data.resume_content as string).substring(0, 200) + "..." : null
                });
            }
        } catch (error) {
            console.error("Error loading resume data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        try {
            setUploading(true);

            // 1. Extract text from PDF locally
            toast.info("Analyzing resume content...");
            const extractedText = await extractTextFromPDF(file);

            if (!extractedText || extractedText.trim().length < 50) {
                toast.warning("We couldn't extract much text from your resume. Please ensure it's not just an image.");
            }

            // 2. Upload to Supabase Storage
            const fileExt = "pdf";
            const filePath = `${userId}/resume.${fileExt}`;

            toast.info("Uploading file to secure storage...");
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 3. Get URL and update Profile
            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath);

            toast.info("Saving to your profile...");
            await profileService.updateProfile(userId, {
                resume_url: publicUrl,
                resume_content: extractedText,
                resume_updated_at: new Date().toISOString()
            } as Record<string, unknown>);

            setResumeData({
                url: publicUrl,
                updatedAt: new Date().toISOString(),
                contentPreview: extractedText.substring(0, 200) + "..."
            });

            toast.success("Resume uploaded and analyzed successfully!");
        } catch (error: unknown) {
            console.error("Resume upload error:", error);
            toast.error((error instanceof Error ? error.message : null) || "Failed to upload resume");
        } finally {
            setUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    const handleDeleteResume = async () => {
        if (!window.confirm("Are you sure you want to remove your resume? This will lose the AI context for future interviews.")) return;

        try {
            setLoading(true);

            // 1. Delete from storage
            const filePath = `${userId}/resume.pdf`;
            await supabase.storage.from('resumes').remove([filePath]);

            // 2. Clear from profile
            await profileService.updateProfile(userId, {
                resume_url: null,
                resume_content: null,
                resume_updated_at: null
            } as Record<string, unknown>);

            setResumeData({ url: null, updatedAt: null, contentPreview: null });
            toast.success("Resume removed successfully");
        } catch (error: unknown) {
            toast.error("Failed to remove resume");
            console.error("Resume deletion error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="border-border shadow-sm">
                <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Synchronizing resume data...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />

            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">Resume Management</CardTitle>
                        <CardDescription>Upload your resume to provide AI with your professional context.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {resumeData.url ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 group">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">Resume Active</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">
                                        Last updated: {new Date(resumeData.updatedAt!).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3 text-muted-foreground hover:text-foreground"
                                    onClick={() => window.open(resumeData.url!, '_blank')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    View
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3 text-destructive hover:bg-destructive/10"
                                    onClick={handleDeleteResume}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-dashed border-border bg-card/50">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">AI Context Preview</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                &quot;{resumeData.contentPreview || "Analyzing content..."}&quot;
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        className={cn(
                            "flex flex-col items-center justify-center border-2 border-dashed border-border py-12 px-6 rounded-2xl transition-colors text-center relative overflow-hidden",
                            uploading ? "bg-muted" : "hover:bg-muted/30 hover:border-primary/50"
                        )}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />

                        <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileUp className="h-8 w-8" />}
                        </div>

                        <div className="space-y-1 relative z-0">
                            <h3 className="text-base font-bold text-foreground">
                                {uploading ? "Processing your resume..." : "Upload your PDF resume"}
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium">
                                {uploading ? "Extracting skills and experience for the AI coach." : "Drag and drop or click to select file"}
                            </p>
                        </div>

                        {!uploading && (
                            <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                <span className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Max size: 5MB</span>
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Format: PDF Only</span>
                            </div>
                        )}

                        {uploading && (
                            <div className="mt-8 w-full max-w-xs space-y-2">
                                <Progress value={undefined} className="h-1" />
                                <p className="text-[10px] font-bold text-primary animate-pulse">Running Neural Extraction...</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex gap-3">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            <strong className="text-primary">Pro Tip:</strong> By uploading your resume, the AI interviewer will automatically tailor questions to your actual experience, making the practice session significantly more realistic and effective.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
