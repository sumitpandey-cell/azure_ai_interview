"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Upload,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2,
    Sparkles,
    ShieldAlert,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import { profileService } from "@/services/profile.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ResumeCheckDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    onContinue: (useResume: boolean) => void;
}

export function ResumeCheckDialog({
    isOpen,
    onOpenChange,
    userId,
    onContinue
}: ResumeCheckDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [resumeData, setResumeData] = useState<{
        url: string | null;
        updatedAt: string | null;
        content: string | null;
    }>({ url: null, updatedAt: null, content: null });

    useEffect(() => {
        if (isOpen && userId) {
            checkResume();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, userId]);

    const checkResume = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from("profiles")
                .select("resume_url, resume_updated_at, resume_content")
                .eq("id", userId)
                .single();

            if (data) {
                setResumeData({
                    url: data.resume_url || null,
                    updatedAt: data.resume_updated_at || null,
                    content: data.resume_content || null
                });
            }
        } catch (error) {
            console.error("Error checking resume:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file");
            return;
        }

        try {
            setUploading(true);
            toast.info("Extracting resume context...");
            const extractedText = await extractTextFromPDF(file);

            const filePath = `${userId}/resume.pdf`;
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath);

            await profileService.updateProfile(userId, {
                resume_url: publicUrl,
                resume_content: extractedText,
                resume_updated_at: new Date().toISOString()
            } as Record<string, unknown>);

            setResumeData({
                url: publicUrl,
                updatedAt: new Date().toISOString(),
                content: extractedText
            });

            toast.success("Resume uploaded! You can now choose to use it for your interview.");
        } catch (error: unknown) {
            toast.error("Upload failed: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-2xl rounded-3xl p-0 overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />

                <div className="p-8 space-y-6">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                resumeData.url ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-500"
                            )}>
                                {resumeData.url ? <Sparkles className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                            </div>
                            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                                {resumeData.url ? "Resume Verification" : "Resume Required"}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {resumeData.url
                                ? "Your resume is active. Choose whether to personalize your interview based on your professional background."
                                : "To provide a high-quality, personalized interview experience, we recommend a resume to generate relevant questions."}
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Scanning Profile...</p>
                        </div>
                    ) : resumeData.url ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-foreground">Resume Detected</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            Last Updated: {resumeData.updatedAt ? new Date(resumeData.updatedAt).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                                <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                    Starting with your resume allows the AI to simulate a real interviewer focusing on your specific skills and achievements.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative group">
                                <label className={cn(
                                    "flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl py-10 px-6 cursor-pointer transition-all",
                                    uploading ? "opacity-50 pointer-events-none" : "hover:border-primary/50 hover:bg-primary/5"
                                )}>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                    ) : (
                                        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                    )}
                                    <h3 className="text-sm font-bold text-foreground">Upload Your Resume</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium mt-1">PDF Format only (Max 5MB)</p>
                                </label>
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-4">You can also manage your documents in settings</p>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/settings')}
                                    className="h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-widest border-border hover:bg-muted group"
                                >
                                    Go to Settings
                                    <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                        {resumeData.url ? (
                            <>
                                <Button
                                    onClick={() => onContinue(false)}
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest"
                                >
                                    Start Without Resume
                                </Button>
                                <Button
                                    onClick={() => onContinue(true)}
                                    disabled={uploading || loading}
                                    className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 group"
                                >
                                    Start With Resume
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={() => onContinue(false)}
                                    variant="ghost"
                                    className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground"
                                >
                                    Skip For Now
                                </Button>
                                <Button
                                    disabled={true}
                                    className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest bg-muted text-muted-foreground"
                                >
                                    Upload First
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
