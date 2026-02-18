"use client";

import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { interviewService, subscriptionService } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useInterviewStore } from "@/stores/interviewStore";
import { LiveInterviewSession } from "@/components/agent-playground/LiveInterviewSession";
import { Button } from "@/components/ui/button";
import { PremiumLogoLoader } from '@/components/PremiumLogoLoader';
import { useSubscriptionTimer } from "@/hooks/use-subscription-timer"
import { useFeedback } from "@/context/FeedbackContext";
import type { InterviewSession } from "@/services/interview.service";
import { INTERVIEW_CONFIG } from "@/config/interview-config";
import { TranscriptEntry } from "@/contexts/TranscriptContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useProctoring } from "@/hooks/use-proctoring";

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
    const lastSyncTimeRef = useRef(Date.now());
    const [session, setSession] = useState<InterviewSession | null>(null);
    const isSyncingRef = useRef(false);

    const { setCurrentSessionId } = useInterviewStore();
    const currentSessionId = sessionId as string;

    // Guard to prevent multiple onConnected calls
    const hasConnected = useRef(false);

    // Guard to prevent multiple initializations
    const hasInitialized = useRef(false);

    // Track if session is being ended to prevent duplicate redirects
    const isEndingSession = useRef(false);

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [reconnectCountdown, setReconnectCountdown] = useState(60);
    const countdownInterval = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const { updateInterviewSession, completeInterviewSession } = useOptimizedQueries();

    // Proctoring / Cheating Restrictions
    useProctoring({
        sessionId: currentSessionId,
        userId: user?.id || null,
        enabled: isTimerActive && !isEndingSession.current,
        preventCopyPaste: true,
        preventRightClick: true,
        requireFullscreen: true // Forced fullscreen mode active
    });

    // Shared sync function to avoid duplication
    const syncDuration = useCallback(async (reason: string) => {
        if (isEndingSession.current || isSyncingRef.current) return;

        isSyncingRef.current = true;
        try {
            const now = Date.now();
            const deltaSeconds = Math.round((now - lastSyncTimeRef.current) / 1000);

            if (deltaSeconds >= 1) {
                lastSyncTimeRef.current = now;
                await updateInterviewSession(currentSessionId, {
                    durationSeconds: deltaSeconds
                });
            }
        } catch (err) {
            console.error(`❌ Failed to sync duration (${reason}):`, err);
        } finally {
            isSyncingRef.current = false;
        }
    }, [currentSessionId, updateInterviewSession]);

    // Handle Session End
    const { generateFeedbackInBackground } = useFeedback();

    const handleEndSession = useCallback(async (skipRedirect: boolean = false) => {
        if (!currentSessionId) {
            console.warn("⚠️ [handleEndSession] No sessionId provided, ignoring end call.");
            return;
        }
        if (isEndingSession.current) return;
        isEndingSession.current = true;
        if (!skipRedirect) setIsRedirecting(true);

        try {
            // Calculate final segment duration
            const now = Date.now();
            const deltaSeconds = Math.max(1, Math.round((now - lastSyncTimeRef.current) / 1000));

            // Fetch current session for total duration threshold check
            const session = await interviewService.getSessionById(currentSessionId);
            const totalDuration = (session?.duration_seconds || 0) + deltaSeconds;

            // Track user turns for quality check
            const userTurns = await interviewService.getUserTurnCount(currentSessionId);
            const metThreshold = totalDuration >= INTERVIEW_CONFIG.THRESHOLDS.MIN_DURATION_SECONDS &&
                userTurns >= INTERVIEW_CONFIG.THRESHOLDS.MIN_USER_TURNS;

            // Fetch clean synced transcripts from the store for final persistence
            const { transcripts: storedTranscripts } = useInterviewStore.getState();
            const finalTranscript = storedTranscripts.map(t => ({
                speaker: t.speaker,
                text: t.text,
                timestamp: t.timestamp
            }));

            const completedSession = await completeInterviewSession(currentSessionId, {
                durationSeconds: deltaSeconds,
                transcript: finalTranscript.length > 0 ? (finalTranscript as unknown as Json) : undefined
            });

            if (completedSession) {
                generateFeedbackInBackground(currentSessionId);
                // Don't show "generating report" toast to invited candidates
                if (session?.campaign_id) {
                    toast.success("Interview submitted successfully!");
                } else {
                    if (metThreshold) {
                        toast.success("Interview complete. Generating report...");
                    } else {
                        toast.warning("Session brief. Summary will be generated with score 0.");
                    }
                }
            } else {
                console.error("❌ Failed to complete session - Feedback cannot be generated.");
                toast.error("Failed to save results. You can try manually from your dashboard.");
            }

            if (!skipRedirect) {
                if (session?.campaign_id) {
                    // Campaign/Invited flow
                    router.replace(`/interview/${currentSessionId}/complete?type=campaign`);
                } else {
                    // Student/Practice flow
                    router.replace(`/interview/${currentSessionId}/complete?type=student`);
                }
            }
        } catch (err) {
            console.error("Error ending session:", err);
            if (!skipRedirect) {
                router.replace("/dashboard");
            }
        }
    }, [currentSessionId, router, generateFeedbackInBackground, completeInterviewSession]);

    // Subscription countdown timer
    const subscriptionTimer = useSubscriptionTimer({
        userId: user?.id,
        sessionId: currentSessionId,
        onTimeExpired: () => handleEndSession(),
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
            const guestData = sessionStorage.getItem('arjuna_guest_session');
            const isGuest = guestData ? JSON.parse(guestData).sessionId === currentSessionId : false;

            if (!user?.id && !isGuest) {
                toast.error("Invalid session access.");
                router.replace("/");
                return;
            }

            if (!currentSessionId) {
                toast.error("Session ID missing.");
                router.replace(user ? "/dashboard" : "/");
                return;
            }

            try {
                // 1. Check Usage
                // Prioritize recruiter's balance for campaign-linked sessions
                let billingUserId = user?.id;
                const sessionPreFetch = await interviewService.getSessionById(currentSessionId);

                if (sessionPreFetch && sessionPreFetch.campaign_id) {
                    const { data: campaign } = await supabase
                        .from('hiring_campaigns')
                        .select('created_by')
                        .eq('id', sessionPreFetch.campaign_id)
                        .single();
                    if (campaign && campaign.created_by) {
                        billingUserId = campaign.created_by;
                    }
                }


                if (billingUserId) {
                    const usageCheck = await subscriptionService.checkUsageLimit(billingUserId);
                    if (usageCheck.hasLimit) {
                        toast.error("Usage limit reached.");
                        router.replace(user ? "/pricing" : "/");
                        return;
                    }
                }

                // 2. Fetch Session
                const fetchedSession = await interviewService.getSessionById(currentSessionId);
                if (!fetchedSession) {
                    toast.warning("Session not found.");
                    const guestData = sessionStorage.getItem('arjuna_guest_session');
                    router.replace(guestData ? "/" : "/dashboard");
                    return;
                }

                // Note: The Token API handles re-entry protection via the 'allowEntry' flag.
                // If a user refreshes or re-enters a completed session, the Token API will return 403.

                setCurrentSessionId(currentSessionId);

                // Initialize store with existing transcripts from DB to prevent data loss on refresh
                if (fetchedSession && Array.isArray(fetchedSession.transcript)) {
                    const existingTranscripts = (fetchedSession.transcript as Array<{
                        speaker?: string;
                        role?: string;
                        text?: string;
                        timestamp?: number;
                    }>).map(t => ({
                        speaker: (t.speaker || t.role || 'ai') as 'user' | 'ai',
                        text: t.text || '',
                        timestamp: t.timestamp || Date.now(),
                        isComplete: true
                    }));
                    useInterviewStore.getState().setTranscripts(existingTranscripts);
                } else {
                    useInterviewStore.getState().clearTranscripts();
                }

                // 3. Fetch Token
                let url = "";
                let authToken = "";

                const cachedTokenData = sessionStorage.getItem('livekit_prefetched_token');
                if (cachedTokenData) {
                    try {
                        const { url: cachedUrl, token: cachedToken, expiresAt, timestamp } = JSON.parse(cachedTokenData);
                        const nowSeconds = Math.floor(Date.now() / 1000);

                        // Validate token: must not be expired and must have at least 2 minutes buffer
                        const isValid = expiresAt
                            ? (expiresAt > nowSeconds + 120)
                            : (Date.now() - timestamp < 5 * 60 * 1000);

                        if (isValid) {
                            url = cachedUrl;
                            authToken = cachedToken;
                        } else {
                            // If token expired, clear it
                            sessionStorage.removeItem('livekit_prefetched_token');
                        }
                    } catch (e) {
                        console.error("Error parsing cached token:", e);
                        sessionStorage.removeItem('livekit_prefetched_token');
                    }
                }

                if (!authToken) {
                    console.info("⚠️ Token not found in sessionStorage, attempting to fetch from API...");
                    const tokenResponse = await fetch(`/api/livekit_token?sessionId=${currentSessionId}`);
                    if (tokenResponse.ok) {
                        const data = await tokenResponse.json();
                        url = data.url;
                        authToken = data.token;
                    } else {
                        // This is a re-entry or refresh. Ensure the session is marked as completed in DB if it's still in_progress.
                        if (fetchedSession && fetchedSession.status === 'in_progress') {
                            try {
                                await completeInterviewSession(currentSessionId, {
                                    feedback: {
                                        executiveSummary: "Session terminated due to connection failure. No analysis was generated.",
                                        note: "Session terminated - Token fetch failed",
                                        status: "auto_completed"
                                    },
                                    score: 0
                                });
                            } catch (e) {
                                console.error("Failed to auto-complete session on re-entry:", e);
                            }
                        }

                        toast.error("Session terminated. Re-entry is not allowed.");
                        const guestData = sessionStorage.getItem('arjuna_guest_session');
                        router.push(guestData ? "/" : "/dashboard");
                        return;
                    }
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
    }, [authLoading, user, currentSessionId, router, setCurrentSessionId, completeInterviewSession]);

    const handleReconnect = useCallback(async () => {
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





    // Periodic usage and duration sync
    useEffect(() => {
        if (!isTimerActive || isEndingSession.current) return;

        const syncInterval = setInterval(async () => {
            if (isEndingSession.current) return;

            const now = Date.now();
            const deltaSeconds = Math.round((now - lastSyncTimeRef.current) / 1000);

            // Sync every 30 seconds
            if (deltaSeconds >= 30) {
                await syncDuration("Periodic sync");
            }
        }, 10000); // Check every 10s

        return () => {
            clearInterval(syncInterval);
        };
    }, [isTimerActive, currentSessionId, syncDuration]);

    // Handle mobile browser backgrounding (iOS Safari/Chrome)
    // Force sync when tab visibility changes to prevent inaccurate duration tracking
    useEffect(() => {
        if (!isTimerActive || isEndingSession.current) return;

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // Tab is being hidden/backgrounded - sync immediately
                await syncDuration("Tab backgrounded");
            } else {
                // Tab is being shown/foregrounded - update last sync time
                lastSyncTimeRef.current = Date.now();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isTimerActive, syncDuration]);



    // Handle Window Close/Navigation Cleanup
    useEffect(() => {
        const onBeforeUnload = () => {
            if (!isEndingSession.current && isTimerActive) {
                // Final duration sync fallback
                // We use keepalive if we could, but updateInterviewSession uses supabase client
                // which doesn't natively support keepalive. Still, we trigger it.
                syncDuration("Session interrupted (Unload)");
            }
        };

        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            // This captures SPA navigation (like back button)
            if (!isEndingSession.current && isTimerActive) {
                handleEndSession(true);
            }
        };
    }, [isTimerActive, handleEndSession, currentSessionId, syncDuration]);


    // Error State
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="p-4 bg-destructive/10 rounded border border-destructive/50">
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
        return (
            <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center">
                <PremiumLogoLoader text="Saving results and returning to dashboard..." />
            </div>
        );
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
            className="h-screen w-screen bg-background"
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
            }}
            onDisconnected={() => {
                if (isEndingSession.current) return;

                setIsDisconnected(true);
                setReconnectCountdown(60);
                if (countdownInterval.current) clearInterval(countdownInterval.current);

                countdownInterval.current = setInterval(() => {
                    setReconnectCountdown(prev => {
                        if (prev <= 1) {
                            if (countdownInterval.current) clearInterval(countdownInterval.current);
                            router.replace("/dashboard");
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }}
            data-lk-theme="default"
        >
            {isSessionLoading ? (
                <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center">
                    <PremiumLogoLoader text="Connecting to Interview..." />
                </div>
            ) : (
                <>
                    <LiveInterviewSession
                        sessionId={currentSessionId}
                        userId={user?.id || null}
                        sessionData={session}
                        initialTranscripts={(session?.transcript as unknown as TranscriptEntry[]) || []}
                        onEndSession={handleEndSession}
                        onAgentReady={async () => {
                            if (!isTimerActive) {
                                lastSyncTimeRef.current = Date.now();
                                setIsTimerActive(true);
                            }
                        }}
                        remainingMinutes={subscriptionTimer.remainingMinutes}
                        remainingSeconds={subscriptionTimer.remainingSeconds}
                        isLowTime={subscriptionTimer.isLowTime}
                        isCriticalTime={subscriptionTimer.isCriticalTime}
                        formatTime={subscriptionTimer.formatTime}
                        initialMicEnabled={initialMicEnabled}
                        initialCameraEnabled={initialCameraEnabled}
                        isEnding={isEndingSession.current}
                    />

                    {isDisconnected && (
                        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4">
                            <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
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
                                        <h3 className="text-2xl font-bold text-foreground">Connection Lost</h3>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            Attempting to reconnect... {reconnectCountdown}s
                                        </p>
                                    </div>

                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-destructive transition-all duration-1000 ease-linear"
                                            style={{ width: `${(reconnectCountdown / 60) * 100}%` }}
                                        />
                                    </div>

                                    <div className="flex flex-col w-full gap-3">
                                        <Button
                                            onClick={handleReconnect}
                                            className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl shadow-xl shadow-primary/20"
                                        >
                                            Reconnect Now
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => router.replace("/dashboard")}
                                            className="h-12 text-muted-foreground hover:text-foreground text-sm font-medium"
                                        >
                                            Return to Dashboard
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
