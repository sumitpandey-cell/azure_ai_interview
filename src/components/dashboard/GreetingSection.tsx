"use client";

import React, { memo } from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    LogOut,
    Sparkles,
    Share2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakIndicator } from "@/components/StreakIndicator";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

import { User } from "@supabase/supabase-js";

interface UserMetadata {
    full_name?: string;
    avatar_url?: string;
    gender?: string;
}

interface GreetingSectionProps {
    user: User | null;
    userMetadata: UserMetadata | undefined;
    authLoading: boolean;
    currentStreak: number;
    onSignOut: () => void;
    onOpenReferralModal: () => void;
}

export const GreetingSection = memo(({
    user,
    userMetadata,
    authLoading,
    currentStreak,
    onSignOut,
    onOpenReferralModal
}: GreetingSectionProps) => {
    const router = useRouter();
    const hours = new Date().getHours();
    const greeting = hours < 12 ? 'Morning' : hours < 18 ? 'Afternoon' : 'Evening';

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/50">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-xs font-medium text-muted-foreground">System Active</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
                    Good {greeting},{' '}
                    {authLoading ? (
                        <Skeleton className="inline-block h-8 w-32 bg-muted/50 align-middle" />
                    ) : (
                        <span className="text-primary">
                            {userMetadata?.full_name?.split(' ')[0] || "User"}
                        </span>
                    )}
                </h1>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Arjuna AI Interview Platform
                </p>
            </div>

            {/* Desktop Header Controls */}
            <div className="hidden lg:flex items-center gap-2 p-1.5 bg-background/60 backdrop-blur-xl border border-border/40 rounded-full shadow-sm">
                <div className="flex items-center gap-1 px-2 border-r border-border/40 h-8">
                    <NotificationBell />
                    <ThemeToggle />
                    <StreakIndicator streak={currentStreak} />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 hover:bg-accent border border-border/40 rounded-full transition-all duration-300 group">
                            <Avatar className="h-8 w-8 border border-border/40 shadow-sm transition-transform group-hover:scale-105">
                                {authLoading ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <>
                                        <AvatarImage src={getAvatarUrl(
                                            userMetadata?.avatar_url,
                                            user?.id || 'user',
                                            'avataaars',
                                            null,
                                            userMetadata?.gender
                                        )} />
                                        <AvatarFallback className="text-xs font-bold">{getInitials(userMetadata?.full_name)}</AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                    {userMetadata?.full_name?.split(' ')[0] || "User"}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground">Account</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1.5 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 mb-1 border-b border-border/40">
                            <p className="text-sm font-bold truncate text-foreground">{userMetadata?.full_name || "User"}</p>
                            <p className="text-[10px] font-medium truncate text-muted-foreground">{user?.email}</p>
                        </div>
                        <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onOpenReferralModal} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
                            <Share2 className="h-4 w-4" />
                            <span>Share App</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 border-border/40" />
                        <DropdownMenuItem onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive">
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
});

GreetingSection.displayName = "GreetingSection";
