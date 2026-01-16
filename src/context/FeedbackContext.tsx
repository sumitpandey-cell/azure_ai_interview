"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { interviewService } from "@/services/interview.service";

interface FeedbackContextType {
    isGenerating: boolean;
    progress: number; // 0 to 100
    statusText: string;
    feedbackReady: boolean;
    currentSessionId: string | null;
    shouldRefreshDashboard: boolean;
    generateFeedbackInBackground: (sessionId: string) => Promise<void>;
    resetFeedbackState: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return context;
};

export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [feedbackReady, setFeedbackReady] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [shouldRefreshDashboard, setShouldRefreshDashboard] = useState(false);

    const generateFeedbackInBackground = useCallback(async (sessionId: string) => {
        setIsGenerating(true);
        setProgress(0);
        setStatusText("Preparing report...");
        setFeedbackReady(false);
        setCurrentSessionId(sessionId);
        setShouldRefreshDashboard(false);

        const processFeedback = async () => {
            console.log("🚀 [FeedbackContext] STARTING background feedback generation for:", sessionId);

            try {
                // Generate feedback with progress callback
                const success = await interviewService.generateAllResumptionFeedback(
                    sessionId,
                    (p, text) => {
                        setProgress(p);
                        setStatusText(text);
                    }
                );

                if (success) {
                    console.log("✅ [Background] Feedback generated successfully");
                    setProgress(100);
                    setStatusText("Report ready!");
                    setFeedbackReady(true);
                    setShouldRefreshDashboard(true);

                    // Show success toast with action
                    toast.success("Interview feedback is ready!", {
                        action: {
                            label: "View Report",
                            onClick: () => window.location.href = `/interview/${sessionId}/report`
                        },
                        duration: 5000,
                    });
                } else {
                    console.error("❌ [Background] Feedback generation returned false");
                    toast.error("Feedback generation failed. Please try again from the report page.");
                }

            } catch (error) {
                console.error("❌ [Background] Error generating feedback:", error);
                toast.error("Feedback generation failed due to an error.");
            } finally {
                setIsGenerating(false);
            }
        };

        // Start the process and await it
        await processFeedback();

    }, []);

    const resetFeedbackState = useCallback(() => {
        setFeedbackReady(false);
        setShouldRefreshDashboard(false);
        setCurrentSessionId(null);
        setProgress(0);
        setStatusText("");
    }, []);

    return (
        <FeedbackContext.Provider value={{
            isGenerating,
            progress,
            statusText,
            feedbackReady,
            currentSessionId,
            shouldRefreshDashboard,
            generateFeedbackInBackground,
            resetFeedbackState
        }}>
            {children}
        </FeedbackContext.Provider>
    );
};
