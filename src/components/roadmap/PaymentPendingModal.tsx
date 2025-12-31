'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentPendingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

export function PaymentPendingModal({ isOpen, onClose, onContinue }: PaymentPendingModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Payment Integration Coming Soon
                    </DialogTitle>
                    <DialogDescription>
                        We're working on integrating payment processing for additional roadmaps.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Normally, additional roadmaps cost ₹99 each. However, while we implement
                            Razorpay integration, you can generate additional roadmaps <strong>for free</strong>!
                        </AlertDescription>
                    </Alert>

                    <div className="text-sm text-muted-foreground">
                        <p>What you get:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>AI-generated personalized learning plans</li>
                            <li>Phase-by-phase progression tracking</li>
                            <li>Customized interview recommendations</li>
                            <li>Curated learning resources</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onContinue} className="w-full sm:w-auto">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Continue (Free for Now)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
