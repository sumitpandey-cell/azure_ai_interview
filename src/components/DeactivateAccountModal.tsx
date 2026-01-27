"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeactivateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
}

export function DeactivateAccountModal({
    isOpen,
    onClose,
    onConfirm,
}: DeactivateAccountModalProps) {
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [reason, setReason] = useState<string>("");

    const handleDeactivate = async () => {
        if (!confirmed) return;

        try {
            setLoading(true);
            await onConfirm(reason || undefined);
            onClose();
        } catch (error) {
            console.error("Error deactivating account:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setConfirmed(false);
            setReason("");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-3xl border-border/50 rounded-3xl p-0 gap-0">
                {/* Fixed Header */}
                <DialogHeader className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
                    <div className="p-2 sm:p-3 rounded-full bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive" />
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-center">
                        Deactivate Your Account?
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground font-medium text-sm">
                        Your account will be temporarily deactivated. You can reactivate it anytime by logging back in.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 px-4 sm:px-6">
                    <div className="space-y-4 sm:space-y-6">
                        {/* What happens section */}
                        <div className="p-3 sm:p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-2 sm:space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                What Happens When You Deactivate
                            </p>
                            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                    <span>Your profile will be hidden from other users</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                    <span>You won&apos;t be able to access your account</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                                    <span className="font-semibold">All your data will be preserved (interviews, badges, credits)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                                    <span className="font-semibold">You can reactivate anytime and get everything back</span>
                                </li>
                            </ul>
                        </div>

                        {/* Optional reason */}
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-xs sm:text-sm font-medium">
                                Why are you leaving? (Optional)
                            </Label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger id="reason" className="h-10 sm:h-11">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="taking_break">Taking a break</SelectItem>
                                    <SelectItem value="not_useful">Not finding it useful</SelectItem>
                                    <SelectItem value="privacy_concerns">Privacy concerns</SelectItem>
                                    <SelectItem value="too_expensive">Too expensive</SelectItem>
                                    <SelectItem value="technical_issues">Technical issues</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Confirmation checkbox */}
                        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-background border border-border">
                            <Checkbox
                                id="confirm"
                                checked={confirmed}
                                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                                className="mt-0.5 flex-shrink-0"
                            />
                            <Label
                                htmlFor="confirm"
                                className="text-xs sm:text-sm font-medium leading-relaxed cursor-pointer"
                            >
                                I understand that my account will be deactivated and I can reactivate it anytime by logging back in
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <DialogFooter className="flex-shrink-0 p-4 sm:p-6 pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        className="w-full h-10 sm:h-12 rounded-2xl font-bold text-sm sm:text-base"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full h-10 sm:h-12 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95"
                        onClick={handleDeactivate}
                        disabled={!confirmed || loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Deactivating...
                            </>
                        ) : (
                            "Deactivate Account"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
