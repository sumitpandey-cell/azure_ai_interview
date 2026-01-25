"use client";
import { cn } from "@/lib/utils";
import {
    useConnectionState,
    useLocalParticipant,
    useVoiceAssistant,
    useRoomContext,
    BarVisualizer,
} from "@livekit/components-react";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import {
    Mic,
    MicOff,
    PhoneOff,
    Video,
    VideoOff,
    MessageSquare,
    X,
    User,
    Brain,
    AlertTriangle,
    Zap,
    LifeBuoy,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { TranscriptionTile } from "./transcriptions/TranscriptionTile";
import { TranscriptTracker } from "./transcriptions/TranscriptTracker";
import { LoadingSVG } from "./ui/LoadingSVG";
import { CircularBlobVisualizer } from "./ui/CircularBlobVisualizer";
import { interviewService, type InterviewSession } from "@/services/interview.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArjunaLoader, BowLoader } from "@/components/ArjunaLoader";
import { TranscriptProvider, TranscriptEntry } from "@/contexts/TranscriptContext";
import { HintDialog } from "./HintDialog";
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
import "@/styles/arjuna-animations.css";

interface LiveInterviewSessionProps {
    sessionId: string;
    userId: string;
    onEndSession: (hintsToUse?: number, skipRedirect?: boolean) => void;
    remainingMinutes: number;
    remainingSeconds: number;
    isLowTime: boolean;
    isCriticalTime: boolean;
    formatTime: () => string;
    initialMicEnabled?: boolean;
    initialCameraEnabled?: boolean;
    initialTranscripts?: TranscriptEntry[];
    sessionData?: InterviewSession | null;
    onAgentReady?: () => void;
    onHintsUpdate?: (count: number) => void;
    isEnding?: boolean;
}

export function LiveInterviewSession({
    sessionId,
    userId,
    onEndSession,
    isCriticalTime,
    formatTime,
    initialMicEnabled = true,
    initialCameraEnabled = true,
    initialTranscripts = [],
    sessionData = null,
    onAgentReady,
    onHintsUpdate,
    isEnding = false,
}: LiveInterviewSessionProps) {
    const roomState = useConnectionState();
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const { state: agentState, audioTrack: agentAudioTrack, agent } =
        useVoiceAssistant();
    const room = useRoomContext();

    const [hasSignaledReady, setHasSignaledReady] = useState(false);

    // Reset signal on disconnection to allow re-signaling on reconnection
    useEffect(() => {
        if (roomState === ConnectionState.Disconnected) {
            setHasSignaledReady(false);
        }
    }, [roomState]);

    useEffect(() => {
        if (!hasSignaledReady && agentState !== 'idle' && agentState !== 'connecting') {
            console.log("🤖 Agent is ready, signaling timer start...");
            setHasSignaledReady(true);
            onAgentReady?.();
        }
    }, [agentState, hasSignaledReady, onAgentReady]);

    const [showTranscript, setShowTranscript] = useState(true);
    const [isEndCallDialogOpen, setIsEndCallDialogOpen] = useState(false);

    // Set initial mic/camera state
    useEffect(() => {
        if (roomState === ConnectionState.Connected) {
            localParticipant.setMicrophoneEnabled(initialMicEnabled);
            localParticipant.setCameraEnabled(initialCameraEnabled);
        }
    }, [roomState, localParticipant, initialMicEnabled, initialCameraEnabled]);

    const toggleMute = async () => {
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    };

    const toggleCamera = async () => {
        await localParticipant.setCameraEnabled(!isCameraEnabled);
    };

    const handleEndCall = () => {
        setIsEndCallDialogOpen(true);
    };

    const confirmEndCall = () => {
        // Pass hints used to the end session handler
        onEndSession(hintsUsed);
        setTimeout(() => {
            room.disconnect();
        }, 100);
        setIsEndCallDialogOpen(false);
    };

    const [isHintLoading, setIsHintLoading] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [showHintDialog, setShowHintDialog] = useState(false);
    const [hintCooldown, setHintCooldown] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // Listen for hint responses from the agent
    useEffect(() => {
        if (!room) return;

        const handleDataReceived = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
            console.log("🔔 [HINT DEBUG] Data received - Topic:", topic, "Participant:", participant);

            if (topic === "hint_response") {
                try {
                    const decoder = new TextDecoder();
                    const message = decoder.decode(payload);
                    console.log("📨 [HINT DEBUG] Raw message:", message);
                    const data = JSON.parse(message);

                    console.log("💡 Hint response received:", data);

                    if (data.type === "hint_response" && data.hint) {
                        console.log("✅ [HINT DEBUG] Setting hint and showing dialog");
                        setCurrentHint(data.hint);
                        setShowHintDialog(true);
                        setIsHintLoading(false);
                    } else {
                        console.warn("⚠️ [HINT DEBUG] Data missing type or hint:", data);
                    }
                } catch (error) {
                    console.error("❌ [HINT DEBUG] Failed to parse hint response:", error);
                    setIsHintLoading(false);
                }
            } else {
                console.log("ℹ️ [HINT DEBUG] Ignoring data with topic:", topic);
            }
        };

        room.on("dataReceived", handleDataReceived);

        return () => {
            room.off("dataReceived", handleDataReceived);
        };
    }, [room]);

    // Cooldown timer effect
    useEffect(() => {
        if (hintCooldown && cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (cooldownSeconds === 0 && hintCooldown) {
            setHintCooldown(false);
        }
    }, [hintCooldown, cooldownSeconds]);

    const requestHint = async () => {
        if (isHintLoading || hintCooldown) return;

        setIsHintLoading(true);
        const newCount = hintsUsed + 1;
        setHintsUsed(newCount);
        onHintsUpdate?.(newCount);

        try {
            // Encode data message
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({ type: "hint_request" }));

            // Send reliable data message to all participants (agent)
            await localParticipant.publishData(data, {
                reliable: true,
                topic: "hint_request"
            });

            // Start cooldown timer (30 seconds)
            setHintCooldown(true);
            setCooldownSeconds(30);

            // Auto-clear loading state after 10 seconds if no response
            setTimeout(() => {
                setIsHintLoading(false);
            }, 10000);
        } catch (error) {
            console.error("Failed to request hint:", error);
            setIsHintLoading(false);
        }
    };

    const isAISpeaking = agentState === "speaking";

    // Video Ref for Local Participant
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoTrack = Array.from(localParticipant.videoTrackPublications.values())
            .map(pub => pub.track)
            .find(track => track?.source === Track.Source.Camera);

        if (videoTrack && videoRef.current) {
            videoTrack.attach(videoRef.current);
        }
    }, [localParticipant, isCameraEnabled, localParticipant.videoTrackPublications]);

    // Local Mic Track for Visualizer
    const { microphoneTrack } = useLocalParticipant();
    const [localMicTrack, setLocalMicTrack] = useState<MediaStreamTrack | null>(null);

    useEffect(() => {
        if (microphoneTrack?.track?.mediaStreamTrack) {
            setLocalMicTrack(microphoneTrack.track.mediaStreamTrack);
        } else {
            setLocalMicTrack(null);
        }
    }, [microphoneTrack, microphoneTrack?.track]);

    return (
        <TranscriptProvider initialTranscripts={initialTranscripts}>
            <TranscriptTracker
                sessionId={sessionId}
                userId={userId}
                agentAudioTrack={agentAudioTrack}
                isEnding={isEnding}
            />

            <div className="min-h-screen lg:h-screen w-screen bg-background text-muted-foreground flex flex-col p-3 lg:p-4 overflow-x-hidden overflow-y-auto lg:overflow-hidden font-sans relative">

                {/* Background Ambient Glows */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-visible lg:overflow-hidden relative z-10">

                    {/* Left Column: Input & Details */}
                    <div className="w-full lg:w-[380px] flex flex-col gap-4 order-2 lg:order-1">

                        {/* Visual Input Card */}
                        <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-4 py-3 flex items-center gap-2 border-b border-border/40">
                                <Video className="h-4 w-4 text-primary" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Visual Input</span>
                            </div>
                            <div className="relative aspect-[4/3] bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraEnabled ? "opacity-100" : "opacity-0"}`}
                                />
                                {!isCameraEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                                            <User className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/40" />
                            </div>
                        </div>


                        {/* Interview Details Card */}
                        <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl p-5 flex flex-col gap-5 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Interview Details</span>
                                </div>
                                <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary uppercase tracking-wider">Active</div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Target Position</span>
                                    <div className="text-sm font-semibold text-foreground bg-muted/20 p-3 rounded-xl border border-border/40">
                                        {sessionData?.position || "Software Engineer"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Difficulty</span>
                                        <div className="text-[11px] font-medium text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/10 text-center">
                                            {sessionData?.difficulty || "Intermediate"}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Type</span>
                                        <div className="text-[11px] font-medium text-accent bg-accent/5 p-2.5 rounded-lg border border-accent/10 text-center">
                                            {sessionData?.interview_type || "Technical"}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Connection Stability</span>
                                        <span className="text-[10px] text-primary font-mono lowercase">stable</span>
                                    </div>
                                    <div className="h-1 bg-muted/20 rounded-full overflow-hidden flex gap-0.5">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className={`h-full flex-1 rounded-sm ${i <= 6 ? 'bg-primary/80 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-primary/20'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Status Footer */}
                        <button
                            className="mt-auto px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-red-500/20 transition-colors w-full"
                            onClick={handleEndCall}
                        >
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500/80 group-hover:text-red-500">End Session</span>
                            <PhoneOff className="h-4 w-4 text-red-500" />
                        </button>
                    </div>

                    {/* Middle Column: Core System */}
                    <div className="flex-1 flex flex-col gap-6 relative order-1 lg:order-2 min-h-[500px] lg:min-h-0">
                        <div className="flex-1 bg-card/20 backdrop-blur-md border border-border/40 rounded-[24px] lg:rounded-[32px] overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[400px]">

                            {/* Core Label */}
                            <div className="absolute top-8 left-10 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">AI Interviewer</span>
                            </div>

                            {/* Timer Box */}
                            <div className="absolute top-8 right-10 flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 backdrop-blur-md ${isCriticalTime ? 'bg-destructive/20 border-destructive/50 text-destructive' : 'bg-muted/30 border-border/60 text-foreground'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isCriticalTime ? 'bg-destructive animate-pulse' : 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]'}`} />
                                    <span className="text-xs font-mono font-bold tracking-widest">{formatTime()}</span>
                                </div>
                            </div>

                            {/* Center AI Visualization */}
                            <div className="relative flex items-center justify-center w-full h-full">
                                {/* Glowing Orbs */}
                                <div className={`absolute w-[300px] h-[300px] rounded-full blur-[100px] transition-all duration-1000 ${isAISpeaking ? 'bg-primary/10 scale-110' : 'bg-muted/10 scale-100'
                                    }`} />

                                {/* Inner Particle Sphere (SVG Implementation) */}
                                <div className="relative z-10 w-[240px] h-[240px] flex items-center justify-center">
                                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-border" />
                                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-border" />
                                        {!agentAudioTrack && (
                                            <circle cx="50" cy="50" r="2" fill="currentColor" className="opacity-20 animate-pulse text-muted-foreground" />
                                        )}
                                    </svg>

                                    {/* Dynamic Circular Blob Visualizer */}
                                    {roomState === ConnectionState.Connected && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <CircularBlobVisualizer
                                                state={agentState}
                                                agentTrackRef={agentAudioTrack}
                                                localTrack={localMicTrack}
                                                size={Math.min(240, typeof window !== 'undefined' ? window.innerWidth * 0.5 : 240)}
                                                className="transition-transform duration-500"
                                            />
                                        </div>
                                    )}

                                    {/* Center Text Branding */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <h2 className={`text-2xl font-bold tracking-tighter transition-all duration-500 ${isAISpeaking ? 'scale-110' : 'scale-100'}`}>
                                            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">ARJUNA</span>
                                        </h2>
                                        <span className="text-[9px] font-bold text-muted-foreground tracking-[0.4em] uppercase">AI Assistant</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Center Controls */}
                            <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 lg:gap-3 bg-card/60 backdrop-blur-2xl px-4 lg:px-6 py-3 lg:py-4 rounded-[40px] border border-border/40 shadow-3xl w-[90%] lg:w-auto justify-center ring-1 ring-border/20">
                                <button onClick={toggleCamera} className={`p-2 lg:p-3 rounded-full transition-all ${isCameraEnabled ? 'text-foreground/60 hover:text-foreground hover:bg-muted/20' : 'text-destructive bg-destructive/10'}`}>
                                    {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                </button>

                                <button
                                    onClick={toggleMute}
                                    className={`h-10 lg:h-12 px-6 lg:px-10 rounded-full font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-all border ${!isMicrophoneEnabled
                                        ? 'bg-destructive/10 border-destructive/50 text-destructive'
                                        : 'bg-primary border-primary text-primary-foreground hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                        }`}
                                >
                                    {!isMicrophoneEnabled ? 'Muted' : 'Speaking'}
                                </button>

                                <button
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className={`p-2 lg:p-3 rounded-full transition-all ${showTranscript ? 'text-primary bg-primary/10' : 'text-foreground/60 hover:text-foreground hover:bg-muted/20'}`}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={requestHint}
                                    disabled={isHintLoading || hintCooldown}
                                    title={hintCooldown ? `Cooldown: ${cooldownSeconds}s` : "Request a hint"}
                                    className={cn(
                                        "relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all border group overflow-hidden",
                                        isHintLoading
                                            ? "bg-amber-500/20 border-amber-500/50 text-amber-500 animate-pulse cursor-wait"
                                            : hintCooldown
                                                ? "bg-muted/50 border-border/40 text-muted-foreground/50 cursor-not-allowed"
                                                : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-500 hover:text-amber-950 dark:hover:text-black hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95"
                                    )}
                                >
                                    <Zap className={cn("h-3.5 w-3.5", isHintLoading ? "animate-bounce" : "group-hover:scale-125 transition-transform duration-300")} />
                                    <span className="hidden sm:inline font-bold">
                                        {hintCooldown ? `Locked ${cooldownSeconds}s` : "Get Hint"}
                                    </span>
                                    {hintsUsed > 0 && !hintCooldown && (
                                        <div className="absolute top-0 right-0 h-4 w-4 rounded-bl-lg bg-amber-500/20 flex items-center justify-center text-[7px] font-bold border-l border-b border-amber-500/30">
                                            {hintsUsed}
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Branding Footer */}
                            <div className="absolute bottom-4 w-full flex justify-center pb-2">
                                <span className="text-[7px] text-muted-foreground/40 uppercase tracking-[0.5em] font-bold underline decoration-muted-foreground/20 underline-offset-4">Powered by Arjuna AI v2.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transcript */}
                    {showTranscript && (
                        <div className="w-full lg:w-[360px] flex flex-col gap-4 order-3 h-[500px] lg:h-auto animate-in slide-in-from-bottom lg:slide-in-from-right duration-500">
                            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-border/40">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-accent" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Session Transcript</span>
                                    </div>
                                    <X className="h-3 w-3 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowTranscript(false)} />
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    {agentAudioTrack ? (
                                        <div className="h-full w-full">
                                            <TranscriptionTile
                                                agentAudioTrack={agentAudioTrack}
                                                accentColor="purple"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/20 animate-spin" />
                                            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">Awaiting Active Link</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl px-5 py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] ${roomState === ConnectionState.Connected ? "bg-primary" : "bg-destructive animate-pulse"}`} />
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">
                                        {roomState === ConnectionState.Connected ? "Link Stable" : "Connecting..."}
                                    </span>
                                </div>
                                <div className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-tighter group-hover:text-muted-foreground/50 transition-colors">
                                    ID: {sessionId.slice(0, 8)}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <AlertDialog open={isEndCallDialogOpen} onOpenChange={setIsEndCallDialogOpen}>
                <AlertDialogContent className="rounded-2xl p-8 border border-border/50 shadow-2xl bg-card/90 backdrop-blur-2xl animate-in zoom-in-95 max-w-sm mx-auto">
                    <AlertDialogHeader className="space-y-4">
                        <div className="h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="h-7 w-7 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-foreground text-center">End Session?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground/80 text-center leading-relaxed">
                            Are you sure you want to end this interview session? Your progress will be saved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl font-semibold text-sm bg-muted border-border text-foreground hover:bg-muted/80 transition-all order-2 sm:order-1">
                            Continue Interview
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmEndCall}
                            className="flex-1 h-12 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all order-1 sm:order-2"
                        >
                            End Interview
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Hint Dialog */}
            {currentHint && (
                <HintDialog
                    open={showHintDialog}
                    onOpenChange={setShowHintDialog}
                    hintText={currentHint}
                    hintsUsed={hintsUsed}
                />
            )}
        </TranscriptProvider>
    );
}

const connectionState = ConnectionState;
