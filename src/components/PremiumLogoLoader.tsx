"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PremiumLogoLoaderProps {
    size?: number;
    logoSize?: number;
    text?: string;
    className?: string;
}

/**
 * PremiumLogoLoader - A professional loading component for assessment states.
 * Features:
 * - Circular animated ring with dual rotation
 * - Pulsing logo container for "living" feel
 * - Professional light/dark mode support
 * - Dynamic dot animation for loading text
 */
export const PremiumLogoLoader: React.FC<PremiumLogoLoaderProps> = ({
    size = 180,
    logoSize = 70,
    text = "Preparing Your Experience",
    className,
}) => {
    const isSmall = size < 100;

    return (
        <div className={cn(
            "flex flex-col items-center justify-center w-full",
            !isSmall && "min-h-[400px] gap-8",
            isSmall && "gap-4",
            className
        )}>
            <div
                className="relative flex items-center justify-center p-8"
                style={{ width: size + 40, height: size + 40 }}
            >
                {/* Outer Decorative Rings - Static/Slow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className="rounded-full border border-primary/5 dark:border-primary/10"
                        style={{ width: size + 20, height: size + 20 }}
                    />
                    <div
                        className="rounded-full border border-primary/10 dark:border-primary/5"
                        style={{ width: size - 20, height: size - 20 }}
                    />
                </div>

                {/* Primary Circular Ring - Rotating (Simplified) */}
                <div
                    className="absolute animate-spin"
                    style={{ width: size, height: size, animationDuration: '3s' }}
                >
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full"
                        fill="none"
                    >
                        {/* Background Track */}
                        <circle
                            cx="50"
                            cy="50"
                            r="48"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-muted-foreground/10"
                        />

                        {/* Main Progress Indicator */}
                        <circle
                            cx="50"
                            cy="50"
                            r="48"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeDasharray="60 100"
                            strokeLinecap="round"
                            className="text-primary opacity-80"
                        />
                    </svg>
                </div>

                {/* Pulse Ring - Simplified to static or very slow opacity transition */}
                <div
                    className="absolute rounded-full bg-primary/5 dark:bg-primary/5"
                    style={{ width: logoSize + 20, height: logoSize + 20 }}
                />

                {/* Logo Container */}
                <div
                    className="relative z-10 p-5 rounded-[2rem] bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-xl flex items-center justify-center text-primary"
                >
                    {/* Subtle Inner Glow */}
                    <div className="absolute inset-0 rounded-[2rem] bg-current opacity-[0.03]" />

                    <div className="relative flex items-center justify-center" style={{ width: logoSize, height: logoSize }}>
                        <Image
                            src="/arjuna_logo.png"
                            alt="Arjuna AI Logo"
                            width={logoSize}
                            height={logoSize}
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

            </div>

            {/* Loading Information */}
            {text && (
                <div className="flex flex-col items-center gap-3 transition-opacity duration-500">
                    <div className="flex flex-col items-center space-y-1">
                        <h3 className="text-xl font-semibold tracking-tight text-foreground/90 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                            {text}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground/60 tracking-wide uppercase">
                            Please wait a moment
                        </p>
                    </div>

                    {/* Animated Progress Dots - Simple CSS */}
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
