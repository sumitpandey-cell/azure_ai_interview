"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { interviewService } from "@/services/interview.service";

interface FeedbackContextType {
    isGenerating: boolean;
    feedbackReady: boolean;
    currentSessionId: string | null;
    shouldRefreshDashboard: boolean;
    generateFeedbackInBackground: (sessionId: string, transcripts: any[], sessionData: any) => Promise<void>;
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
    const [feedbackReady, setFeedbackReady] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [shouldRefreshDashboard, setShouldRefreshDashboard] = useState(false);

    const generateFeedbackInBackground = useCallback(async (sessionId: string, transcripts: any[], sessionData: any) => {
        setIsGenerating(true);
        setFeedbackReady(false);
        setCurrentSessionId(sessionId);
        setShouldRefreshDashboard(false);

        // We don't await this promise so the UI can continue immediately
        // However, since this function is async, the caller can choose to await or not.
        // For "background" processing, the caller should NOT await this, or we wrap the logic in a non-awaited promise.

        // Actually, to ensure it runs in "background" from the caller's perspective, 
        // we can just start the process here.

        const processFeedback = async () => {
            console.log("🤖 [Background] Generating AI feedback for session:", sessionId);
            toast.info("Generating AI feedback in background...");

            try {
                // 1. Format transcripts for Gemini
                const formattedTranscripts = transcripts.map((t, index) => ({
                    id: index + 1,
                    sender: t.speaker as 'user' | 'ai',
                    text: t.text
                }));

                // 2. Prepare session context
                const sessionConfig = typeof sessionData.config === 'object' && sessionData.config !== null ? sessionData.config as any : {};
                const sessionContext = {
                    id: sessionData.id,
                    position: sessionData.position,
                    interview_type: sessionData.interview_type,
                    config: {
                        skills: sessionConfig.skills || [],
                        difficulty: sessionConfig.difficulty || 'Intermediate',
                        companyName: sessionConfig.companyName || sessionConfig.company?.name,
                        experienceLevel: sessionConfig.experienceLevel || 'Mid-level',
                        role: sessionConfig.role || sessionData.position,
                        ...sessionConfig
                    }
                };

                // 3. Generate feedback using Gemini (Client-side)
                // Dynamically import to ensure it works on client
                const { generateFeedback } = await import("@/lib/gemini-feedback");
                const feedback = await generateFeedback(formattedTranscripts, sessionContext);

                // 4. Calculate score
                let overallScore = 0;
                if (feedback.skills && Array.isArray(feedback.skills)) {
                    const scores = feedback.skills.map((skill: any) => skill.score || 0);
                    overallScore = Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length);
                } else {
                    overallScore = (feedback as any).overallScore || 0;
                }

                console.log("✅ [Background] Feedback generated:", feedback);

                // 5. Save feedback and transcripts to DB
                const updateData: any = {
                    feedback: feedback,
                    score: overallScore,
                    transcript: transcripts.map((t, index) => ({
                        id: index + 1,
                        speaker: t.speaker,
                        text: t.text,
                        timestamp: t.timestamp
                    }))
                };

                await interviewService.updateSession(sessionId, updateData);
                console.log("💾 [Background] Feedback and transcripts saved to DB");

                setFeedbackReady(true);
                setShouldRefreshDashboard(true);

                toast.success("Interview feedback is ready!", {
                    action: {
                        label: "View Report",
                        onClick: () => window.location.href = `/interview/${sessionId}/report`
                    },
                    duration: 5000,
                });

            } catch (error) {
                console.error("❌ [Background] Error generating feedback:", error);
                toast.error("Feedback generation failed. You can try regenerating it from the report page.");
            } finally {
                setIsGenerating(false);
            }
        };

        // Start the process without awaiting it
        processFeedback();

    }, []);

    const resetFeedbackState = useCallback(() => {
        setFeedbackReady(false);
        setShouldRefreshDashboard(false);
        setCurrentSessionId(null);
    }, []);

    return (
        <FeedbackContext.Provider value={{
            isGenerating,
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
