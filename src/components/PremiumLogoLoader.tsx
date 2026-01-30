"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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

                {/* Primary Circular Ring - Rotating */}
                <motion.div
                    className="absolute"
                    style={{ width: size, height: size }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
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
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="48"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeDasharray="40 100"
                            strokeLinecap="round"
                            className="text-primary"
                            animate={{
                                strokeDashoffset: [0, -250],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Secondary Accent Indicator */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="48"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeDasharray="10 150"
                            strokeLinecap="round"
                            className="text-accent opacity-60"
                            animate={{
                                strokeDashoffset: [0, 250],
                            }}
                            transition={{
                                duration: 3.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </svg>
                </motion.div>

                {/* Pulse Ring - Behind Logo */}
                <motion.div
                    className="absolute rounded-full bg-primary/10 dark:bg-primary/5"
                    style={{ width: logoSize + 20, height: logoSize + 20 }}
                    animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Logo Container */}
                <motion.div
                    className="relative z-10 p-5 rounded-[2rem] bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Subtle Inner Glow */}
                    <div className="absolute inset-0 rounded-[2rem] bg-primary/5 dark:bg-primary/10 animate-pulse" />

                    <div className="relative flex items-center justify-center" style={{ width: logoSize, height: logoSize }}>
                        <Image
                            src="/arjuna_logo.png"
                            alt="Arjuna AI Logo"
                            width={logoSize}
                            height={logoSize}
                            className="object-contain drop-shadow-md"
                            priority
                        />
                    </div>

                    {/* Shine Sweep Effect */}
                    <motion.div
                        className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none"
                    >
                        <motion.div
                            className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent skew-x-12"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                        />
                    </motion.div>
                </motion.div>

                {/* Floating Particles/Dots for added magic */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-primary/40"
                            initial={{
                                x: size / 2,
                                y: size / 2,
                                opacity: 0
                            }}
                            animate={{
                                x: [size / 2, Math.cos((i * 120) * (Math.PI / 180)) * (size / 1.8) + size / 2],
                                y: [size / 2, Math.sin((i * 120) * (Math.PI / 180)) * (size / 1.8) + size / 2],
                                opacity: [0, 0.8, 0],
                                scale: [0.5, 1.5, 0.5]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                delay: i * 0.8,
                                ease: "easeOut"
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Loading Information */}
            {text && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className="flex flex-col items-center space-y-1">
                        <h3 className="text-xl font-semibold tracking-tight text-foreground/90 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                            {text}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground/60 tracking-wide uppercase">
                            Please wait a moment
                        </p>
                    </div>

                    {/* Animated Progress Dots */}
                    <div className="flex gap-2 p-1 px-3 rounded-full bg-muted/50 dark:bg-muted/10 border border-border/50">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3],
                                    backgroundColor: i === 1 ? ["#A855F7", "#FBBF24", "#A855F7"] : undefined
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
