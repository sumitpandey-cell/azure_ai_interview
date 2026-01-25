"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

export type PaymentStatus = "success" | "failed" | "pending" | "cancelled" | "error" | "invalid";

interface PaymentStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: PaymentStatus;
    message?: string;
    details?: string;
}

export function PaymentStatusModal({
    isOpen,
    onClose,
    status,
    message,
    details,
}: PaymentStatusModalProps) {
    const config = {
        success: {
            icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
            title: "Payment Successful",
            defaultMessage: "Your subscription has been updated successfully.",
            buttonText: "Go to Dashboard",
            buttonVariant: "default" as const,
        },
        failed: {
            icon: <XCircle className="h-12 w-12 text-rose-500" />,
            title: "Payment Failed",
            defaultMessage: "The transaction was unsuccessful.",
            buttonText: "Try Again",
            buttonVariant: "destructive" as const,
        },
        pending: {
            icon: <Info className="h-12 w-12 text-amber-500" />,
            title: "Payment Pending",
            defaultMessage: "Your payment is being processed by the bank.",
            buttonText: "Understand",
            buttonVariant: "default" as const,
        },
        cancelled: {
            icon: <AlertCircle className="h-12 w-12 text-slate-500" />,
            title: "Payment Cancelled",
            defaultMessage: "You have cancelled the payment process.",
            buttonText: "Close",
            buttonVariant: "outline" as const,
        },
        error: {
            icon: <XCircle className="h-12 w-12 text-rose-500" />,
            title: "Verification Error",
            defaultMessage: "Something went wrong while verifying your payment.",
            buttonText: "Contact Support",
            buttonVariant: "secondary" as const,
        },
        invalid: {
            icon: <AlertCircle className="h-12 w-12 text-rose-500" />,
            title: "Invalid Order",
            defaultMessage: "We couldn't retrieve the details for this transaction.",
            buttonText: "Back to Pricing",
            buttonVariant: "outline" as const,
        },
    };

    const current = config[status] || config.error;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-3xl border-border/50 rounded-3xl p-8">
                <DialogHeader className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-3 rounded-full bg-background border border-border pb-3">
                        {current.icon}
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight text-center">
                        {current.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground font-medium">
                        {message || current.defaultMessage}
                    </DialogDescription>
                </DialogHeader>

                {details && (
                    <div className="mt-4 p-4 rounded-2xl bg-muted/50 border border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Reason from Provider</p>
                        <p className="text-sm font-semibold text-foreground leading-relaxed italic">
                            "{details}"
                        </p>
                    </div>
                )}

                <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button
                        variant={current.buttonVariant}
                        className="w-full h-12 rounded-2xl font-bold transition-all active:scale-95"
                        onClick={onClose}
                    >
                        {current.buttonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
