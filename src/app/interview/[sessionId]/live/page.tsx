"use client";

import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { interviewService, subscriptionService } from "@/services";
import { toast } from "sonner";
import { useInterviewStore } from "@/stores/interviewStore";
import { LiveInterviewSession } from "@/components/agent-playground/LiveInterviewSession";
import { Button } from "@/components/ui/button";
import { ArjunaLoader } from '@/components/ArjunaLoader';
import { useSubscriptionTimer } from "@/hooks/use-subscription-timer"
import { useFeedback } from "@/context/FeedbackContext";
import type { InterviewSession } from "@/services/interview.service";

export default function LiveInterview() {
    const { sessionId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();

    // State
    const [token, setToken] = useState("");
    const [serverUrl, setServerUrl] = useState("");
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [shouldConnect, setShouldConnect] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionStartTime] = useState(Date.now());
    const [session, setSession] = useState<InterviewSession | null>(null);

    const { setCurrentSessionId } = useInterviewStore();
    const currentSessionId = sessionId as string;

    // Guard to prevent multiple onConnected calls
    const hasConnected = useRef(false);

    // Guard to prevent multiple initializations
    const hasInitialized = useRef(false);

    // Track if session is being ended to prevent duplicate redirects
    const isEndingSession = useRef(false);

    // Track current segment timing locally (don't create resumption on connect)
    const sessionSegmentStart = useRef<Date | null>(null);
    const sessionStartTranscriptIndex = useRef<number>(0);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Will be assigned after being defined
    let handleEndSession: () => void;

    // Subscription countdown timer
    const subscriptionTimer = useSubscriptionTimer({
        userId: user?.id,
        onTimeExpired: () => handleEndSession?.(),
        warnAt: [5, 2, 1],
    });

    // Load Session & Token
    useEffect(() => {
        if (authLoading) return;

        // Guard: prevent multiple initializations
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initSession = async () => {
            if (!user?.id || !currentSessionId) {
                toast.error("Invalid session.");
                router.replace("/dashboard");
                return;
            }

            try {
                // 1. Check Usage
                const usageCheck = await subscriptionService.checkUsageLimit(user.id);
                if (usageCheck.hasLimit) {
                    toast.error("Monthly usage limit reached.");
                    router.replace("/pricing");
                    return;
                }

                // 2. Fetch Session
                const fetchedSession = await interviewService.getSessionById(currentSessionId);
                if (!fetchedSession) {
                    toast.warning("Session not found, creating temporary.");
                } else if (fetchedSession.status === "completed") {
                    toast.warning("Session already completed.");
                }

                setCurrentSessionId(currentSessionId);

                // 3. Fetch Token (or use cached)
                let url = "";
                let authToken = "";

                const cachedTokenData = sessionStorage.getItem('livekit_prefetched_token');
                if (cachedTokenData) {
                    try {
                        const { url: cachedUrl, token: cachedToken, timestamp } = JSON.parse(cachedTokenData);
                        if (Date.now() - timestamp < 5 * 60 * 1000) {
                            url = cachedUrl;
                            authToken = cachedToken;
                            sessionStorage.removeItem('livekit_prefetched_token');
                        }
                    } catch (e) {
                        sessionStorage.removeItem('livekit_prefetched_token');
                    }
                }

                if (!authToken) {
                    const tokenUrl = `/api/livekit_token?sessionId=${currentSessionId}`;
                    const resp = await fetch(tokenUrl);
                    if (!resp.ok) throw new Error("Failed to fetch token");
                    const data = await resp.json();
                    url = data.url;
                    authToken = data.token;
                }


                if (fetchedSession) {
                    setSession(fetchedSession);
                }

                setServerUrl(url);
                setToken(authToken);
                // Enable connection after token is ready
                setShouldConnect(true);

            } catch (err) {
                console.error("Initialization error:", err);
                setError("Failed to initialize session");
                setIsSessionLoading(false);
            }
        };

        initSession();
    }, [authLoading, user, currentSessionId, router, setCurrentSessionId]);

    // Handle browser navigation (back button, close tab, etc.)
    useEffect(() => {
        return () => {
            // Fire-and-forget: Start save operations immediately on unmount
            if (sessionSegmentStart.current && !isEndingSession.current) {
                const endTime = new Date();
                const startTime = sessionSegmentStart.current;
                const durationMs = endTime.getTime() - startTime.getTime();
                const durationSeconds = Math.max(1, Math.round(durationMs / 1000)); // Store exact seconds

                console.log(`🔌 Component unmounting, saving resumption: ${durationSeconds} seconds`);

                // Fire all operations without awaiting (they'll complete in background)
                interviewService.getTranscriptCount(currentSessionId).then(endTranscriptIndex => {
                    interviewService.createCompletedResumption(currentSessionId, {
                        resumed_at: startTime.toISOString(),
                        ended_at: endTime.toISOString(),
                        start_transcript_index: sessionStartTranscriptIndex.current,
                        end_transcript_index: endTranscriptIndex,
                        duration_seconds: durationSeconds
                    }).then(() => {
                        console.log(`✅ [cleanup] Resumption record created`);
                    });
                });

                interviewService.getSessionById(currentSessionId).then(session => {
                    if (session) {
                        const newTotalDuration = (session.duration_seconds || 0) + durationSeconds;
                        interviewService.updateSession(currentSessionId, {
                            duration_seconds: newTotalDuration
                        }).then(() => {
                            console.log(`✅ [cleanup] Session duration updated to ${newTotalDuration} seconds`);
                        });

                        subscriptionService.trackUsage(session.user_id, durationSeconds).then(() => {
                            console.log(`✅ [cleanup] Subscription usage tracked`);
                        });
                    }
                });
            }
        };
    }, [currentSessionId]);

    // Handle Session End
    const { generateFeedbackInBackground } = useFeedback();

    // Handle Session End
    handleEndSession = useCallback(async () => {
        // Prevent duplicate calls
        if (isEndingSession.current) return;
        isEndingSession.current = true;
        setIsRedirecting(true); // Show loader immediately

        try {
            console.log("🚀 Ending session intentionally:", currentSessionId);

            let totalDuration = 0;
            const session = await interviewService.getSessionById(currentSessionId);
            if (session) {
                totalDuration = session.duration_seconds || 0;
            }

            // Calculate duration of final segment
            if (sessionSegmentStart.current) {
                const endTime = new Date();
                const startTime = sessionSegmentStart.current;
                const durationMs = endTime.getTime() - startTime.getTime();
                const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

                totalDuration += durationSeconds;

                // Update session total duration
                if (session) {
                    await interviewService.updateSession(currentSessionId, {
                        duration_seconds: totalDuration
                    });

                    // Track usage in subscription for final segment
                    await subscriptionService.trackUsage(session.user_id, durationSeconds);
                    console.log(`✅ Final segment duration: ${durationSeconds} seconds, Total: ${totalDuration} seconds`);
                }
            }

            // Check thresholds: 120s duration and 2 user turns
            const userTurns = await interviewService.getUserTurnCount(currentSessionId);
            const metThreshold = totalDuration >= 120 && userTurns >= 2;

            if (metThreshold) {
                // Complete the session normally
                await interviewService.completeSession(currentSessionId, {});
                console.log("✅ Session completed with threshold met");

                // Trigger BACKGROUND feedback generation
                generateFeedbackInBackground(currentSessionId);
                toast.success("Interview ending. Generating your report...");
            } else {
                // Complete but mark as insufficient
                await interviewService.completeSession(currentSessionId, {
                    feedback: {
                        note: "Insufficient data for report generation",
                        reason: totalDuration < 120 ? "duration_too_short" : "too_few_responses"
                    }
                });
                console.log("⚠️ Session completed but threshold NOT met");
                toast.warning("Session too short for report generation (Min 2 mins & 2 responses required).");
            }

            // Redirect immediately
            router.replace(`/dashboard`);

        } catch (err) {
            console.error("Error ending session:", err);
            // Force redirect to dashboard anyway
            router.replace(`/dashboard`);
        }
    }, [currentSessionId, router, generateFeedbackInBackground]);


    // Error State
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black text-white">
                <div className="p-4 bg-red-900/20 rounded border border-red-500/50">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <Button onClick={() => router.replace('/dashboard')} className="mt-4" variant="destructive">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    if (isRedirecting) {
        return <ArjunaLoader variant="fullscreen" message="Saving results and returning to dashboard..." />;
    }

    // Get initial mic and camera states from URL params
    const initialMicEnabled = searchParams.get('mic') === 'true';
    const initialCameraEnabled = searchParams.get('camera') === 'true';

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={shouldConnect}
            audio={initialMicEnabled}
            video={initialCameraEnabled}
            options={{
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            }}
            className="h-screen w-screen bg-black"
            onError={(err) => {
                console.error("LiveKit Error:", err);
                toast.error(`Connection error: ${err.message}`);
            }}
            onConnected={async () => {
                // Guard to prevent multiple calls
                if (hasConnected.current) return;
                hasConnected.current = true;

                // Room connected successfully
                setIsSessionLoading(false);

                // Track segment start time and transcript position locally (don't create DB record yet)
                sessionSegmentStart.current = new Date();
                const transcriptCount = await interviewService.getTranscriptCount(currentSessionId);
                sessionStartTranscriptIndex.current = transcriptCount;

                console.log(`✅ Segment started at index ${transcriptCount}`);
            }}
            onDisconnected={async () => {
                console.log("🔌 Room disconnected");

                // If we're intentionally ending (user clicked end button), do nothing here
                if (isEndingSession.current) {
                    return;
                }

                // Unexpected disconnection - save resumption record
                try {
                    if (sessionSegmentStart.current) {
                        const endTime = new Date();
                        const startTime = sessionSegmentStart.current;
                        const durationMs = endTime.getTime() - startTime.getTime();
                        const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

                        const endTranscriptIndex = await interviewService.getTranscriptCount(currentSessionId);

                        // Create resumption record for this disconnected segment
                        await interviewService.createCompletedResumption(currentSessionId, {
                            resumed_at: startTime.toISOString(),
                            ended_at: endTime.toISOString(),
                            start_transcript_index: sessionStartTranscriptIndex.current,
                            end_transcript_index: endTranscriptIndex,
                            duration_seconds: durationSeconds
                        });

                        // Update session total duration
                        const session = await interviewService.getSessionById(currentSessionId);
                        if (session) {
                            const newTotalDuration = (session.duration_seconds || 0) + durationSeconds;
                            await interviewService.updateSession(currentSessionId, {
                                duration_seconds: newTotalDuration
                            });

                            // Track usage in subscription
                            await subscriptionService.trackUsage(session.user_id, durationSeconds);
                            console.log(`✅ Resumption saved: ${durationSeconds} seconds, Total: ${newTotalDuration} seconds`);
                        }
                    }
                } catch (error) {
                    console.error("Error saving resumption on disconnect:", error);
                }

                toast.warning("Connection lost. Redirecting to dashboard...");
                router.replace("/dashboard");
            }}
            data-lk-theme="default"
        >
            {isSessionLoading ? (
                <ArjunaLoader variant="fullscreen" message="Connecting to Interview..." />
            ) : (
                <LiveInterviewSession
                    sessionId={currentSessionId}
                    initialTranscripts={(session?.transcript as any) || []}
                    onEndSession={handleEndSession}
                    remainingMinutes={subscriptionTimer.remainingMinutes}
                    remainingSeconds={subscriptionTimer.remainingSeconds}
                    isLowTime={subscriptionTimer.isLowTime}
                    isCriticalTime={subscriptionTimer.isCriticalTime}
                    formatTime={subscriptionTimer.formatTime}
                    initialMicEnabled={initialMicEnabled}
                    initialCameraEnabled={initialCameraEnabled}
                />
            )}
            <RoomAudioRenderer />
            <StartAudio label="Click to enable audio playback" />
        </LiveKitRoom>
    );
}
