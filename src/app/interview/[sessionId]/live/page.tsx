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
import { INTERVIEW_CONFIG } from "@/config/interview-config";

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
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [sessionStartTime] = useState(Date.now());
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [hintsUsed, setHintsUsed] = useState(0);

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
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [reconnectCountdown, setReconnectCountdown] = useState(60);
    const countdownInterval = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    // Will be assigned after being defined
    let handleEndSession: (hintsUsed?: number) => void;

    // Subscription countdown timer
    const subscriptionTimer = useSubscriptionTimer({
        userId: user?.id,
        onTimeExpired: () => handleEndSession?.(hintsUsed),
        warnAt: [5, 2, 1],
        isActive: isTimerActive,
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
                        const { url: cachedUrl, token: cachedToken, expiresAt, timestamp } = JSON.parse(cachedTokenData);
                        const nowSeconds = Math.floor(Date.now() / 1000);

                        // Validate token: must not be expired and must have at least 2 minutes buffer
                        // Fallback to age check if expiresAt is missing (legacy support)
                        const isValid = expiresAt
                            ? (expiresAt > nowSeconds + 120)
                            : (Date.now() - timestamp < 5 * 60 * 1000);

                        if (isValid) {
                            url = cachedUrl;
                            authToken = cachedToken;
                            sessionStorage.removeItem('livekit_prefetched_token');
                            console.log("📦 Using valid prefetched token.");
                        } else {
                            console.log("⚠️ Prefetched token expired or near expiration, fetching fresh.");
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

    const handleReconnect = useCallback(async () => {
        console.log("🔄 Attempting manual reconnection...");
        reconnectAttempts.current += 1;
        setIsDisconnected(false);
        setShouldConnect(false);

        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
        }

        // Delay to allow state transition
        setTimeout(() => {
            setShouldConnect(true);
        }, 300);
    }, []);

    // Provide a stable reference for the setter to prevent effect flickering
    const setRemainingSeconds = subscriptionTimer.setRemainingSeconds;

    // Unified function to save the current segment duration and resumptions
    // This is called by onDisconnected, handleEndSession, or unmount cleanup
    const saveCurrentSegment = useCallback(async (tag: string) => {
        if (!sessionSegmentStart.current) {
            console.log(`ℹ️ [${tag}] No active segment to save.`);
            return 0;
        }

        // Capture values and clear ref synchronously to prevent double-tracking
        const startTime = sessionSegmentStart.current;
        const startIdx = sessionStartTranscriptIndex.current;
        sessionSegmentStart.current = null; // Mark as processed IMMEDIATELY

        const endTime = new Date();
        const durationSeconds = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

        console.log(`🚀 [${tag}] Saving segment via API: ${durationSeconds} seconds`);

        const data = {
            sessionId: currentSessionId,
            durationSeconds,
            startTranscriptIndex: startIdx,
            resumedAt: startTime.toISOString(),
            endedAt: endTime.toISOString()
        };

        try {
            // Use keepalive: true for cleanup/disconnected tags to ensure it finishes even if tab closes
            const useKeepAlive = tag === 'cleanup' || tag === 'onDisconnected';

            const response = await fetch('/api/interview/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: useKeepAlive
            });

            if (!response.ok) {
                throw new Error(`API failed with status ${response.status}`);
            }

            const result = await response.json();

            if (result.alreadyProcessed) {
                console.log(`✅ [${tag}] Segment was already processed (Idempotency skip).`);
                return 0; // Or return the actual duration if available
            }

            if (!result.success) {
                console.error(`❌ [${tag}] Error saving segment via API: ${result.error}`);
                if (result.remainingSeconds !== undefined) {
                    setRemainingSeconds(result.remainingSeconds);
                }
                return durationSeconds; // Still return duration for local tracking if needed
            }

            console.log(`✅ [${tag}] Segment saved successfully via API. Actual duration: ${result.actualDuration}s. Remaining: ${result.remainingSeconds}s.`);
            if (result.remainingSeconds !== undefined) {
                setRemainingSeconds(result.remainingSeconds);
            }
            return result.actualDuration;
        } catch (err) {
            console.error(`❌ [${tag}] Error saving segment via API:`, err);
            return durationSeconds;
        }
    }, [currentSessionId, setRemainingSeconds]);

    // Handle browser navigation (back button, close tab, etc.)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (sessionSegmentStart.current && !isEndingSession.current) {
                // We use a simplified non-async version here because beforeunload doesn't wait
                const startTime = sessionSegmentStart.current;
                const endTime = new Date();
                const durationSeconds = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

                const data = {
                    sessionId: currentSessionId,
                    durationSeconds,
                    startTranscriptIndex: sessionStartTranscriptIndex.current,
                    resumedAt: startTime.toISOString(),
                    endedAt: endTime.toISOString()
                };

                // CRITICAL: keepalive: true ensures the request is sent even if the page is destroyed
                fetch('/api/interview/cleanup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    keepalive: true
                }).catch(err => console.error('Fire-and-forget cleanup failed:', err));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // ONLY track here if it hasn't been tracked already by EndSession or Disconnect
            if (sessionSegmentStart.current && !isEndingSession.current) {
                console.log("🔌 Component unmounting, triggered auto-save");
                saveCurrentSegment("cleanup");
            }
        };
    }, [saveCurrentSegment, currentSessionId]);

    // Handle Session End
    const { generateFeedbackInBackground } = useFeedback();

    // Handle Session End
    handleEndSession = useCallback(async (hintsUsed: number = 0) => {
        // Prevent duplicate calls
        if (isEndingSession.current) return;
        isEndingSession.current = true;
        setIsRedirecting(true); // Show loader immediately

        try {
            console.log("🚀 Ending session intentionally:", currentSessionId);

            // Step 1: Save the final segment
            const lastSegmentDuration = await saveCurrentSegment("handleEndSession");
            console.log(`⏱️ Final segment duration: ${lastSegmentDuration}s`);

            // Step 2: Get the updated total duration
            let totalDuration = 0;
            const session = await interviewService.getSessionById(currentSessionId);
            if (session) {
                totalDuration = session.duration_seconds || 0;
                console.log(`⏱️ Total session duration from DB: ${totalDuration}s`);
            }

            // Check thresholds from config
            const userTurns = await interviewService.getUserTurnCount(currentSessionId);
            const metThreshold = totalDuration >= INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS &&
                userTurns >= INTERVIEW_CONFIG.THRESHOLDS.MIN_USER_TURNS;

            if (metThreshold) {
                // Complete the session normally
                await interviewService.completeSession(currentSessionId, {
                    totalHintsUsed: hintsUsed
                });
                console.log(`✅ Session completed with threshold met, hints used: ${hintsUsed}`);

                // Trigger BACKGROUND feedback generation
                generateFeedbackInBackground(currentSessionId);
                toast.success("Interview ending. Generating your report...");
            } else {
                // Complete but mark as insufficient
                await interviewService.completeSession(currentSessionId, {
                    feedback: {
                        note: "Insufficient data for report generation",
                        reason: totalDuration < INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS ? "duration_too_short" : "too_few_responses"
                    }
                });
                console.log("⚠️ Session completed but threshold NOT met");
                const minMins = Math.ceil(INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS / 60);
                toast.warning(`Session too short for report generation (Min ${minMins} mins & ${INTERVIEW_CONFIG.THRESHOLDS.MIN_USER_TURNS} responses required).`);
            }

            // Redirect immediately
            router.replace(`/dashboard`);

        } catch (err) {
            console.error("Error ending session:", err);
            // Force redirect to dashboard anyway
            router.replace(`/dashboard`);
        }
    }, [currentSessionId, router, generateFeedbackInBackground, saveCurrentSegment]);


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
                // Reset disconnection states
                setIsDisconnected(false);
                if (countdownInterval.current) {
                    clearInterval(countdownInterval.current);
                    countdownInterval.current = null;
                }

                // Guard to prevent multiple calls
                if (hasConnected.current) return;
                hasConnected.current = true;

                // Room connected successfully
                setIsSessionLoading(false);
                console.log(`✅ Room connected. Waiting for agent ready...`);
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
                        await saveCurrentSegment("onDisconnected");
                    }
                } catch (error) {
                    console.error("Error saving resumption on disconnect:", error);
                }

                // Start reconnection window instead of redirecting
                setIsDisconnected(true);
                setReconnectCountdown(60);

                if (countdownInterval.current) clearInterval(countdownInterval.current);

                countdownInterval.current = setInterval(() => {
                    setReconnectCountdown(prev => {
                        if (prev <= 1) {
                            if (countdownInterval.current) clearInterval(countdownInterval.current);
                            toast.error("Reconnection timed out. Ending session.");
                            router.replace("/dashboard");
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                toast.warning("Connection lost. Trying to stabilize...");
            }}
            data-lk-theme="default"
        >
            {isSessionLoading ? (
                <ArjunaLoader variant="fullscreen" message="Connecting to Interview..." />
            ) : (
                <>
                    <LiveInterviewSession
                        sessionId={currentSessionId}
                        userId={user?.id || ""}
                        sessionData={session}
                        initialTranscripts={(session?.transcript as any) || []}
                        onEndSession={handleEndSession}
                        onAgentReady={async () => {
                            // 1. UI Timer: Only start once
                            if (!isTimerActive) {
                                console.log("⏱️ Starting session timer UI - Agent Ready");
                                setIsTimerActive(true);
                            }

                            // 2. Segment Tracking: Resume if we don't have an active segment
                            if (!sessionSegmentStart.current) {
                                console.log("🚀 Starting new usage segment - Agent Ready");
                                sessionSegmentStart.current = new Date();
                                try {
                                    const transcriptCount = await (interviewService as any).getTranscriptCount(currentSessionId);
                                    sessionStartTranscriptIndex.current = transcriptCount;
                                    console.log(`🚀 Usage segment started at index ${transcriptCount}`);
                                } catch (e) {
                                    console.error("Failed to get transcript count, defaulting to 0", e);
                                    sessionStartTranscriptIndex.current = 0;
                                }
                            } else {
                                console.log("ℹ️ Segment tracking already active.");
                            }
                        }}
                        remainingMinutes={subscriptionTimer.remainingMinutes}
                        remainingSeconds={subscriptionTimer.remainingSeconds}
                        isLowTime={subscriptionTimer.isLowTime}
                        isCriticalTime={subscriptionTimer.isCriticalTime}
                        formatTime={subscriptionTimer.formatTime}
                        initialMicEnabled={initialMicEnabled}
                        initialCameraEnabled={initialCameraEnabled}
                        onHintsUpdate={setHintsUsed}
                    />

                    {isDisconnected && (
                        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                            <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full border-4 border-destructive/20 border-t-destructive animate-spin" />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-destructive font-black text-xl">!</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Operational Link Severed</h3>
                                        <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase">
                                            Attempting to stabilize uplink... {reconnectCountdown}s
                                        </p>
                                    </div>

                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-destructive transition-all duration-1000 ease-linear"
                                            style={{ width: `${(reconnectCountdown / 60) * 100}%` }}
                                        />
                                    </div>

                                    <div className="flex flex-col w-full gap-3">
                                        <Button
                                            onClick={handleReconnect}
                                            className="h-12 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                                        >
                                            Force Reconnect Now
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => router.replace("/dashboard")}
                                            className="h-12 text-muted-foreground hover:text-white uppercase tracking-widest text-[10px] font-bold"
                                        >
                                            Return to Headquarters
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <RoomAudioRenderer />
            <StartAudio label="Click to enable audio playback" />
        </LiveKitRoom>
    );
}
