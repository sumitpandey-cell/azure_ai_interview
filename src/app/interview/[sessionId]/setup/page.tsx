'use client'
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, CheckCircle2, Sparkles, ArrowLeft, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { interviewService } from "@/services/interview.service";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent } from "@/components/ui/card";
import { useInterviewStore } from "@/stores/use-interview-store";
import { AvatarSelection } from "@/components/AvatarSelection";
import { getDefaultAvatar, getAvatarById, type InterviewerAvatar } from "@/config/interviewer-avatars";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionConfig {
    skills?: string[];
    jobDescription?: string;
    duration?: number;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    selectedAvatar?: string; // ID of the selected interviewer avatar
    companyInterviewConfig?: {
        companyTemplateId: string;
        companyName: string;
        role: string;
        experienceLevel: string;
    };
}

interface SessionData {
    id: string;
    interview_type: string;
    position: string;
    status: string;
    duration_seconds?: number | null;
    config?: SessionConfig | null;
}

export default function InterviewSetup() {
    const { sessionId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);
    const [fetchingSession, setFetchingSession] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [selectedAvatar, setSelectedAvatar] = useState<InterviewerAvatar>(getDefaultAvatar());

    const [showTimeWarning, setShowTimeWarning] = useState(false);
    const { allowed, remaining_seconds, loading: subscriptionLoading } = useSubscription();
    const { currentSession, setCurrentSession } = useInterviewStore();
    const [hasResume, setHasResume] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // Load selected avatar from session config
    useEffect(() => {
        if (session?.config?.selectedAvatar) {
            const avatar = getAvatarById(session.config.selectedAvatar);
            if (avatar) {
                setSelectedAvatar(avatar);
            }
        }
    }, [session]);

    const fetchSession = async () => {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                throw new Error('Invalid session ID');
            }

            let sessionData: SessionData;

            // 1. Check store first
            if (currentSession && currentSession.id === sessionId) {
                sessionData = currentSession;
            } else {
                // 2. Fetch from DB if not in store
                const data = await interviewService.getSessionById(sessionId);
                if (!data) throw new Error('Session not found');

                sessionData = data as unknown as SessionData;

                // Update store with fetched session
                setCurrentSession({
                    id: data.id,
                    user_id: data.user_id,
                    interview_type: data.interview_type,
                    position: data.position,
                    status: data.status,
                    config: (data.config as SessionConfig) || {},
                    created_at: data.created_at
                });
            }

            // 3. Security check: Redirect if session is already completed
            if (sessionData.status === 'completed') {
                toast.info("This interview session has already been completed. Redirecting to dashboard.");
                router.replace('/dashboard');
                return;
            }

            setSession(sessionData as SessionData);
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Stream error:", error);
            toast.error("Session not found. Redirecting to start interview.");
            router.replace("/start-interview");
        } finally {
            setFetchingSession(false);
        }
    };

    const checkResume = async () => {
        if (!user?.id) return;
        const { data: profile } = await supabase.from('profiles').select('resume_url').eq('id', user.id).single();
        if (profile?.resume_url) {
            setHasResume(true);
        }
    };

    useEffect(() => {
        if (user?.id) {
            checkResume();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const toggleMic = async () => {
        if (!isMicOn) {
            // Turning on
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (stream) {
                    // Combine with existing stream tracks
                    const tracks = [...stream.getVideoTracks(), ...audioStream.getAudioTracks()];
                    const newStream = new MediaStream(tracks);
                    setStream(newStream);
                    if (videoRef.current) videoRef.current.srcObject = newStream;
                } else {
                    setStream(audioStream);
                }
                setIsMicOn(true);
            } catch (err: unknown) {
                const error = err as Error;
                console.error("Error starting session:", error);
                toast.error('Microphone access denied or unavailable.');
            }
        } else {
            // Turning off
            if (stream) {
                stream.getAudioTracks().forEach(track => track.stop());
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    const newStream = new MediaStream(videoTracks);
                    setStream(newStream);
                    if (videoRef.current) videoRef.current.srcObject = newStream;
                } else {
                    setStream(null);
                    if (videoRef.current) videoRef.current.srcObject = null;
                }
            }
            setIsMicOn(false);
        }
    };



    const startCamera = async () => {
        try {
            setCameraError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                handleMediaApiMissing();
                return;
            }

            try {
                // Try to get both video and audio
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                updateStreamAndState(mediaStream, true, true);
            } catch (error: unknown) {
                const mediaError = error as Error;
                console.warn('Initial dual-media request failed, trying fallbacks:', mediaError.name);

                // If video failed but audio might still work
                if (mediaError.name === 'NotAllowedError' || mediaError.name === 'NotFoundError' || mediaError.name === 'NotReadableError' || mediaError.name === 'OverconstrainedError') {
                    setCameraError(getSpecificErrorMessage(mediaError));

                    // IF we already have mic check it or try to get it
                    try {
                        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        updateStreamAndState(audioStream, false, true);
                        toast.info("Camera unavailable, but microphone is active. You can proceed with audio only.");
                    } catch (audioError) {
                        console.error('Total media failure:', audioError);
                        throw error; // Throw the original video error if both fail
                    }
                } else {
                    throw error;
                }
            }
        } catch (error: unknown) {
            handleMediaError(error);
        }
    };

    const handleMediaApiMissing = () => {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!isHttps && !isLocalhost) {
            setCameraError('HTTPS required for camera access');
            toast.error('Camera/Mic requires HTTPS. Please access via localhost or HTTPS.');
        } else {
            setCameraError('Camera API not supported');
            toast.error('Your browser does not support camera access.');
        }
    };

    const updateStreamAndState = (mediaStream: MediaStream, videoGranted: boolean, audioGranted: boolean) => {
        // Stop old stream tracks first
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        setStream(mediaStream);
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }

        if (videoGranted) setIsCameraOn(true);
        if (audioGranted) setIsMicOn(true);
    };

    const getSpecificErrorMessage = (error: unknown) => {
        const err = error as { name?: string };
        if (err.name === 'NotAllowedError') return 'Camera permission denied.';
        if (err.name === 'NotFoundError') return 'No camera found.';
        if (err.name === 'NotReadableError') return 'Camera is busy.';
        return 'Camera access failed.';
    };

    const handleMediaError = (error: unknown) => {
        console.error('Error accessing media:', error);
        const err = error as { name?: string };
        if (err.name === 'NotAllowedError') {
            toast.error('Media access denied. Please check browser permissions.');
        } else {
            toast.error('Unexpected error accessing camera/microphone.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.stop());

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
                const audioOnlyStream = new MediaStream(audioTracks);
                setStream(audioOnlyStream);
                if (videoRef.current) videoRef.current.srcObject = audioOnlyStream;
            } else {
                setStream(null);
                if (videoRef.current) videoRef.current.srcObject = null;
            }
        }
        setIsCameraOn(false);
    };

    const toggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleStart = async () => {
        if (!allowed && !subscriptionLoading) {
            toast.error("You have reached your daily interview limit.");
            return;
        }

        if (remaining_seconds <= 0 && !subscriptionLoading) {
            toast.error("You have no remaining interview time.");
            return;
        }

        if (remaining_seconds < 300 && !showTimeWarning && !subscriptionLoading) {
            setShowTimeWarning(true);
            return;
        }

        proceedToStart();
    };

    const proceedToStart = async () => {
        if (!isMicOn) {
            toast.error("Please turn on your microphone to continue");
            return;
        }

        setIsLoading(true);

        try {
            // Update session config to track current stage and selected avatar
            if (sessionId && typeof sessionId === 'string') {
                const currentConfig = (session?.config as Record<string, unknown>) || {};
                await interviewService.updateSession(sessionId, {
                    config: {
                        ...currentConfig,
                        selectedAvatar: selectedAvatar.id,
                        selectedVoice: selectedAvatar.voice,
                        currentStage: 'live',
                    }
                });
            }

            // Pre-fetch LiveKit token to speed up connection on live page
            const tokenResponse = await fetch(`/api/livekit_token?sessionId=${sessionId}`);

            if (tokenResponse.ok) {
                const { url, token, expiresAt } = await tokenResponse.json();

                // Store token in sessionStorage for live page to use
                sessionStorage.setItem('livekit_prefetched_token', JSON.stringify({
                    url,
                    token,
                    expiresAt,
                    timestamp: Date.now() // Track when token was generated
                }));

            } else {
                console.warn("⚠️ Failed to pre-fetch token, live page will fetch it");
            }
        } catch (error) {
            console.warn("⚠️ Error pre-fetching token:", error);
            // Don't block navigation if token fetch fails
        }

        setIsLoading(false);
        toast.success(`Starting interview with ${selectedAvatar.name}...`);
        router.replace(`/interview/${sessionId}/live?mic=${isMicOn}&camera=${isCameraOn}`);
    };

    if (fetchingSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="h-16 sm:h-20 border-b border-border/50 bg-background/80 backdrop-blur-2xl sticky top-0 z-50 flex items-center px-4 sm:px-8 lg:px-16 justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all"></div>
                        <Image src="/favicon.ico" alt="Arjuna AI" width={40} height={40} className="relative h-8 w-8 sm:h-10 sm:w-10 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-none">
                            Arjuna<span className="text-primary">AI</span>
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Interview Setup</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.replace('/dashboard')}
                    className="group h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-border/40 hover:bg-muted transition-all"
                >
                    <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back to Dashboard</span>
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-start justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">

                {/* Left Column: Video Preview */}
                <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-8">
                    <div className="relative aspect-video bg-black rounded-2xl sm:rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.1)] border border-white/10 group">
                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isCameraOn ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 transform scale-x-[-1]`}
                        />

                        {/* Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>

                        {/* Top Info Strip */}
                        <div className="absolute top-3 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-between z-10">
                            <div className="bg-black/40 backdrop-blur-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/10 flex items-center gap-2 sm:gap-3">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCameraOn ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isCameraOn ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-white/90">
                                    {isCameraOn ? "Camera Active" : "Camera Off"}
                                </span>
                            </div>

                            <div className="bg-primary/20 backdrop-blur-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-primary/30 flex items-center gap-1.5 sm:gap-2">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span className="text-[10px] sm:text-xs font-bold text-primary">
                                    {authLoading ? (
                                        <Skeleton className="h-2 w-12 inline-block ml-1 align-middle bg-primary/20" />
                                    ) : (
                                        user?.user_metadata?.full_name?.split(' ')[0] || "User"
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Placeholder for Video Stream */}
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/10 backdrop-blur-sm overflow-hidden pb-12">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none"></div>
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-2xl sm:rounded-2xl bg-card border border-white/10 flex items-center justify-center relative shadow-2xl">
                                        <VideoOff className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground/40" />
                                    </div>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground/80">Camera Disabled</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-2">{cameraError || "Enable camera to continue"}</p>
                            </div>
                        )}

                        {/* Bottom Action Controls */}
                        <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 flex justify-center gap-4 sm:gap-8 z-10 transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
                            <button
                                onClick={toggleMic}
                                className={`group h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 backdrop-blur-2xl border ${isMicOn
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
                                    }`}
                                title={isMicOn ? "Mute Audio" : "Unmute Audio"}
                            >
                                {isMicOn ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
                                <div className="absolute -bottom-12 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] sm:text-xs font-medium">{isMicOn ? "Microphone On" : "Enable Microphone"}</div>
                            </button>

                            <button
                                onClick={toggleCamera}
                                className={`group h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 backdrop-blur-2xl border ${isCameraOn
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
                                    }`}
                                title={isCameraOn ? "Cut Vision" : "Launch Vision"}
                            >
                                {isCameraOn ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
                                <div className="absolute -bottom-12 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] sm:text-xs font-medium">{isCameraOn ? "Camera On" : "Enable Camera"}</div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-card/30 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-2xl border border-border/40 space-y-3 sm:space-y-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                System Status
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Environment Check", desc: "Minimal background noise" },
                                    { label: "Secure Connection", desc: "End-to-end encryption active" }
                                ].map((step, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">{step.label}</span>
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/60 font-medium">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card/30 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-2xl border border-border/40 space-y-3 sm:space-y-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Interview Tips
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                Speak clearly and maintain eye contact with the camera for the best interview experience.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Controls & AvatarSelection */}
                <div className="lg:col-span-4 flex flex-col gap-6 w-full">
                    {session && (
                        <Card className="rounded-2xl sm:rounded-2xl border border-white/5 bg-card/40 backdrop-blur-2xl overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-accent/50"></div>
                            <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-primary">Interview Details</span>
                                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Session Configuration</h3>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: "Modality", val: session.interview_type },
                                        { label: "Target Position", val: session.position }
                                    ].map((row, i) => (
                                        <div key={i} className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-border/40 group/row hover:bg-white/[0.05] transition-all">
                                            <span className="text-[10px] font-semibold text-muted-foreground group-hover/row:text-primary transition-colors">{row.label}</span>
                                            <span className="text-xs sm:text-sm font-medium text-foreground transition-all">{row.val}</span>
                                        </div>
                                    ))}

                                    {session.config?.difficulty && (
                                        <div className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-border/40">
                                            <span className="text-[10px] font-semibold text-muted-foreground">Difficulty Level</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${session.config.difficulty === 'Beginner' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    session.config.difficulty === 'Intermediate' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                        'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                                    }`}></div>
                                                <span className="text-xs sm:text-sm font-semibold text-foreground">{session.config.difficulty}</span>
                                            </div>
                                        </div>
                                    )}

                                    {session.config?.skills && session.config.skills.length > 0 && (
                                        <div className="flex flex-col gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-border/40">
                                            <span className="text-[10px] font-semibold text-muted-foreground">Skills to Assess</span>
                                            <div className="flex flex-wrap gap-2">
                                                {session.config.skills.map((skill, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-semibold">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {hasResume && (
                                        <div className="flex flex-col gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/5 border border-emerald-500/20 group/resume">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400 group-hover/resume:text-emerald-500 transition-colors uppercase tracking-widest">Resume Context</span>
                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                Your professional experience from your resume will be shared with the AI for a personalized interview.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Integrated Avatar Selection */}
                    <Card className="rounded-2xl sm:rounded-2xl border border-white/5 bg-card/40 backdrop-blur-2xl overflow-hidden p-4 sm:p-6 relative">
                        <AvatarSelection
                            selectedAvatar={selectedAvatar}
                            onSelect={setSelectedAvatar}
                            variant="compact"
                            disabled={isLoading}
                        />
                    </Card>

                    <div className="space-y-6 pt-4">
                        <div className="flex flex-col gap-6 text-center">
                            <div className="space-y-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Ready to Start?</h2>
                                <p className="text-xs text-muted-foreground font-medium">Your AI interviewer is ready to begin</p>
                            </div>

                            <Button
                                size="lg"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 sm:h-14 text-sm sm:text-base font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                                onClick={handleStart}
                                disabled={isLoading || subscriptionLoading || !allowed}
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                        <span>Starting Interview...</span>
                                    </div>
                                ) : !allowed ? (
                                    "Limit Reached"
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="p-1 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                                            <Zap className="h-4 w-4 fill-white" />
                                        </div>
                                        <span>Start Interview</span>
                                    </div>
                                )}
                            </Button>

                            {!isMicOn ? (
                                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-rose-500/10 border border-rose-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <p className="text-[10px] text-rose-500 font-semibold">Microphone Required</p>
                                </div>
                            ) : !isCameraOn && (
                                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <p className="text-[10px] text-blue-500 font-semibold">Camera Optional (Recommended)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>


            <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
                <AlertDialogContent className="bg-card/70 backdrop-blur-3xl border border-white/10 rounded-2xl p-8">
                    <AlertDialogHeader className="space-y-4">
                        <AlertDialogTitle className="text-2xl font-bold text-foreground">
                            Low Time Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            You have only <span className="text-amber-500 font-semibold">{Math.ceil(remaining_seconds / 60)} minutes</span> of interview time remaining.
                            The interview will end automatically when your time runs out.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex gap-4">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl border border-border bg-background font-semibold text-sm hover:bg-muted">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={proceedToStart}
                            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xl shadow-primary/20"
                        >
                            Continue Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
