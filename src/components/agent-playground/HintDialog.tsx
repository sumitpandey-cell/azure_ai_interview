import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb } from 'lucide-react';

interface HintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hintText: string;
    hintsUsed: number;
}

export function HintDialog({ open, onOpenChange, hintText, hintsUsed }: HintDialogProps) {
    const [, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

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
            <DialogContent className="sm:max-w-2xl border border-amber-500/30 bg-card/98 backdrop-blur-3xl shadow-2xl shadow-amber-500/20 overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/10 rounded-lg pointer-events-none animate-pulse" />

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
                                <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-amber-500 flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Hint Assistance
                                </DialogTitle>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-500/60 mt-1">
                                    Hint #{hintsUsed}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="relative z-10 space-y-6 pt-4">
                    {/* Hint Text */}
                    <div className="p-8 rounded-2xl bg-muted/40 border border-amber-500/10 backdrop-blur-xl shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <p className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
                            {hintText}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 dark:text-black font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.05] active:scale-95"
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            Got it!
                        </Button>
                    </div>

                    {/* Hint Tips */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Use hints wisely • 30s cooldown active</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
