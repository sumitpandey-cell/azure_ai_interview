"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function InterviewComplete() {
    const router = useRouter();
    const { sessionId } = useParams();

    useEffect(() => {
        // Simulate processing time (e.g., 3 seconds) before redirecting to report
        const timer = setTimeout(() => {
            router.push(`/interview/${sessionId}/report`);
        }, 3000);

        return () => clearTimeout(timer);
    }, [router, sessionId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background font-sans p-4">
            <Card className="w-full max-w-lg p-12 text-center shadow-lg border-none bg-card rounded-2xl">
                <h1 className="text-3xl font-bold text-primary mb-6">Interview Complete</h1>
                <div className="space-y-3 text-muted-foreground mb-10">
                    <p className="text-lg">Thank you for attending the interview.</p>
                    <p className="text-lg">You'll be redirected shortly.</p>
                    <p className="text-sm text-muted-foreground/60 mt-4">Please don't close the tab we're just finalizing everything.</p>
                </div>

                <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-full border-[5px] border-muted border-t-primary border-r-primary animate-spin"></div>
                </div>
            </Card>
        </div>
    );
}
