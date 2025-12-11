'use client'
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Brain, Mic, MicOff, Video, VideoOff, CheckCircle2, Sparkles, ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { interviewService } from "@/services/interview.service";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent } from "@/components/ui/card";
import { useInterviewStore } from "@/stores/use-interview-store";

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
    duration_minutes?: number | null;
    config?: SessionConfig | null;
}

export default function InterviewSetup() {
    const { sessionId } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);
    const [fetchingSession, setFetchingSession] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [showTimeWarning, setShowTimeWarning] = useState(false);
    const { allowed, remaining_minutes, loading: subscriptionLoading } = useSubscription();
    const { currentSession, setCurrentSession } = useInterviewStore();

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                throw new Error('Invalid session ID');
            }

            // First check if we have the session in store
            if (currentSession && currentSession.id === sessionId) {
                console.log("📦 Found session in store:", currentSession.id, "Status:", currentSession.status);
                // Check if session is already in progress or completed
                if (currentSession.status === 'in_progress' || currentSession.status === 'completed') {
                    toast.info("This interview session has already been started. Redirecting to dashboard.");
                    router.push('/dashboard');
                    return;
                }
                setSession(currentSession as SessionData);
                setFetchingSession(false);
                return;
            }

            const data = await interviewService.getSessionById(sessionId);

            if (!data) {
                throw new Error('Session not found');
            }

            console.log("🔍 Fetched session from DB:", data.id, "Status:", data.status);
            setSession(data as SessionData);

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
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Session not found. Redirecting to start interview.");
            router.push("/start-interview");
        } finally {
            setFetchingSession(false);
        }
    };

    const toggleMic = () => setIsMicOn(!isMicOn);



    const startCamera = async () => {
        try {
            setCameraError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCameraOn(true);
            setIsMicOn(true); // Also enable mic when camera starts
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Unable to access camera. Please check permissions.');
            toast.error('Camera access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setIsMicOn(false); // Also disable mic when camera stops
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

        if (remaining_minutes <= 0 && !subscriptionLoading) {
            toast.error("You have no remaining interview time.");
            return;
        }

        if (remaining_minutes < 5 && !showTimeWarning && !subscriptionLoading) {
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

        if (!isCameraOn) {
            toast.error("Please turn on your camera to continue");
            return;
        }

        setIsLoading(true);

        try {
            // Update session config to track current stage
            if (sessionId && typeof sessionId === 'string') {
                const currentConfig = (session?.config as Record<string, any>) || {};
                await interviewService.updateSession(sessionId, {
                    config: {
                        ...currentConfig,
                        currentStage: 'live'
                    }
                });
                console.log("✓ Session stage updated to 'live'");
            }

            // Pre-fetch LiveKit token to speed up connection on live page
            console.log("🚀 Pre-fetching LiveKit token...");
            const tokenResponse = await fetch(`/api/livekit_token?sessionId=${sessionId}`);

            if (tokenResponse.ok) {
                const { url, token } = await tokenResponse.json();

                // Store token in sessionStorage for live page to use
                sessionStorage.setItem('livekit_prefetched_token', JSON.stringify({
                    url,
                    token,
                    timestamp: Date.now() // Track when token was generated
                }));

                console.log("✅ LiveKit token pre-fetched and cached");
            } else {
                console.warn("⚠️ Failed to pre-fetch token, live page will fetch it");
            }
        } catch (error) {
            console.warn("⚠️ Error pre-fetching token:", error);
            // Don't block navigation if token fetch fails
        }

        setIsLoading(false);
        toast.success("Starting interview session...");
        router.push(`/interview/${sessionId}/live?mic=${isMicOn}&camera=${isCameraOn}`);
        console.log("Starting interview for session:", sessionId);
    };

    if (fetchingSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans transition-colors duration-300">
            {/* Header */}
            <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50 flex items-center px-6 lg:px-12 justify-between">
                <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <img src="/arjuna-logo.png" alt="Arjuna AI" className="h-8 w-8 object-contain" />
                    Arjuna AI
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Left Column: Video Preview */}
                <div className="w-full max-w-3xl">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border/20 ring-1 ring-white/10">

                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'} transform scale-x-[-1]`}
                        />

                        {/* User Label */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium z-10 border border-white/10 flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isCameraOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {user?.user_metadata?.full_name || user?.email || "User"}
                        </div>

                        {/* Placeholder for Video Stream */}
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-400 pb-20">
                                <div className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
                                    <VideoOff className="h-8 w-8 md:h-10 md:w-10 opacity-50" />
                                </div>
                                <p className="text-lg font-medium">Camera is turned off</p>
                                {cameraError && (
                                    <p className="text-red-400 text-sm text-center max-w-xs mt-2 bg-red-950/30 px-3 py-1 rounded-md border border-red-900/50">{cameraError}</p>
                                )}
                            </div>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-10">
                            <button
                                onClick={toggleMic}
                                className={`h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 ${isMicOn
                                    ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600'
                                    : 'bg-red-500/90 hover:bg-red-600 text-white border border-red-400'
                                    }`}
                                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {isMicOn ? <Mic className="h-5 w-5 md:h-6 md:w-6" /> : <MicOff className="h-5 w-5 md:h-6 md:w-6" />}
                            </button>
                            <button
                                onClick={toggleCamera}
                                className={`h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 ${isCameraOn
                                    ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600'
                                    : 'bg-red-500/90 hover:bg-red-600 text-white border border-red-400'
                                    }`}
                                title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
                            >
                                {isCameraOn ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Check your appearance and audio before joining the session.
                    </p>
                </div>

                {/* Right Column: Controls & Instructions */}
                <div className="w-full max-w-sm space-y-6">
                    {session && (
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
                                    <Settings className="h-4 w-4" />
                                    <h3>Session Details</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium text-foreground">{session.interview_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <span className="text-muted-foreground">Position</span>
                                        <span className="font-medium text-foreground">{session.position}</span>
                                    </div>
                                    {session.config?.companyInterviewConfig && (
                                        <>
                                            {/* Coming Soon Banner */}
                                            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 p-3 mb-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                                                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                        Coming Soon
                                                    </span>
                                                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                                                </div>
                                                <p className="text-xs text-center text-amber-700 dark:text-amber-300 mt-1">
                                                    Company-specific interviews are under development
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-center p-2 rounded-md bg-primary/10 border border-primary/20">
                                                <span className="text-muted-foreground">Company</span>
                                                <span className="font-semibold text-primary">{session.config.companyInterviewConfig.companyName}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                                <span className="text-muted-foreground">Role</span>
                                                <span className="font-medium text-foreground">{session.config.companyInterviewConfig.role}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                                <span className="text-muted-foreground">Experience Level</span>
                                                <span className="font-medium text-foreground">{session.config.companyInterviewConfig.experienceLevel}</span>
                                            </div>
                                        </>
                                    )}
                                    {session.config?.difficulty && (
                                        <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                            <span className="text-muted-foreground">Difficulty</span>
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${session.config.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                                session.config.difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                                    'bg-red-500/10 text-red-600 dark:text-red-400'
                                                }`}>
                                                {session.config.difficulty}
                                            </span>
                                        </div>
                                    )}
                                    {session.config?.skills && session.config.skills.length > 0 && (
                                        <div className="p-2 rounded-md bg-muted/50">
                                            <span className="text-muted-foreground text-xs block mb-2">Skills to be assessed</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {session.config.skills.map((skill, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {session.config?.jobDescription && (
                                        <div className="p-2 rounded-md bg-muted/50">
                                            <span className="text-muted-foreground text-xs block mb-2">Job Description</span>
                                            <p className="text-xs text-foreground line-clamp-3 hover:line-clamp-none transition-all cursor-pointer" title={session.config.jobDescription}>
                                                {session.config.jobDescription}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Ready to join?</h2>
                            <p className="text-muted-foreground text-sm">The AI interviewer is waiting for you.</p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                size="lg"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                                onClick={handleStart}
                                disabled={isLoading || subscriptionLoading || !allowed}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Connecting...
                                    </>
                                ) : !allowed ? (
                                    "Daily Limit Reached"
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Start Interview Now
                                    </>
                                )}
                            </Button>

                            {!isMicOn && !isCameraOn && (
                                <p className="text-xs text-red-500 font-medium bg-red-500/10 py-2 rounded-md animate-pulse">Please enable microphone and camera access</p>
                            )}
                            {(!isMicOn && isCameraOn) && (
                                <p className="text-xs text-red-500 font-medium bg-red-500/10 py-2 rounded-md animate-pulse">Please enable microphone access</p>
                            )}
                            {(isMicOn && !isCameraOn) && (
                                <p className="text-xs text-red-500 font-medium bg-red-500/10 py-2 rounded-md animate-pulse">Please enable camera access</p>
                            )}
                        </div>
                    </div>



                    <div className="space-y-4 pt-2">
                        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-center">Instructions</h3>
                        <ul className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Enable camera and microphone permissions</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Find a quiet, well-lit environment</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Speak clearly and naturally</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Ensure stable internet connection</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </main>

            <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Low Time Warning</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have only {remaining_minutes} minutes remaining in your subscription.
                            The interview will automatically end when your time runs out.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={proceedToStart}>Continue Anyway</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
