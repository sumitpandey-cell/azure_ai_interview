"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes
                refetchOnWindowFocus: false,
            },
        },
    }));

    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/recruiter") ||
        pathname?.startsWith("/settings") ||
        pathname?.startsWith("/interview") ||
        pathname?.startsWith("/reports") ||
        pathname?.startsWith("/campaign") ||
        pathname?.startsWith("/invite") ||
        pathname?.startsWith("/start-interview") ||
        pathname?.startsWith("/roadmap") ||
        pathname?.startsWith("/leaderboard") ||
        pathname?.startsWith("/badges") ||
        pathname?.startsWith("/templates");

    const forcedTheme = isDashboard ? undefined : "light";

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
                forcedTheme={forcedTheme}
            >
                <TooltipProvider>
                    <AuthProvider>
                        <FeedbackProvider>
                            {children}
                            <Toaster />
                            <Sonner />
                        </FeedbackProvider>
                    </AuthProvider>
                </TooltipProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
