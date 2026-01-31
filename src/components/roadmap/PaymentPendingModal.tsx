import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PaymentPendingModalProps {
    isOpen: boolean;
    onClose: () => void;
}
export function PaymentPendingModal({ isOpen, onClose }: PaymentPendingModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!user) {
            toast.error("Please sign in to continue");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/payments/roadmap-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: 99,
                    customerName: user.user_metadata?.full_name || user.email?.split('@')[0],
                    customerEmail: user.email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create order");
            }

            const { payment_session_id } = data;

            const { load } = await import("@cashfreepayments/cashfree-js");
            const cashfree = await load({
                mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") || "sandbox",
            });

            if (cashfree) {
                await cashfree.checkout({
                    paymentSessionId: payment_session_id,
                    redirectTarget: "_self", // Redirect to our verify route
                });
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Payment Error:", error);
            toast.error(error.message || "Payment initialization failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-[#0A0A0B] border-white/10 text-slate-200">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center text-white uppercase tracking-tight">
                        Unlock Premium Insights
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-400 font-medium">
                        Your first roadmap was free! Level up with a new personalized strategy.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Premium Roadmap</span>
                            <span className="text-2xl font-black text-white">₹99</span>
                        </div>

                        <div className="h-px bg-white/5 w-full" />

                        <ul className="space-y-3">
                            {[
                                "Hyper-personalized learning path",
                                "AI-driven skill gap analysis",
                                "Targeted interview recommendations",
                                "Curated premium resources"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-2 justify-center py-2 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Secure 128-bit Encryption</span>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:flex-1 h-12 rounded-xl text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px]"
                    >
                        Maybe Later
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full sm:flex-[2] h-12 rounded-xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-white/5"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Unlock for ₹99
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
