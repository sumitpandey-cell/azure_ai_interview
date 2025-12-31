import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock, Play, History } from "lucide-react";

interface InterviewConflictDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    onStartNew: () => void;
    sessionDetails: {
        position: string;
        type: string;
        startedAt: string;
    } | null;
}

export function InterviewConflictDialog({
    isOpen,
    onClose,
    onContinue,
    onStartNew,
    sessionDetails
}: InterviewConflictDialogProps) {
    if (!sessionDetails) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold">Incomplete Interview Found</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base text-muted-foreground">
                        You already have an active interview session for this specific role and type.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="my-6 p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Play className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position & Type</p>
                            <p className="text-sm font-medium">{sessionDetails.position} ({sessionDetails.type})</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Started On</p>
                            <p className="text-sm font-medium">{sessionDetails.startedAt}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm font-semibold">How would you like to proceed?</p>
                    <ul className="space-y-2">
                        <li className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <strong>Continue:</strong> Resume the previous interview
                        </li>
                        <li className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            <strong>Start New:</strong> Abandon old and create a fresh one
                        </li>
                    </ul>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-3">
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onContinue();
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
                    >
                        Continue Interview
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={(e) => {
                            e.preventDefault();
                            onStartNew();
                        }}
                        className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold h-11 mt-0"
                    >
                        Start New
                    </AlertDialogCancel>
                </AlertDialogFooter>

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <span className="sr-only">Close</span>
                </button>
            </AlertDialogContent>
        </AlertDialog>
    );
}
