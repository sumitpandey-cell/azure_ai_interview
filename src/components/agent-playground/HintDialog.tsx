import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hintText: string;
    hintsUsed: number;
}

export function HintDialog({ open, onOpenChange, hintText, hintsUsed }: HintDialogProps) {
    const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (open) {
            // Auto-dismiss after 60 seconds
            const timer = setTimeout(() => {
                onOpenChange(false);
            }, 60000);
            setAutoCloseTimer(timer);

            return () => {
                if (timer) clearTimeout(timer);
            };
        }
    }, [open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl border border-amber-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 backdrop-blur-3xl shadow-2xl shadow-amber-500/10">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 rounded-lg pointer-events-none animate-pulse" />

                <DialogHeader className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
                                    <Zap className="h-6 w-6 text-amber-500" />
                                </div>
                                {/* Glow rings */}
                                <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-xl animate-ping" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-amber-500 flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Lifeline Activated
                                </DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/60 mt-1">
                                    Hint #{hintsUsed}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 rounded-lg hover:bg-white/5"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative z-10 space-y-6 pt-4">
                    {/* Hint Text */}
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-amber-500/20 backdrop-blur-xl shadow-inner">
                        <p className="text-base font-bold text-foreground/90 leading-relaxed">
                            {hintText}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            Got it!
                        </Button>
                    </div>

                    {/* Hint Tips */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                        <div className="h-1 w-1 rounded-full bg-amber-500/40" />
                        <span>Use hints wisely • Cooldown: 30s between hints</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
