'use client';

import { useState, useEffect } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

interface SessionFeedbackProps {
    sessionId: string;
}

export function SessionFeedback({ sessionId }: SessionFeedbackProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkFeedback() {
            if (!sessionId || !user) return;
            try {
                // Check if user has dismissed this specific session's feedback
                const dismissed = localStorage.getItem(`feedback-dismissed-${sessionId}`);

                const { data: existingFeedback } = await (supabase
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .from('session_feedback' as any) as any)
                    .select('id, rating, comment')
                    .eq('session_id', sessionId)
                    .maybeSingle();

                if (existingFeedback) {
                    setIsSubmitted(true);
                    setIsOpen(false);
                } else if (dismissed !== 'true') {
                    // Show popup after a small delay if not dismissed and not submitted
                    const timer = setTimeout(() => setIsOpen(true), 2000);
                    return () => clearTimeout(timer);
                }
            } catch (err) {
                console.error('Error checking feedback:', err);
            } finally {
                setLoading(false);
            }
        }

        checkFeedback();
    }, [sessionId, user]);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('session_feedback' as any) as any)
                .upsert({
                    session_id: sessionId,
                    user_id: user?.id,
                    rating,
                    comment
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);

            if (error) throw error;

            setIsSubmitted(true);
            toast.success('Thank you for your feedback!');
            setTimeout(() => setIsOpen(false), 1500);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem(`feedback-dismissed-${sessionId}`, 'true');
    };

    if (loading || isSubmitted) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleDismiss();
        }}>
            <DialogContent className="w-[92vw] max-w-md bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl sm:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                    <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
                            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">How did we do?</DialogTitle>
                            <DialogDescription className="text-muted-foreground uppercase tracking-widest text-[9px] sm:text-[10px] font-bold">
                                Your feedback helps ArjunaAi grow stronger
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    onMouseEnter={() => setHoverRating(s)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(s)}
                                    className="p-1 transition-transform active:scale-90 hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "h-8 w-8 sm:h-10 sm:w-10 transition-all duration-300",
                                            (hoverRating || rating) >= s
                                                ? "fill-primary text-primary filter drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                                                : "text-muted-foreground/20"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="w-full space-y-3 sm:space-y-4">
                            <Textarea
                                placeholder="Share your experience (Optional)..."
                                className="min-h-[100px] sm:min-h-[120px] bg-muted/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:ring-primary/20 transition-all resize-none text-sm placeholder:text-muted-foreground/50 border-none ring-1 ring-border/50 focus:ring-2"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={rating === 0 || isSubmitting}
                                className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary hover:opacity-95 font-bold uppercase tracking-widest text-[11px] sm:text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Submit Feedback
                                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
