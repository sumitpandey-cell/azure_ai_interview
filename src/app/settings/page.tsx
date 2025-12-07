"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Type for user metadata
interface UserMetadata {
    full_name?: string;
    avatar_url?: string;
    gender?: string;
}

export default function Settings() {
    const { user } = useAuth();
    const userMetadata = user?.user_metadata as UserMetadata | undefined;

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-8">
                <div>
                    <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
                        Settings
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Manage your account settings and preferences
                    </p>
                </div>

                <Card className="border-none shadow-md bg-card">
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-foreground">{user?.email || 'Not available'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-foreground">{userMetadata?.full_name || 'Not available'}</p>
                        </div>
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground">
                                Backend removed - Ready for fresh implementation of profile updates, avatar management, and preferences
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
