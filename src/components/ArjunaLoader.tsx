import React from 'react';
import { PremiumLogoLoader } from './PremiumLogoLoader';
import { cn } from '@/lib/utils';

/**
 * BowLoader Component - Legacy wrapper, now uses PremiumLogoLoader for consistency
 */
interface BowLoaderProps {
    size?: 'tiny' | 'small' | 'medium' | 'large';
    className?: string;
}

export const BowLoader: React.FC<BowLoaderProps> = ({ size = 'medium', className }) => {
    const sizeMap = {
        tiny: 20,
        small: 60,
        medium: 100,
        large: 180,
    };

    const logoSizeMap = {
        tiny: 10,
        small: 25,
        medium: 40,
        large: 70,
    };

    return (
        <PremiumLogoLoader
            size={sizeMap[size]}
            logoSize={logoSizeMap[size]}
            text=""
            className={cn("min-h-0 py-4", className)}
        />
    );
};

/**
 * ArjunaLoader Component
 * Centralized loading component powered by PremiumLogoLoader
 */
interface ArjunaLoaderProps {
    variant?: 'fullscreen' | 'inline' | 'card';
    message?: string;
    className?: string;
}

export const ArjunaLoader: React.FC<ArjunaLoaderProps> = ({
    variant = 'fullscreen',
    message = 'Calibrating Neural Matrix',
    className
}) => {
    if (variant === 'fullscreen') {
        return (
            <div className={cn("fixed inset-0 bg-background text-foreground z-[9999] flex items-center justify-center overflow-hidden", className)}>
                {/* Background Ambience */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] animate-blob"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 dark:bg-accent/10 rounded-full blur-[120px] animate-blob [animation-delay:2s]"></div>
                </div>

                <PremiumLogoLoader text={message} />
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={cn("bg-card/50 backdrop-blur-sm rounded-2xl p-10 flex flex-col items-center justify-center border border-border/50 shadow-inner relative overflow-hidden", className)}>
                <PremiumLogoLoader size={120} logoSize={50} text={message} className="min-h-0" />
            </div>
        );
    }

    // inline variant
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <PremiumLogoLoader size={60} logoSize={25} text={message} className="min-h-0 flex-row gap-4 py-2" />
        </div>
    );
};

export default ArjunaLoader;
