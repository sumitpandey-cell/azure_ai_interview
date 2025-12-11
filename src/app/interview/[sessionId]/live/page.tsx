"use client";

import { Room, RoomEvent, Track } from "livekit-client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Mic,
    MicOff,
    PhoneOff,
    MessageSquare,
    X,
    User,
    Video,
    VideoOff,
    Brain
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { interviewService, subscriptionService, badgeService, profileService, notificationService } from "@/services";
import { toast } from "sonner";
import { useInterviewStore } from "@/stores/interviewStore";
import { useFeedback } from "@/context/FeedbackContext";
import { useSearchParams } from "next/navigation";

export default function LiveInterview() {
    const { sessionId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [status, setStatus] = useState("Connecting...");
    const [error, setError] = useState<string | null>(null);

    // Use Zustand store for transcripts and feedback
    const {
        transcripts,
        addTranscript,
        updateLastTranscript,
        clearTranscripts,
        setRecentFeedback,
        setCurrentSessionId
    } = useInterviewStore();

    const { generateFeedbackInBackground } = useFeedback();
    const searchParams = useSearchParams();

    const [isMuted, setIsMuted] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [userVideoStream, setUserVideoStream] = useState<MediaStream | null>(null);

    // Database tracking
    const currentSessionId = sessionId as string;
    const [sessionData, setSessionData] = useState<any>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const sessionStartTime = useRef<number>(Date.now());

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<Room | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const isIntentionalDisconnect = useRef(false);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                handleMuteToggle();
            } else if (e.ctrlKey && e.code === 'KeyE') {
                e.preventDefault();
                handleEndCall();
            } else if (e.ctrlKey && e.code === 'KeyT') {
                e.preventDefault();
                setShowTranscript(!showTranscript);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMuted, showTranscript]);

    // Setup camera stream
    useEffect(() => {
        let stream: MediaStream | null = null;

        const setupCamera = async () => {
            if (cameraEnabled) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: 1280,
                            height: 720,
                            facingMode: 'user'
                        }
                    });
                    setUserVideoStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    console.log("✓ Camera stream started");
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setCameraEnabled(false);
                    toast.error("Failed to access camera");
                }
            } else {
                // Clean up existing stream when camera is disabled
                setUserVideoStream((prevStream) => {
                    if (prevStream) {
                        prevStream.getTracks().forEach(track => track.stop());
                        console.log("✓ Camera stream stopped");
                    }
                    return null;
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        };

        setupCamera();

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                console.log("🧹 Camera stream cleanup");
            }
        };
    }, [cameraEnabled]); // Only depend on cameraEnabled, not userVideoStream

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch existing session or handle missing session
    useEffect(() => {
        if (authLoading) return;

        const fetchSession = async () => {
            if (!user?.id || !currentSessionId) {
                console.error("❌ No user or session ID found");
                toast.error("Invalid session. Redirecting to dashboard.");
                router.push("/dashboard");
                return;
            }

            try {
                // Check usage limit first
                const usageCheck = await subscriptionService.checkUsageLimit(user.id);
                console.log('🔍 Usage check result:', usageCheck);

                if (usageCheck.hasLimit) {
                    console.warn('⚠️ User has reached limit:', usageCheck);
                    toast.error("You've reached your monthly usage limit. Please upgrade your plan.");
                    router.push("/pricing");
                    return;
                }

                console.log('✅ User has remaining minutes:', usageCheck.remainingMinutes);

                // Fetch existing session
                const session = await interviewService.getSessionById(currentSessionId);

                if (!session) {
                    console.warn("⚠️ Session not found:", currentSessionId);
                    toast.warning("Session not found, but continuing with live interview.");
                    // Create a temporary session data for the interview
                    setSessionData({
                        id: currentSessionId,
                        interview_type: "live",
                        position: "Software Engineer",
                        status: "in_progress",
                        config: {}
                    });
                } else {
                    if (session.status === "completed") {
                        console.warn("⚠️ Session is completed:", session.status);
                        toast.warning("This session was previously completed, but you can continue.");
                    } else if (session.status !== "in_progress") {
                        console.warn("⚠️ Session is not in progress:", session.status);
                        toast.warning("Session status is unusual, but continuing with interview.");
                    }

                    setSessionData(session);
                    console.log("✓ Interview session loaded:", session.id);
                }
            } catch (error) {
                console.error("❌ Error fetching interview session:", error);
                toast.error("Failed to load interview session. Redirecting to dashboard.");
                router.push("/dashboard");
            } finally {
                setLoadingSession(false);
            }
        };

        fetchSession();
    }, [user, router, currentSessionId, authLoading]);

    // Initialize Zustand store with current session ID
    useEffect(() => {
        if (currentSessionId) {
            setCurrentSessionId(currentSessionId);
            // Clear any previous transcripts when starting a new session
            clearTranscripts();
        }
    }, [currentSessionId, setCurrentSessionId, clearTranscripts]);

    // Mark session as in_progress when live interview starts
    // This prevents users from navigating back to setup page
    useEffect(() => {
        const markSessionInProgress = async () => {
            if (!currentSessionId || !sessionData) return;

            try {
                // Only update if session is not already in progress or completed
                if (sessionData.status !== 'in_progress' && sessionData.status !== 'completed') {
                    await interviewService.updateSession(currentSessionId, { status: 'in_progress' });
                    console.log("✓ Session marked as in_progress");
                }
            } catch (error) {
                console.error("❌ Error updating session status:", error);
                // Don't block the interview if this fails
            }
        };

        markSessionInProgress();
    }, [currentSessionId, sessionData]);

    // Connect video stream to video element
    useEffect(() => {
        if (videoRef.current && userVideoStream) {
            videoRef.current.srcObject = userVideoStream;
            console.log("✓ Video stream connected to video element");
        }
    }, [userVideoStream]);

    // Prevent accidental exit - Back button & Browser close/refresh
    useEffect(() => {
        let isNavigatingAway = false;
        let hasShownConfirmation = false;

        // Push a dummy state to detect back button
        window.history.pushState({ page: 'interview' }, '', window.location.href);

        // Handle browser back button
        const handlePopState = async (e: PopStateEvent) => {
            if (hasShownConfirmation) return;
            hasShownConfirmation = true;

            const confirmLeave = window.confirm(
                "⚠️ Are you sure you want to leave the interview?\n\n" +
                "Your progress will be saved and you can continue later from the dashboard."
            );

            if (!confirmLeave) {
                // User cancelled - stay on page
                hasShownConfirmation = false;
                // Push state again to prevent back navigation
                window.history.pushState({ page: 'interview' }, '', window.location.href);
                console.log("✓ Navigation cancelled - staying on interview page");
            } else {
                // User confirmed - handle cleanup and navigate
                isNavigatingAway = true;
                await handleAccidentalExit();

                // Allow navigation to proceed
                console.log("✓ User confirmed exit - navigating away");
                router.push('/dashboard');
            }
        };

        // Handle browser close/refresh
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Only show warning if interview is active (not during intentional disconnect)
            if (!isIntentionalDisconnect.current && status === "Interview active") {
                e.preventDefault();
                e.returnValue = "Interview in progress. Are you sure you want to leave?";

                // Save progress before potential exit
                handleAccidentalExit();

                return e.returnValue;
            }
        };

        // Cleanup function for accidental exits
        const handleAccidentalExit = async () => {
            if (isNavigatingAway) return; // Prevent duplicate calls
            isNavigatingAway = true;

            console.log("🚨 Handling accidental exit - saving progress...");

            try {
                // Calculate duration
                const durationMs = Date.now() - sessionStartTime.current;
                const durationMinutes = Math.ceil(durationMs / (1000 * 60));

                // CRITICAL: Stop and remove all audio elements FIRST
                console.log("🔇 Stopping all audio elements...");
                audioElementsRef.current.forEach((element) => {
                    element.pause();
                    element.currentTime = 0;
                    element.src = '';
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
                audioElementsRef.current.clear();
                console.log("✓ All audio elements stopped and removed");

                // Disconnect LiveKit room
                if (roomRef.current) {
                    console.log("🔌 Disconnecting LiveKit room...");
                    roomRef.current.disconnect();
                    roomRef.current = null;
                }

                // Clean up media streams
                if (userVideoStream) {
                    userVideoStream.getTracks().forEach(track => {
                        track.stop();
                        console.log("✓ Stopped media track:", track.kind);
                    });
                    setUserVideoStream(null);
                }

                // Save current transcripts and duration (keep as in_progress)
                if (transcripts.length > 0) {
                    await interviewService.updateSession(currentSessionId, {
                        transcript: transcripts.map((t, index) => ({
                            id: index + 1,
                            speaker: t.speaker,
                            text: t.text,
                            timestamp: t.timestamp
                        })),
                        duration_minutes: durationMinutes,
                        // Keep status as 'in_progress' so user can continue later
                        status: 'in_progress'
                    });
                    console.log("💾 Progress saved - session remains in_progress");
                }

                // Track usage up to this point
                if (user?.id) {
                    await subscriptionService.trackUsage(user.id, durationMinutes);
                }

                console.log("✅ Cleanup complete - user can continue later");
            } catch (error) {
                console.error("❌ Error during accidental exit cleanup:", error);
            }
        };

        // Add event listeners
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentSessionId, status, transcripts, user, userVideoStream, router]);

    // End interview handler
    const handleEndInterview = async () => {
        if (!user?.id || !currentSessionId) {
            router.push("/dashboard");
            toast.error("Invalid session. Redirecting to dashboard.");
            return;
        }

        try {
            // Calculate duration
            const durationMs = Date.now() - sessionStartTime.current;
            const durationMinutes = Math.ceil(durationMs / (1000 * 60));

            console.log("🔚 Ending interview session:", currentSessionId);
            console.log("📊 Session duration:", durationMinutes, "minutes");

            // Set intentional disconnect flag
            isIntentionalDisconnect.current = true;

            // CRITICAL: Stop all audio elements first
            console.log("🔇 Stopping all audio elements...");
            audioElementsRef.current.forEach((element) => {
                element.pause();
                element.currentTime = 0;
                element.src = '';
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            audioElementsRef.current.clear();
            console.log("✓ All audio elements stopped and removed");

            // Clean up camera stream
            if (userVideoStream) {
                console.log("📷 Stopping camera stream...");
                userVideoStream.getTracks().forEach(track => {
                    track.stop();
                    console.log("✓ Stopped camera track:", track.kind);
                });
                setUserVideoStream(null);
                setCameraEnabled(false);
            }

            // Disconnect from LiveKit room (this will also stop microphone)
            if (roomRef.current) {
                console.log("🔌 Disconnecting from LiveKit room...");
                roomRef.current.disconnect();
                roomRef.current = null;
            }

            // Mark session as completed with duration
            await interviewService.completeSession(currentSessionId, {
                durationMinutes
            });

            // Track usage
            await subscriptionService.trackUsage(user.id, durationMinutes);

            // Update user streak
            await profileService.updateStreak(user.id);

            // Check and award badges (async, don't await)
            badgeService.checkAndAwardBadges(user.id).then(newBadges => {
                if (newBadges.length > 0) {
                    newBadges.forEach(badge => {
                        notificationService.sendSuccess(
                            user.id,
                            "New Badge Earned!",
                            `Congratulations! You've earned the "${badge.name}" badge!`
                        );
                    });
                }
            });

            // Generate AI feedback in background
            if (transcripts.length > 0) {
                // Ensure we have session data
                const currentSession = sessionData || await interviewService.getSessionById(currentSessionId);
                if (currentSession) {
                    generateFeedbackInBackground(currentSessionId, transcripts, currentSession);
                }
            } else {
                toast.warning("Interview completed, but no conversation was recorded for feedback.");
            }

            console.log("✓ Interview session completed successfully", currentSessionId);
            toast.success("Interview completed! Redirecting to dashboard...");

            router.push("/dashboard");

        } catch (error) {
            console.error("❌ Error ending interview session:", error);
            toast.error("Failed to complete interview session");
            router.push("/dashboard");
        }
    };

    useEffect(() => {
        let room: Room | null = null;
        let localAudioTrack: MediaStreamTrack | null = null;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        const start = async () => {
            try {
                // Initialize media state from query params if available
                const micParam = searchParams.get('mic');
                const cameraParam = searchParams.get('camera');

                if (micParam === 'true') setIsMuted(false);
                if (cameraParam === 'true') setCameraEnabled(true);

                // Check for pre-fetched token from setup page
                let url: string = '';
                let token: string = '';
                let useCachedToken = false;

                const cachedTokenData = sessionStorage.getItem('livekit_prefetched_token');
                if (cachedTokenData) {
                    try {
                        const { url: cachedUrl, token: cachedToken, timestamp } = JSON.parse(cachedTokenData);
                        const tokenAge = Date.now() - timestamp;
                        const MAX_TOKEN_AGE = 5 * 60 * 1000; // 5 minutes

                        if (tokenAge < MAX_TOKEN_AGE) {
                            // Use cached token
                            url = cachedUrl;
                            token = cachedToken;
                            useCachedToken = true;
                            console.log("✅ Using pre-fetched token from setup page");

                            // Clean up cached token
                            sessionStorage.removeItem('livekit_prefetched_token');
                        } else {
                            console.log("⚠️ Cached token expired, fetching new token");
                            sessionStorage.removeItem('livekit_prefetched_token');
                        }
                    } catch (error) {
                        console.log("⚠️ Error using cached token, fetching new token");
                        sessionStorage.removeItem('livekit_prefetched_token');
                    }
                }

                // PARALLEL EXECUTION: Run microphone and token fetch simultaneously
                let stream: MediaStream;

                if (!useCachedToken) {
                    // No cached token - run both operations in parallel
                    setStatus("Connecting (microphone + token)...");
                    console.log("🚀 Running microphone and token fetch in parallel...");

                    const [micStream, tokenResponse] = await Promise.all([
                        // Microphone request
                        navigator.mediaDevices.getUserMedia({
                            audio: {
                                echoCancellation: { ideal: true },
                                noiseSuppression: { ideal: true },
                                autoGainControl: { ideal: true },
                                sampleRate: { ideal: 48000 },
                                channelCount: { exact: 1 },
                            }
                        }).catch((micError) => {
                            console.error("❌ Microphone error:", micError);
                            if (micError instanceof Error) {
                                if (micError.name === "NotAllowedError") {
                                    throw new Error("Microphone permission denied. Please allow microphone access and refresh the page.");
                                } else if (micError.name === "NotFoundError") {
                                    throw new Error("No microphone found. Please connect a microphone and refresh the page.");
                                } else if (micError.name === "NotReadableError") {
                                    throw new Error("Microphone is already in use by another application.");
                                }
                            }
                            throw new Error(`Failed to access microphone: ${micError instanceof Error ? micError.message : String(micError)}`);
                        }),

                        // Token fetch with retry logic
                        (async () => {
                            let tokenResp;
                            let attempts = 0;
                            while (attempts < MAX_RETRIES) {
                                try {
                                    const tokenUrl = sessionId
                                        ? `/api/livekit_token?sessionId=${sessionId}`
                                        : '/api/livekit_token';
                                    tokenResp = await fetch(tokenUrl);
                                    if (tokenResp.ok) break;

                                    attempts++;
                                    if (attempts >= MAX_RETRIES) {
                                        throw new Error(`Failed to fetch token after ${MAX_RETRIES} attempts: ${tokenResp.statusText}`);
                                    }
                                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                                } catch (fetchError) {
                                    attempts++;
                                    if (attempts >= MAX_RETRIES) {
                                        throw new Error(`Network error: Unable to connect to server after ${MAX_RETRIES} attempts`);
                                    }
                                    console.log(`⚠️ Network error, retrying (${attempts}/${MAX_RETRIES})...`);
                                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                                }
                            }

                            if (!tokenResp || !tokenResp.ok) {
                                throw new Error(`Failed to fetch token: ${tokenResp?.statusText || "Unknown error"}`);
                            }

                            return tokenResp;
                        })()
                    ]);

                    // Extract results from parallel execution
                    stream = micStream;
                    const tokenData = await tokenResponse.json();
                    url = tokenData.url;
                    token = tokenData.token;

                    console.log("✅ Parallel execution complete - mic and token ready");
                } else {
                    // Cached token available - only request microphone
                    setStatus("Checking microphone permissions...");

                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                echoCancellation: { ideal: true },
                                noiseSuppression: { ideal: true },
                                autoGainControl: { ideal: true },
                                sampleRate: { ideal: 48000 },
                                channelCount: { exact: 1 },
                            }
                        });
                    } catch (micError) {
                        console.error("❌ Microphone error:", micError);
                        if (micError instanceof Error) {
                            if (micError.name === "NotAllowedError") {
                                throw new Error("Microphone permission denied. Please allow microphone access and refresh the page.");
                            } else if (micError.name === "NotFoundError") {
                                throw new Error("No microphone found. Please connect a microphone and refresh the page.");
                            } else if (micError.name === "NotReadableError") {
                                throw new Error("Microphone is already in use by another application.");
                            }
                        }
                        throw new Error(`Failed to access microphone: ${micError instanceof Error ? micError.message : String(micError)}`);
                    }
                }

                // Set local audio track
                localAudioTrack = stream.getAudioTracks()[0];

                // Apply additional constraints to reduce feedback
                if (localAudioTrack) {
                    const constraints = localAudioTrack.getConstraints();
                    console.log("🎤 Microphone constraints:", constraints);

                    if (localAudioTrack.getSettings) {
                        const settings = localAudioTrack.getSettings();
                        console.log("🎤 Microphone settings:", settings);
                    }
                }


                setStatus("Connecting to LiveKit...");

                // Create and connect to room
                try {
                    room = new Room({
                        adaptiveStream: true,
                        dynacast: true,
                        // Audio configuration to prevent feedback
                        audioCaptureDefaults: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                        videoCaptureDefaults: {
                            resolution: {
                                width: 1280,
                                height: 720,
                                frameRate: 30,
                            },
                        },
                    });
                    roomRef.current = room;

                    await room.connect(url, token);
                    console.log("✓ Connected to LiveKit room");
                } catch (connectError) {
                    console.error("❌ LiveKit connection error:", connectError);
                    throw new Error(`Failed to connect to interview room: ${connectError instanceof Error ? connectError.message : String(connectError)}`);
                }

                setStatus("Publishing microphone...");

                // Publish microphone track
                try {
                    await room.localParticipant.publishTrack(localAudioTrack, {
                        name: "user-microphone",
                        source: Track.Source.Microphone,
                    });

                    // Initialize and publish camera if enabled
                    if (cameraParam === 'true') {
                        try {
                            console.log("📷 Initializing camera...");
                            const videoStream = await navigator.mediaDevices.getUserMedia({
                                video: {
                                    width: { ideal: 1280 },
                                    height: { ideal: 720 },
                                    frameRate: { ideal: 30 }
                                }
                            });

                            setUserVideoStream(videoStream);

                            // Publish video track
                            const videoTrack = videoStream.getVideoTracks()[0];
                            if (videoTrack) {
                                await room.localParticipant.publishTrack(videoTrack, {
                                    name: "user-camera",
                                    source: Track.Source.Camera,
                                });
                                console.log("✓ Camera published to room");
                            }
                        } catch (videoError) {
                            console.error("❌ Failed to initialize camera:", videoError);
                            toast.error("Failed to access camera. Continuing with audio only.");
                            setCameraEnabled(false);
                        }
                    }
                } catch (publishError) {
                    console.error("❌ Failed to publish tracks:", publishError);
                    throw new Error(`Failed to publish tracks: ${publishError instanceof Error ? publishError.message : String(publishError)}`);
                }

                setStatus("Interview active");
                console.log("✅ Interview session started successfully");

                // PLAY AI AUDIO (only from remote participants, not our own audio)
                room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    if (!room) return;

                    console.log("🔊 Track subscribed:", {
                        kind: track.kind,
                        source: publication.source,
                        participantIdentity: participant.identity,
                        isLocal: participant.isLocal,
                        localIdentity: room.localParticipant?.identity,
                        trackSid: track.sid
                    });

                    if (track.kind === Track.Kind.Audio) {
                        // CRITICAL: Only play audio from REMOTE participants (AI agent)
                        // Never play back local participant's own audio (prevents echo)
                        if (!participant.isLocal && participant.identity !== room.localParticipant?.identity) {
                            // Additional check: Don't play audio from microphone source
                            if (publication.source !== Track.Source.Microphone) {
                                console.log("✅ Playing AI audio from remote participant:", participant.identity);

                                // Check if we already have an element for this track
                                if (!track.sid) {
                                    console.warn("⚠️ Track has no SID, skipping");
                                    return;
                                }

                                if (audioElementsRef.current.has(track.sid)) {
                                    console.log("⚠️ Audio element already exists for track:", track.sid);
                                    return;
                                }

                                try {
                                    const audioElement = track.attach() as HTMLAudioElement;
                                    audioElementsRef.current.set(track.sid, audioElement);

                                    // Optimize audio element to prevent resonance and echo
                                    audioElement.autoplay = true;
                                    audioElement.volume = 0.5; // Further reduced volume to prevent feedback and echo
                                    // audioElement.preservesPitch = true; // Not supported in all browsers, can cause issues
                                    // audioElement.playbackRate = 1.0;

                                    // Additional settings to prevent audio issues
                                    audioElement.muted = false;
                                    audioElement.controls = false;
                                    audioElement.loop = false;

                                    // Prevent audio processing that might cause echo
                                    audioElement.crossOrigin = 'anonymous';

                                    // Set audio output device to default (not microphone device)
                                    if ('setSinkId' in audioElement) {
                                        try {
                                            (audioElement as any).setSinkId('default').then(() => {
                                                console.log("✓ Audio output set to default device");
                                            }).catch((sinkError: any) => {
                                                console.warn("⚠️ Could not set audio sink:", sinkError);
                                            });
                                        } catch (sinkError) {
                                            console.warn("⚠️ Could not set audio sink:", sinkError);
                                        }
                                    }

                                    // Add to DOM for better browser handling (hidden)
                                    audioElement.style.display = 'none';
                                    audioElement.style.position = 'absolute';
                                    audioElement.style.left = '-9999px';
                                    document.body.appendChild(audioElement);

                                    console.log("🔊 Audio element configured:", {
                                        volume: audioElement.volume,
                                        trackSid: track.sid
                                    });

                                    // Track AI speaking state to prevent feedback
                                    audioElement.addEventListener('play', () => {
                                        console.log("🗣️ AI started speaking");
                                        setIsAISpeaking(true);
                                    });

                                    audioElement.addEventListener('ended', () => {
                                        console.log("🔇 AI stopped speaking");
                                        setIsAISpeaking(false);
                                    });

                                    audioElement.addEventListener('pause', () => {
                                        console.log("⏸️ AI audio paused");
                                        setIsAISpeaking(false);
                                    });

                                    // Ensure audio plays
                                    audioElement.play().catch(playError => {
                                        console.error("❌ Error playing audio:", playError);
                                        // Try to play again after user interaction
                                        document.addEventListener('click', () => {
                                            audioElement.play().catch(e => console.error("❌ Retry play failed:", e));
                                        }, { once: true });
                                    });

                                    // Cleanup when track ends
                                    track.on('ended', () => {
                                        console.log("🔇 Audio track ended, cleaning up");
                                        if (audioElement.parentNode) {
                                            audioElement.parentNode.removeChild(audioElement);
                                        }
                                        if (track.sid) {
                                            audioElementsRef.current.delete(track.sid);
                                        }
                                    });
                                } catch (attachError) {
                                    console.error("❌ Error attaching audio track:", attachError);
                                }
                            } else {
                                console.log("⛔ Ignoring microphone audio from remote participant (not AI audio)");
                            }
                        } else {
                            console.log("⛔ Ignoring local audio track (preventing echo) from:", participant.identity);
                        }
                    }
                });

                // RECEIVE TRANSCRIPTS via Data Channel
                room.on(RoomEvent.DataReceived, (payload, participant) => {
                    try {
                        const decoder = new TextDecoder();
                        const message = JSON.parse(decoder.decode(payload));

                        if (message.type === "transcript") {
                            const { speaker, transcript, isComplete, timestamp } = message;

                            const transcriptEntry = {
                                speaker,
                                text: transcript,
                                timestamp,
                                isComplete
                            };

                            // Handle AI transcripts (can be partial or complete)
                            if (speaker === "ai") {
                                // Use Zustand's updateLastTranscript which handles partial updates
                                updateLastTranscript(transcriptEntry);
                            } else {
                                // For user transcripts, always add new entry
                                addTranscript(transcriptEntry);
                            }

                            console.log(`📝 ${speaker === "user" ? "User" : "AI"} transcript (${isComplete ? 'complete' : 'partial'}):`, transcript.substring(0, 50) + "...");
                        }
                    } catch (parseError) {
                        console.error("❌ Error parsing data message:", parseError);
                    }
                });

                // Handle disconnection
                room.on(RoomEvent.Disconnected, (reason) => {
                    console.log("⚠️ Disconnected from room:", reason);

                    // Only show error if it wasn't an intentional disconnect
                    if (!isIntentionalDisconnect.current) {
                        setStatus("Disconnected");
                        if (reason) {
                            setError(`Disconnected: ${reason}`);
                        }
                    } else {
                        console.log("✓ Intentional disconnect, ignoring error state");
                    }

                    // Clean up camera stream when room disconnects
                    console.log("🧹 Cleaning up media streams after disconnect...");
                    setUserVideoStream((prevStream) => {
                        if (prevStream) {
                            prevStream.getTracks().forEach(track => {
                                track.stop();
                                console.log("✓ Camera track stopped:", track.kind);
                            });
                        }
                        return null;
                    });
                    setCameraEnabled(false);

                    // Microphone is automatically cleaned up by LiveKit room disconnect
                    console.log("✓ Media streams cleaned up");
                });

                // Handle connection quality changes
                room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
                    if (participant.isLocal) {
                        console.log("📶 Connection quality:", quality);
                        if (quality === "poor") {
                            console.warn("⚠️ Poor connection quality detected");
                        }
                    }
                });

                // Handle reconnection
                room.on(RoomEvent.Reconnecting, () => {
                    console.log("🔄 Reconnecting...");
                    setStatus("Reconnecting...");
                });

                room.on(RoomEvent.Reconnected, () => {
                    console.log("✅ Reconnected");
                    setStatus("Interview active");
                    setError(null);
                });

            } catch (err) {
                console.error("❌ Error starting interview:", err);
                setError(err instanceof Error ? err.message : "Unknown error occurred");
                setStatus("Error");

                // Cleanup on error
                if (localAudioTrack) {
                    localAudioTrack.stop();
                }
                if (room) {
                    room.disconnect();
                }
            }
        };

        start();

        // Cleanup on unmount
        return () => {
            console.log("🧹 Cleaning up interview session...");

            // CRITICAL: Stop all audio playback immediately
            console.log("🔇 Stopping all audio elements...");
            if (audioElementsRef.current) {
                audioElementsRef.current.forEach((element) => {
                    element.pause();
                    element.currentTime = 0;
                    element.src = ''; // Clear source to stop any buffering
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
                audioElementsRef.current.clear();
                console.log("✓ All audio elements stopped and removed");
            }

            // Disconnect room
            if (room) {
                room.disconnect();
                console.log("✓ Room disconnected");
            }

            // Stop microphone
            if (localAudioTrack) {
                localAudioTrack.stop();
                console.log("✓ Microphone stopped");
            }
        };
    }, [currentSessionId]);

    // Separate effect for component unmount cleanup
    useEffect(() => {
        // This cleanup only runs when component unmounts completely
        return () => {
            console.log("🧹 Component unmounting - performing final cleanup");
            // You can add any final cleanup here if needed, but avoid calling handleEndInterview
            // as it might cause issues with navigation
        };
    }, []); // Empty dependency array ensures this only runs on mount/unmount

    // Auto-scroll to latest transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcripts]);

    const handleMuteToggle = () => {
        if (roomRef.current) {
            const audioTrack = roomRef.current.localParticipant.audioTrackPublications.values().next().value;
            if (audioTrack) {
                try {
                    if (isMuted) {
                        audioTrack.unmute();
                        console.log("🔊 Microphone unmuted");
                    } else {
                        audioTrack.mute();
                        console.log("🔇 Microphone muted");
                    }
                    setIsMuted(!isMuted);
                } catch (muteError) {
                    console.error("❌ Error toggling microphone:", muteError);
                    toast.error("Failed to toggle microphone");
                }
            } else {
                console.warn("⚠️ No audio track found for mute/unmute");
            }
        } else {
            console.warn("⚠️ No room connection found for mute/unmute");
        }
    };

    const handleEndCall = async () => {
        if (confirm("Are you sure you want to end the interview?")) {
            if (roomRef.current) {
                roomRef.current.disconnect();
            }
            await handleEndInterview();
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Loading State */}
            {loadingSession && (
                <div className="flex-1 flex items-center justify-center min-h-screen">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 animate-pulse">
                            <Brain className="h-8 w-8 text-blue-400 animate-spin" />
                        </div>
                        <div>
                            <p className="text-white text-lg font-semibold">Loading Interview Session</p>
                            <p className="text-slate-400 text-sm">Please wait while we prepare your interview...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Video Call Interface */}
            {!loadingSession && (
                <>
                    {/* Video Background */}
                    <div className="absolute inset-0">
                        {/* Always render video element to prevent flicker on status changes */}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover transition-opacity duration-300 ${cameraEnabled && userVideoStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                }`}
                        />

                        {/* Fallback gradient background (shown when camera is off) */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-300 ${cameraEnabled && userVideoStream ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                }`}
                            style={{
                                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
                            }}
                        />

                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Top Status Bar */}
                    <div className="absolute top-4 left-4 right-4 z-10">
                        <div className="flex items-center justify-between">
                            {/* Timer */}
                            <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-mono text-lg">{formatTime(timeElapsed)}</span>
                            </div>

                            {/* Keyboard Shortcuts */}
                            <button
                                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                                className="bg-yellow-500/90 backdrop-blur-md rounded-full px-3 py-1 text-black text-sm font-medium hover:bg-yellow-400 transition-colors"
                            >
                                ⌨️ 0ms
                            </button>
                        </div>
                    </div>

                    {/* AI Avatar (Top Right) */}
                    <div className="absolute top-4 right-4 z-10">
                        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 min-w-[200px]">
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-blue-400 ring-2 ring-blue-400/30">
                                    <AvatarImage src="/arjuna-icon.png" />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                                        AI
                                    </AvatarFallback>
                                </Avatar>
                                {isAISpeaking && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                )}
                            </div>
                            <div>
                                <p className="text-white font-semibold">Arjuna AI</p>
                                <p className={`text-sm flex items-center gap-2 ${status === "Interview active" ? "text-green-400" :
                                    status === "Error" ? "text-red-400" : "text-yellow-400"
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${status === "Interview active" ? "bg-green-500 animate-pulse" :
                                        status === "Error" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                                        }`} />
                                    {status}
                                </p>
                            </div>
                            {/* Audio visualizer bars */}
                            <div className="flex items-center gap-1 ml-auto">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 bg-blue-400 rounded-full transition-all duration-75 ${isAISpeaking ? 'animate-music-bar' : 'h-2'
                                            }`}
                                        style={{
                                            animationDelay: `${i * 0.1}s`,
                                            height: isAISpeaking ? `${Math.random() * 16 + 8}px` : '4px'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Error Message Toast */}
                        {error && (
                            <div className="mt-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg max-w-md ml-auto animate-in slide-in-from-right fade-in">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <X className="h-4 w-4" />
                                </div>
                                <div className="flex-1 text-sm font-medium">
                                    {error}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                                    onClick={() => setError(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>


                    {/* User Avatar (Bottom Left) */}
                    {
                        !cameraEnabled && (
                            <div className="absolute bottom-24 left-4 z-10">
                                <div className="bg-black/60 backdrop-blur-md rounded-full p-1">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                        <User className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full mt-2 text-center">
                                    You
                                </div>
                            </div>
                        )
                    }

                    {/* Status Messages */}
                    {
                        status !== "Interview active" && (
                            <div className="absolute bottom-32 right-4 z-10">
                                <div className="bg-black/80 backdrop-blur-md rounded-lg p-3 flex items-center gap-2 text-white">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm">{status}</span>
                                </div>
                            </div>
                        )
                    }

                    {/* Listening Indicator */}
                    {
                        !isMuted && status === "Interview active" && (
                            <div className="absolute bottom-32 right-4 z-10">
                                <div className="bg-green-500/90 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-2 text-white">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Listening</span>
                                </div>
                            </div>
                        )
                    }

                    {/* Error Display */}
                    {
                        error && (
                            <div className="absolute top-20 left-4 right-4 z-20">
                                <div className="bg-red-500/95 backdrop-blur-md text-white p-4 rounded-xl border border-red-400/50 shadow-xl">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <div className="flex-1">
                                            <p className="font-semibold mb-1">Connection Error</p>
                                            <p className="text-red-100 text-sm">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Control Bar */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-black/80 backdrop-blur-md rounded-full p-2 flex items-center gap-2">
                            {/* Mute Toggle */}
                            <button
                                onClick={handleMuteToggle}
                                className={`
                                    w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center
                                    ${isMuted
                                        ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                                        : "bg-slate-700 hover:bg-slate-600"
                                    }
                                `}
                                title={`${isMuted ? 'Unmute' : 'Mute'} (Ctrl+Space)`}
                            >
                                {isMuted ? (
                                    <MicOff className="h-6 w-6 text-white" />
                                ) : (
                                    <Mic className="h-6 w-6 text-white" />
                                )}
                            </button>

                            {/* End Call */}
                            <button
                                onClick={handleEndCall}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-lg shadow-red-500/30"
                                title="End Interview (Ctrl+E)"
                            >
                                <PhoneOff className="h-6 w-6 text-white" />
                            </button>

                            {/* Camera Toggle */}
                            <button
                                onClick={() => setCameraEnabled(!cameraEnabled)}
                                className={`
                                    w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center
                                    ${cameraEnabled
                                        ? "bg-slate-700 hover:bg-slate-600"
                                        : "bg-slate-700 hover:bg-slate-600"
                                    }
                                `}
                                title={`${cameraEnabled ? 'Turn off camera' : 'Turn on camera'}`}
                            >
                                {cameraEnabled ? (
                                    <Video className="h-6 w-6 text-white" />
                                ) : (
                                    <VideoOff className="h-6 w-6 text-white" />
                                )}
                            </button>

                            {/* Transcript Toggle */}
                            <button
                                onClick={() => setShowTranscript(!showTranscript)}
                                className={`
                                    w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center
                                    ${showTranscript
                                        ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                        : "bg-slate-700 hover:bg-slate-600"
                                    }
                                `}
                                title={`${showTranscript ? 'Hide' : 'Show'} Transcript (Ctrl+T)`}
                            >
                                <MessageSquare className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts Overlay */}
                    {
                        showKeyboardShortcuts && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                                <div className="bg-black/90 backdrop-blur-md rounded-2xl p-6 max-w-md mx-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-white text-lg font-semibold">⌨️ Keyboard Shortcuts</h3>
                                        <button
                                            onClick={() => setShowKeyboardShortcuts(false)}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center text-white">
                                            <span>Toggle Mic:</span>
                                            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300">Ctrl+Space</kbd>
                                        </div>
                                        <div className="flex justify-between items-center text-white">
                                            <span>End Interview:</span>
                                            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300">Ctrl+E</kbd>
                                        </div>
                                        <div className="flex justify-between items-center text-white">
                                            <span>Toggle Transcript:</span>
                                            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300">Ctrl+T</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Transcript Sidebar (Mobile slide-in, Desktop fixed) */}
                    {
                        showTranscript && (
                            <div className={`
                            fixed lg:absolute top-0 right-0 h-full w-full max-w-md lg:max-w-sm
                            bg-black/90 backdrop-blur-md border-l border-slate-700/50 z-20
                            flex flex-col
                        `}>
                                {/* Transcript Header */}
                                <div className="p-4 border-b border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 text-blue-400" />
                                            <h3 className="font-semibold text-white">Live Transcript</h3>
                                        </div>
                                        <button
                                            onClick={() => setShowTranscript(false)}
                                            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Transcript Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {transcripts.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-slate-500 text-sm text-center">
                                                Transcript will appear here<br />once the conversation starts
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {transcripts.map((t, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex ${t.speaker === "user" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`
                                                        max-w-[85%] px-3 py-2 rounded-xl shadow-md
                                                        ${t.speaker === "user"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-slate-700 text-slate-100"
                                                            }
                                                        ${!t.isComplete ? "opacity-70" : "opacity-100"}
                                                    `}
                                                    >
                                                        <div className="text-[10px] mb-1 opacity-75 font-medium">
                                                            {t.speaker === "user" ? "👤 You" : "🤖 AI Interviewer"}
                                                        </div>
                                                        <div className="text-sm leading-relaxed">{t.text}</div>
                                                        {!t.isComplete && (
                                                            <div className="text-[10px] mt-1 italic opacity-60">
                                                                typing...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={transcriptEndRef} />
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    }
                </>
            )
            }
        </div >
    );
}
