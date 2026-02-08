"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
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

    return (
        <DashboardLayout>
            <div className="relative z-10">
                {children}
            </div>
        </DashboardLayout>
    );
}
