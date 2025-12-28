import { AlertTriangle, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LowTimeWarningBannerProps {
    remainingMinutes: number;
    variant?: 'dashboard' | 'live';
    onDismiss?: () => void;
}

export function LowTimeWarningBanner({
    remainingMinutes,
    variant = 'dashboard',
    onDismiss,
}: LowTimeWarningBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    const isCritical = remainingMinutes <= 2;
    const isWarning = remainingMinutes <= 5 && remainingMinutes > 2;

    return (
        <div
            className={`relative overflow-hidden rounded-lg border p-4 ${isCritical
                ? 'bg-red-500/10 border-red-500/50 dark:bg-red-950/20 dark:border-red-500/30'
                : 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/20 dark:border-amber-500/30'
                } ${variant === 'live' ? 'backdrop-blur-md' : ''}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'
                        }`}
                >
                    {isCritical ? (
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                    ) : (
                        <Zap className="h-5 w-5" />
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">
                        {isCritical ? (
                            <span className="text-red-600 dark:text-red-400">
                                Critical: Only {remainingMinutes} {remainingMinutes === 1 ? 'minute' : 'minutes'} remaining!
                            </span>
                        ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                                Low Time Warning: {remainingMinutes} minutes left
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                        {isCritical
                            ? 'Your session will end very soon. Upgrade now to continue practicing.'
                            : 'You\'re running low on time. Upgrade to a premium plan for unlimited practice.'}
                    </p>
                    <div className="flex gap-2">
                        <Link href="/pricing">
                            <Button
                                size="sm"
                                className={`h-7 text-xs ${isCritical
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                    }`}
                            >
                                <Zap className="h-3 w-3 mr-1" />
                                Upgrade Now
                            </Button>
                        </Link>
                    </div>
                </div>

                {onDismiss && variant === 'dashboard' && (
                    <button
                        onClick={handleDismiss}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Animated progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
                <div
                    className={`h-full transition-all duration-300 ${isCritical
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-amber-500'
                        }`}
                    style={{
                        width: `${(remainingMinutes / 100) * 100}%`,
                    }}
                />
            </div>
        </div>
    );
}
