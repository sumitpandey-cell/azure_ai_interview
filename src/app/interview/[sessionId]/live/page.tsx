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
import { ArjunaLoader } from '@/components/ArjunaLoader'

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
    const [timeElapsed, setTimeElapsed] = useState(0);

    const { setCurrentSessionId } = useInterviewStore();
    const currentSessionId = sessionId as string;

    // Timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Guard to prevent multiple onConnected calls
    const hasConnected = useRef(false);

    // Guard to prevent multiple initializations
    const hasInitialized = useRef(false);

    // Format time helper
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Load Session & Token
    useEffect(() => {
        if (authLoading) return;

        // Guard: prevent multiple initializations
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initSession = async () => {
            if (!user?.id || !currentSessionId) {
                toast.error("Invalid session.");
                router.push("/dashboard");
                return;
            }

            try {
                // 1. Check Usage
                const usageCheck = await subscriptionService.checkUsageLimit(user.id);
                if (usageCheck.hasLimit) {
                    toast.error("Monthly usage limit reached.");
                    router.push("/pricing");
                    return;
                }

                // 2. Fetch Session
                const session = await interviewService.getSessionById(currentSessionId);
                if (!session) {
                    toast.warning("Session not found, creating temporary.");
                } else if (session.status === "completed") {
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


    // Handle Timer
    useEffect(() => {
        if (!isSessionLoading && !error) {
            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isSessionLoading, error]);

    // Handle Session End
    const handleEndSession = useCallback(async () => {
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            toast.info("Ending interview session...");
            await interviewService.completeSession(currentSessionId, {
                durationMinutes: Math.ceil(timeElapsed / 60)
            });

            // Update usage
            if (user?.id) {
                await subscriptionService.trackUsage(user.id, Math.ceil(timeElapsed / 60));
            }

            router.push(`/interview/${currentSessionId}/feedback`);

        } catch (err) {
            console.error("Error ending session:", err);
            toast.error("Error saving session data");
            // Force redirect anyway
            router.push(`/interview/${currentSessionId}/feedback`);
        }
    }, [currentSessionId, timeElapsed, user, router]);


    // Error State
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black text-white">
                <div className="p-4 bg-red-900/20 rounded border border-red-500/50">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-4" variant="destructive">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        )
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
            onConnected={() => {
                // Guard to prevent multiple calls
                if (hasConnected.current) return;
                hasConnected.current = true;

                // Room connected successfully
                setIsSessionLoading(false);
            }}
            data-lk-theme="default"
        >
            {isSessionLoading ? (
                <ArjunaLoader variant="fullscreen" message="Connecting to Interview..." />
            ) : (
                <LiveInterviewSession
                    onEndSession={handleEndSession}
                    timeElapsed={timeElapsed}
                    formatTime={formatTime}
                    initialMicEnabled={initialMicEnabled}
                    initialCameraEnabled={initialCameraEnabled}
                />
            )}
            <RoomAudioRenderer />
            <StartAudio label="Click to enable audio playback" />
        </LiveKitRoom>
    );
}
