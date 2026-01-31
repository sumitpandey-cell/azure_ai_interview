"use client";
import { cn } from "@/lib/utils";
import {
    useConnectionState,
    useLocalParticipant,
    useVoiceAssistant,
    useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import {
    PhoneOff,
    Video,
    VideoOff,
    MessageSquare,
    X,
    User,
    AlertTriangle,
    Zap,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { TranscriptionTile } from "./transcriptions/TranscriptionTile";
import { TranscriptTracker } from "./transcriptions/TranscriptTracker";
import { CircularBlobVisualizer } from "./ui/CircularBlobVisualizer";
import { type InterviewSession } from "@/services/interview.service";
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
    const { state: agentState, audioTrack: agentAudioTrack } =
        useVoiceAssistant();
    const isAISpeaking = agentState === "speaking";
    const room = useRoomContext();

    const [hasSignaledReady, setHasSignaledReady] = useState(false);
    const [showTranscript, setShowTranscript] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
    const [showDetails, setShowDetails] = useState(false);
    const [isEndCallDialogOpen, setIsEndCallDialogOpen] = useState(false);
    const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

    // Reset signal on disconnection to allow re-signaling on reconnection
    useEffect(() => {
        if (roomState === ConnectionState.Disconnected) {
            setHasSignaledReady(false);
        }
    }, [roomState]);

    useEffect(() => {
        if (!hasSignaledReady && agentState !== 'idle' && agentState !== 'connecting') {
            setHasSignaledReady(true);
            onAgentReady?.();
        }
    }, [agentState, hasSignaledReady, onAgentReady]);

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

        const handleDataReceived = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
            if (topic === "hint_response") {
                try {
                    const decoder = new TextDecoder();
                    const message = decoder.decode(payload);
                    const data = JSON.parse(message);

                    if (data.type === "hint_response" && data.hint) {
                        setCurrentHint(data.hint);
                        setShowHintDialog(true);
                        setIsHintLoading(false);
                    }
                } catch {
                    setIsHintLoading(false);
                }
            }
        };

        room.on("dataReceived", handleDataReceived);
        return () => {
            room.off("dataReceived", handleDataReceived);
        };
    }, [room]);

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
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({ type: "hint_request" }));
            await localParticipant.publishData(data, {
                reliable: true,
                topic: "hint_request"
            });
            setHintCooldown(true);
            setCooldownSeconds(30);
            setTimeout(() => {
                setIsHintLoading(false);
            }, 10000);
        } catch (error) {
            console.error("Failed to request hint:", error);
            setIsHintLoading(false);
        }
    };

    const desktopVideoRef = useRef<HTMLVideoElement>(null);
    const mobileVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoTrack = Array.from(localParticipant.videoTrackPublications.values())
            .map(pub => pub.track)
            .find(track => track?.source === Track.Source.Camera);

        if (videoTrack) {
            if (desktopVideoRef.current) {
                videoTrack.attach(desktopVideoRef.current);
            }
            if (mobileVideoRef.current) {
                videoTrack.attach(mobileVideoRef.current);
            }
        }
    }, [localParticipant, isCameraEnabled, localParticipant.videoTrackPublications]);

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

            <div className="fixed inset-0 bg-background text-muted-foreground flex flex-col overflow-hidden font-sans select-none">

                {/* Background Ambient Glows */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-accent/10 dark:bg-accent/5 rounded-full blur-[100px]" />
                </div>

                <main className="flex-1 relative flex flex-col lg:flex-row gap-0 lg:gap-4 overflow-hidden z-10 p-2 lg:p-4">

                    {/* Left Panel (Desktop Details) / (Mobile Dropdown) */}
                    <aside
                        className={cn(
                            "z-40 lg:z-10 lg:flex-[2] lg:min-w-[300px] bg-background/98 dark:bg-card/40 lg:bg-card dark:lg:bg-card/20 backdrop-blur-md lg:backdrop-blur-xl border-b lg:border border-border dark:border-white/5 lg:rounded-[24px] flex flex-col p-3 lg:p-4 shadow-2xl overflow-hidden transition-all duration-300",
                            "absolute top-0 left-0 right-0 lg:relative lg:flex lg:h-full lg:transform-none",
                            showDetails ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto"
                        )}
                    >
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Session Info</span>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary uppercase">Active</div>
                                        <button
                                            onClick={() => setShowDetails(false)}
                                            className="lg:hidden p-1 rounded-full bg-muted border border-border dark:border-white/10 text-muted-foreground hover:bg-muted/80 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Position</span>
                                        <div className="text-xs font-semibold text-foreground bg-muted border border-border dark:bg-white/5 dark:border-white/5 p-3 rounded-xl">
                                            {sessionData?.position || "Software Engineer"}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Level</span>
                                            <div className="text-[10px] font-medium text-primary bg-primary/5 p-2 rounded-lg border border-primary/10 text-center uppercase">
                                                {sessionData?.difficulty || "Mid"}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Type</span>
                                            <div className="text-[10px] font-medium text-accent bg-accent/5 p-2 rounded-lg border border-accent/10 text-center uppercase">
                                                {sessionData?.interview_type || "Technical"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Input desktop */}
                            <div className="hidden lg:flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Video className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Viewfinder</span>
                                </div>
                                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border dark:border-white/10 ring-1 ring-border/20 dark:ring-white/5">
                                    <video
                                        ref={desktopVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className={cn("w-full h-full object-cover transition-opacity duration-500", isCameraEnabled ? "opacity-100" : "opacity-0")}
                                    />
                                    {!isCameraEnabled && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <User className="h-8 w-8 text-white/10" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold">Connection</span>
                                    <span className="text-[9px] text-primary font-mono lowercase">stable</span>
                                </div>
                                <div className="h-1 bg-muted border border-border dark:bg-white/5 dark:border-none rounded-full overflow-hidden flex gap-0.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className={cn("h-full flex-1 rounded-sm", i <= 6 ? 'bg-primary/80 shadow-[0_0_8px_rgba(168_85,247,0.4)]' : 'bg-white/10')} />
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Close Button */}
                            <button
                                onClick={() => setShowDetails(false)}
                                className="lg:hidden w-full py-3 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white transition-colors"
                            >
                                Close Details
                            </button>
                        </div>
                    </aside>

                    {/* Middle Column (Main Core) */}
                    <div className="flex-1 lg:flex-[3] lg:min-w-[400px] flex flex-col relative min-h-0 bg-transparent group">
                        <div className="flex-1 bg-card dark:bg-card/20 backdrop-blur-md border border-border dark:border-white/5 lg:rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col items-center justify-center">

                            {/* Floating Timer & Status */}
                            <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-50 flex items-center gap-2 lg:gap-3">
                                {/* Mobile Details Toggle (replaced header toggle) */}
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="lg:hidden flex items-center gap-2 bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-full px-3 py-2 text-foreground/70 dark:text-white/70 backdrop-blur-md shadow-sm"
                                >
                                    <span className="text-xs font-bold">Info</span>
                                    {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>

                                <div className={cn(
                                    "px-4 py-2 rounded-full border flex items-center gap-2 transition-all backdrop-blur-md",
                                    isCriticalTime ? "bg-destructive/20 border-destructive/40 text-destructive" : "bg-muted dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isCriticalTime ? "bg-destructive animate-pulse" : "bg-primary shadow-[0_0_8px_rgba(168_85,247,0.5)]")} />
                                    <span className="text-xs font-mono font-bold tracking-tight">{formatTime()}</span>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 bg-card dark:bg-white/5 px-3 py-2 rounded-full border border-border dark:border-white/5 backdrop-blur-md shadow-sm">
                                    <div className={`w-1.5 h-1.5 rounded-full ${roomState === ConnectionState.Connected ? "bg-primary shadow-[0_0_8px_rgba(168_85,247,0.5)]" : "bg-destructive animate-pulse"}`} />
                                    <span className="text-[10px] uppercase font-bold tracking-tight text-foreground/70 dark:text-white/70">
                                        {roomState === ConnectionState.Connected ? "Link Stable" : "Wait"}
                                    </span>
                                </div>
                            </div>

                            {/* Label floating desktop */}
                            <div className="absolute top-8 left-8 hidden lg:flex items-center gap-2 opacity-40">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Neural Interface v2</span>
                            </div>

                            {/* Center AI Visualization */}
                            <div className="relative flex items-center justify-center w-full h-[60%] lg:h-full">
                                <div className={cn(
                                    "absolute w-[70vw] h-[70vw] lg:w-[400px] lg:h-[400px] rounded-full blur-[100px] transition-all duration-1000",
                                    isAISpeaking ? 'bg-primary/15 scale-110' : 'bg-white/5 scale-100'
                                )} />

                                <div className="relative z-10 w-[240px] h-[240px] lg:w-[380px] lg:h-[380px] flex items-center justify-center">
                                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 opacity-20">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-foreground dark:text-white" />
                                        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-foreground dark:text-white" />
                                    </svg>

                                    {roomState === ConnectionState.Connected && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <CircularBlobVisualizer
                                                state={agentState}
                                                agentTrackRef={agentAudioTrack}
                                                localTrack={localMicTrack}
                                                size={typeof window !== 'undefined' ? (window.innerWidth < 1024 ? 240 : 380) : 380}
                                                className="transition-transform duration-500 will-change-transform"
                                            />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <h2 className={cn("text-xl lg:text-3xl font-black tracking-tighter transition-all duration-500", isAISpeaking ? 'scale-110' : 'scale-100')}>
                                            <span className="bg-gradient-to-r from-primary via-foreground dark:via-white to-accent bg-clip-text text-transparent">ARJUNA</span>
                                        </h2>
                                        <span className="text-[8px] lg:text-[10px] font-bold text-muted-foreground tracking-[0.4em] uppercase">AI ASSISTANT</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Mobile Video (PiP) */}
                            <div className="lg:hidden absolute bottom-4 right-4 z-40 transform transition-all duration-300">
                                <div
                                    className="w-28 h-40 bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl ring-1 ring-black/50"
                                >
                                    <video
                                        ref={mobileVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className={cn("w-full h-full object-cover", isCameraEnabled ? "opacity-100" : "opacity-0")}
                                    />
                                    {!isCameraEnabled && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                            <User className="h-6 w-6 text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[8px] font-bold text-white uppercase tracking-tighter">You</div>
                                </div>
                            </div>

                            {/* Branding Mobile Footer */}
                            <div className="absolute bottom-4 lg:bottom-6 w-full flex justify-center opacity-20 hidden lg:flex">
                                <span className="text-[8px] text-muted-foreground uppercase tracking-[0.5em] font-medium">Quantum Logic Processor</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel (Transcript) */}
                    <aside
                        className={cn(
                            "fixed lg:relative inset-y-0 right-0 z-50 w-full lg:flex-[2] lg:min-w-[300px] bg-background lg:bg-card dark:lg:bg-card/20 backdrop-blur-2xl lg:backdrop-blur-xl lg:rounded-[24px] border-l lg:border border-border dark:border-white/5 flex flex-col shadow-2xl overflow-hidden transition-all duration-300",
                            showTranscript ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                        )}
                    >
                        <div className="px-4 py-3 flex items-center justify-between border-b border-border dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-accent" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground dark:text-white/80">Transcript</span>
                            </div>
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={() => setShowTranscript(false)} />
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {agentAudioTrack ? (
                                <TranscriptionTile agentAudioTrack={agentAudioTrack} accentColor="purple" />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                                    <div className="w-6 h-6 rounded-full border border-white/10 border-t-primary animate-spin" />
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Initalizing Link</span>
                                </div>
                            )}
                        </div>
                    </aside>
                </main>

                {/* --- FLOATING CONTROLS --- */}
                <div className={cn(
                    "fixed z-[100] transition-all duration-500 ease-in-out will-change-transform",
                    isControlsCollapsed
                        ? "bottom-4 left-4 translate-x-0"
                        : "bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2"
                )}>
                    <div
                        className="bg-card dark:bg-card/40 backdrop-blur-3xl border border-border dark:border-white/10 rounded-[40px] p-1.5 lg:px-4 lg:py-2 flex items-center shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-border/50 dark:ring-white/5 overflow-hidden transition-all duration-300"
                    >
                        {/* Collapse/Expand Toggle */}
                        <button
                            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
                            className="w-10 h-10 lg:w-10 lg:h-10 rounded-full flex items-center justify-center bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0 z-20"
                            title={isControlsCollapsed ? "Expand Controls" : "Collapse Controls"}
                        >
                            {isControlsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>

                        <div
                            className={cn(
                                "flex items-center justify-center whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out will-change-[max-width,opacity,gap]",
                                isControlsCollapsed ? "max-w-0 opacity-0 gap-0 px-0 invisible" : "max-w-[600px] opacity-100 gap-4 lg:gap-6 px-4 visible"
                            )}
                        >
                            {/* Audio Toggle */}
                            <button
                                onClick={toggleMute}
                                className={cn(
                                    "flex flex-col items-center gap-1 group transition-all outline-none shrink-0",
                                    !isMicrophoneEnabled ? "text-destructive" : "text-muted-foreground dark:text-white/60 hover:text-primary"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border transition-all",
                                    !isMicrophoneEnabled ? "bg-destructive/10 border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-muted dark:bg-white/5 border-border dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 hover:shadow-md"
                                )}>
                                    {!isMicrophoneEnabled ? <MessageSquare className="h-4 w-4 rotate-180" /> : <MessageSquare className="h-4 w-4" />}
                                </div>
                                <span className="text-[7px] lg:text-[8px] uppercase font-bold tracking-[0.2em]">{!isMicrophoneEnabled ? 'Unmute' : 'Mute'}</span>
                            </button>

                            {/* Camera Toggle */}
                            <button
                                onClick={toggleCamera}
                                className={cn(
                                    "flex flex-col items-center gap-1 group transition-all outline-none shrink-0",
                                    !isCameraEnabled ? "text-destructive" : "text-muted-foreground dark:text-white/60 hover:text-primary"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border transition-all",
                                    !isCameraEnabled ? "bg-destructive/10 border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-muted dark:bg-white/5 border-border dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 hover:shadow-md"
                                )}>
                                    {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                                </div>
                                <span className="text-[7px] lg:text-[8px] uppercase font-bold tracking-[0.2em]">{isCameraEnabled ? 'Video' : 'No Video'}</span>
                            </button>

                            {/* Hint Button */}
                            <button
                                onClick={requestHint}
                                disabled={isHintLoading || hintCooldown}
                                className={cn(
                                    "flex flex-col items-center gap-1 transition-all outline-none group shrink-0",
                                    hintCooldown ? "opacity-40 cursor-not-allowed" : "text-amber-500 hover:text-amber-400"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border transition-all shadow-lg",
                                    isHintLoading ? "bg-amber-500/20 animate-pulse border-amber-500/40" : "bg-amber-500/5 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-500"
                                )}>
                                    <Zap className={cn("h-4 w-4", isHintLoading && "animate-bounce")} />
                                </div>
                                <span className="text-[7px] lg:text-[8px] uppercase font-bold tracking-[0.2em]">
                                    {hintCooldown ? `${cooldownSeconds}s` : 'Hint'}
                                </span>
                            </button>

                            {/* Transcript Toggle */}
                            <button
                                onClick={() => setShowTranscript(!showTranscript)}
                                className={cn(
                                    "flex flex-col items-center gap-1 group transition-all outline-none shrink-0",
                                    showTranscript ? "text-primary" : "text-muted-foreground dark:text-white/60 hover:text-primary"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border transition-all",
                                    showTranscript ? "bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(168_85,247,0.3)]" : "bg-muted dark:bg-white/5 border-border dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 hover:shadow-md"
                                )}>
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <span className="text-[7px] lg:text-[8px] uppercase font-bold tracking-[0.2em]">Chat</span>
                            </button>

                            {/* End Call Button */}
                            <button
                                onClick={handleEndCall}
                                className="flex flex-col items-center gap-1 transition-all text-red-500 hover:text-red-400 group outline-none shrink-0"
                            >
                                <div className="w-10 h-10 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border border-red-500/20 bg-red-500/10 group-hover:bg-red-500 group-hover:text-white transition-all shadow-lg shadow-red-500/10 group-hover:shadow-red-500/30">
                                    <PhoneOff className="h-4 w-4" />
                                </div>
                                <span className="text-[7px] lg:text-[8px] uppercase font-bold tracking-[0.2em] text-red-500/80">Leave</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={isEndCallDialogOpen} onOpenChange={setIsEndCallDialogOpen}>
                <AlertDialogContent className="rounded-[24px] p-6 lg:p-8 border border-border dark:border-white/10 shadow-3xl bg-card/95 dark:bg-card/90 backdrop-blur-2xl max-w-sm mx-auto">
                    <AlertDialogHeader className="space-y-4">
                        <div className="h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertTriangle className="h-7 w-7 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-xl lg:text-2xl font-bold text-foreground text-center">End Session?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground text-center leading-relaxed">
                            Are you sure you want to end this interview session? Your progress will be saved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl font-semibold text-xs border border-border dark:border-white/10 text-foreground hover:bg-muted dark:hover:bg-white/5 transition-all outline-none">
                            Continue
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmEndCall}
                            className="flex-1 h-12 rounded-xl font-bold text-xs bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all"
                        >
                            End Interview
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {
                currentHint && (
                    <HintDialog
                        open={showHintDialog}
                        onOpenChange={setShowHintDialog}
                        hintText={currentHint}
                        hintsUsed={hintsUsed}
                    />
                )
            }
        </TranscriptProvider >
    );
}

