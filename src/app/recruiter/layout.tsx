"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Plus } from "lucide-react";
import { getInitials, getAvatarUrl } from "@/lib/avatar-utils";
import Link from "next/link";

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isAuthPage = pathname === "/recruiter/auth";

    useEffect(() => {
        if (!loading && !user && !isAuthPage) {
            router.replace("/recruiter/auth");
        }
    }, [user, loading, router, isAuthPage]);

    if (loading) return null;

    // If it's the auth page, don't show the dashboard layout
    if (isAuthPage) return <>{children}</>;

    if (!user) return null;

    // Mobile header controls for recruiter
    const headerControls = (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background/60 backdrop-blur-md border border-border/40 p-1 rounded-xl">
                <NotificationBell />
                <ThemeToggle />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-border/50 hover:bg-muted/50 transition-all overflow-hidden">
                        <Avatar className="h-full w-full">
                            <AvatarImage src={getAvatarUrl(user?.user_metadata?.avatar_url, user?.id || 'recruiter')} />
                            <AvatarFallback>{getInitials(user?.user_metadata?.full_name)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl">
                    <div className="px-3 py-2 mb-1 border-b border-border/40">
                        <p className="text-sm font-bold truncate text-foreground">{user?.user_metadata?.full_name || 'Recruiter'}</p>
                        <p className="text-[10px] font-medium truncate text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => router.push('/recruiter/settings')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 border-border/40" />
                    <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/recruiter/campaigns/create">
                <Button className="h-10 px-4 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 group">
                    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    <span className="hidden sm:inline">Create</span>
                </Button>
            </Link>
        </div>
    );

    return (
        <DashboardLayout headerControls={headerControls}>
            <div className="relative z-10">
                {children}
            </div>
        </DashboardLayout>
    );
}
