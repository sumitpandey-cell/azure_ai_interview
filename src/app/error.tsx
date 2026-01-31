'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

/**
 * Global Error Boundary for Arjuna AI
 * Catch-all for catastrophic crashes across the application.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log catastrophic error to console
        console.error('💥 Catastrophic Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Decorative Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">

                    {/* Error Icon Area */}
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative flex items-center justify-center w-24 h-24 bg-destructive/10 border border-destructive/20 rounded-full shadow-inner">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tight">
                            Oops! System Failure
                        </h2>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            Arjuna AI encountered an unexpected glitch. Our engineers have been notified.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={reset}
                            className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group"
                        >
                            <RefreshCcw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                            Reload Application
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 h-12 border-border/50 hover:bg-muted font-bold text-sm rounded-xl transition-all"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = 'mailto:support@arjuna.ai'}
                                className="flex-1 h-12 text-muted-foreground hover:text-foreground font-bold text-sm rounded-xl transition-all"
                            >
                                Support
                            </Button>
                        </div>
                    </div>

                    {/* Debug Info (Only if available) */}
                    {error.digest && (
                        <div className="pt-6 border-t border-border/40">
                            <div className="bg-muted/30 rounded-xl p-4 select-all group transition-colors hover:bg-muted/50">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">
                                    Trace Identifier
                                </p>
                                <code className="text-xs font-mono text-foreground font-bold break-all">
                                    {error.digest}
                                </code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
