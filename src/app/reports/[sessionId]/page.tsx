"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReportRedirect() {
    const params = useParams();
    const router = useRouter();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : params.sessionId?.[0];

    useEffect(() => {
        if (sessionId) {
            // Redirect to the actual report page
            router.replace(`/interview/${sessionId}/report`);
        }
    }, [sessionId, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
