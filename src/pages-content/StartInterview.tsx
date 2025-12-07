"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function StartInterview() {
    const router = useRouter();

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-8">
                <div>
                    <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
                        Start New Interview
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Configure and start your AI-powered interview session
                    </p>
                </div>

                <Card className="border-none shadow-md bg-card">
                    <CardContent className="p-12 text-center">
                        <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2 text-foreground">Interview Setup</h3>
                        <p className="text-muted-foreground mb-6">
                            Configure your interview preferences and start practicing
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Backend removed - Ready for fresh implementation of interview configuration
                        </p>
                        <Button onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
