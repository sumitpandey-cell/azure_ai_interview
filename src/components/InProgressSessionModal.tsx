"use client";

import {
    AlertCircle,
    ArrowRight,
    Clock,
    Sparkles,
    Layout
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
import { useRouter } from "next/navigation";

interface InProgressSessionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    existingSession: {
        id: string;
        position: string;
        created_at: string;
    } | null;
}

export function InProgressSessionModal({
    isOpen,
    onOpenChange,
    existingSession
}: InProgressSessionModalProps) {
    const router = useRouter();

    if (!existingSession) return null;

    const handleResume = () => {
        router.push(`/interview/${existingSession.id}/setup`);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border border-border/50 bg-card dark:bg-card/95 backdrop-blur-2xl rounded-3xl p-0 overflow-hidden shadow-2xl dark:shadow-amber-500/5">

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

                <div className="p-8 space-y-6 relative">


                    <DialogHeader className="space-y-4 text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                                    Active Session Found
                                </DialogTitle>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                                    Domain Constraint
                                </div>
                            </div>
                        </div>
                        <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            You already have an interview in progress for <span className="text-foreground font-bold">{existingSession.position}</span>.
                            To maintain focus and accuracy, we only allow one active session per domain at a time.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 group">

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center">
                                        <Layout className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                                        {existingSession.position}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                                    Started: {new Date(existingSession.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-xl bg-card dark:bg-background/50 border border-border shadow-sm">

                                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                                    <p className="text-xs font-bold text-foreground">Waiting to Resume</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-3">

                            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                Resuming will take you back exactly where you left off. You can complete this session to start a new one later.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest border-border hover:bg-muted transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResume}
                            className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95 group"
                        >
                            Resume Session
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
