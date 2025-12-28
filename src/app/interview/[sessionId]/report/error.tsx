'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

/**
 * Next.js Error Boundary for Report Page
 * Catches catastrophic failures and provides recovery options
 */
export default function ReportError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log error to console for debugging
        console.error('Report page catastrophic error:', error);

        // TODO: Send to error tracking service (Sentry, etc.)
        // logErrorToService(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <Card className="max-w-lg border-red-500 border-2 shadow-xl">
                <CardContent className="p-8 text-center">
                    <div className="mb-6">
                        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                        Something Went Wrong
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We encountered an unexpected error while loading your interview report.
                        This might be a temporary issue.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                        <Button onClick={reset} className="bg-primary hover:bg-primary/90">
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </div>

                    {/* Technical details for debugging */}
                    {error.digest && (
                        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
                                Error ID: {error.digest}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Please include this ID when contacting support
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
