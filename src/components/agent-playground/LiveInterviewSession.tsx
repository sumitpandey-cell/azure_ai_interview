"use client";

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
import "@/styles/arjuna-animations.css";

interface LiveInterviewSessionProps {
    sessionId: string;
    onEndSession: () => void;
    remainingMinutes: number;
    remainingSeconds: number;
    isLowTime: boolean;
    isCriticalTime: boolean;
    formatTime: () => string;
    initialMicEnabled?: boolean;
    initialCameraEnabled?: boolean;
    initialTranscripts?: TranscriptEntry[];
    sessionData?: InterviewSession | null;
}

export function LiveInterviewSession({
    sessionId,
    onEndSession,
    remainingMinutes,
    remainingSeconds,
    isLowTime,
    isCriticalTime,
    formatTime,
    initialMicEnabled = true,
    initialCameraEnabled = true,
    initialTranscripts = [],
    sessionData = null,
}: LiveInterviewSessionProps) {
    const roomState = useConnectionState();
    const { localParticipant } = useLocalParticipant();
    const { state: agentState, audioTrack: agentAudioTrack, agent } =
        useVoiceAssistant();
    const room = useRoomContext();

    const [isMuted, setIsMuted] = useState(!initialMicEnabled);
    const [cameraEnabled, setCameraEnabled] = useState(initialCameraEnabled);
    const [showTranscript, setShowTranscript] = useState(true);

    // Set initial mic/camera state
    useEffect(() => {
        if (roomState === ConnectionState.Connected) {
            localParticipant.setMicrophoneEnabled(initialMicEnabled);
            localParticipant.setCameraEnabled(initialCameraEnabled);
            setIsMuted(!initialMicEnabled);
            setCameraEnabled(initialCameraEnabled);
        }
    }, [roomState, localParticipant, initialMicEnabled, initialCameraEnabled]);

    // Sync state with actual track status
    useEffect(() => {
        const interval = setInterval(() => {
            setIsMuted(!localParticipant.isMicrophoneEnabled);
            setCameraEnabled(localParticipant.isCameraEnabled);
        }, 100);
        return () => clearInterval(interval);
    }, [localParticipant]);

    const toggleMute = async () => {
        const newState = !isMuted;
        await localParticipant.setMicrophoneEnabled(!newState);
        setIsMuted(newState);
    };

    const toggleCamera = async () => {
        const newState = !cameraEnabled;
        await localParticipant.setCameraEnabled(newState);
        setCameraEnabled(newState);
    };

    const handleEndCall = () => {
        if (confirm("Are you sure you want to end the interview?")) {
            onEndSession();
            setTimeout(() => {
                room.disconnect();
            }, 100);
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
    }, [localParticipant, cameraEnabled, localParticipant.videoTrackPublications]);

    // Local Mic Track for Visualizer
    const [localMicTrack, setLocalMicTrack] = useState<MediaStreamTrack | null>(null);
    useEffect(() => {
        const micTrack = Array.from(localParticipant.audioTrackPublications.values())
            .map(pub => pub.track)
            .find(track => track?.source === Track.Source.Microphone);

        if (micTrack && micTrack.mediaStreamTrack) {
            setLocalMicTrack(micTrack.mediaStreamTrack);
        } else {
            setLocalMicTrack(null);
        }
    }, [localParticipant, isMuted, localParticipant.audioTrackPublications]);

    return (
        <TranscriptProvider initialTranscripts={initialTranscripts}>
            <TranscriptTracker sessionId={sessionId} agentAudioTrack={agentAudioTrack} />

            <div className="min-h-screen lg:h-screen w-screen bg-[#0A0A0B] text-slate-400 flex flex-col p-3 lg:p-4 overflow-x-hidden overflow-y-auto lg:overflow-hidden font-sans select-none relative">

                {/* Background Ambient Glows */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-visible lg:overflow-hidden relative z-10">

                    {/* Left Column: Input & Details */}
                    <div className="w-full lg:w-[320px] flex flex-col gap-4 order-2 lg:order-1">

                        {/* Visual Input Card */}
                        <div className="bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
                                <Video className="h-4 w-4 text-blue-400" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Visual Input</span>
                            </div>
                            <div className="relative aspect-video bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover transition-opacity duration-500 ${cameraEnabled ? "opacity-100" : "opacity-0"}`}
                                />
                                {!cameraEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <User className="h-8 w-8 text-white/20" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />
                            </div>
                        </div>

                        {/* Interview Details Card */}
                        <div className="bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-5 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-blue-400" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Interview Details</span>
                                </div>
                                <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold text-blue-400 uppercase tracking-wider">Active</div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500 font-bold">Target Position</span>
                                    <div className="text-sm font-semibold text-white/90 bg-white/5 p-3 rounded-xl border border-white/5">
                                        {sessionData?.position || "Software Engineer"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500 font-bold">Difficulty</span>
                                        <div className="text-[11px] font-medium text-blue-400 bg-blue-400/5 p-2.5 rounded-lg border border-blue-400/10 text-center">
                                            {sessionData?.difficulty || "Intermediate"}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500 font-bold">Type</span>
                                        <div className="text-[11px] font-medium text-purple-400 bg-purple-400/5 p-2.5 rounded-lg border border-purple-400/10 text-center">
                                            {sessionData?.interview_type || "Technical"}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500 font-bold">Uplink Quality</span>
                                        <span className="text-[10px] text-green-400 font-mono">EXCELLENT</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className="h-full flex-1 bg-green-500/80 rounded-sm" />
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
                        <div className="flex-1 bg-[#0f1117]/40 backdrop-blur-md border border-white/10 rounded-[24px] lg:rounded-[32px] overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[400px]">

                            {/* Core Label */}
                            <div className="absolute top-8 left-10 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">AI Core Intelligence</span>
                            </div>

                            {/* Timer Box */}
                            <div className="absolute top-8 right-10 flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 backdrop-blur-md ${isCriticalTime ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-white/70'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isCriticalTime ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
                                    <span className="text-xs font-mono font-bold tracking-widest">{formatTime()}</span>
                                </div>
                            </div>

                            {/* Center AI Visualization */}
                            <div className="relative flex items-center justify-center w-full h-full">
                                {/* Glowing Orbs */}
                                <div className={`absolute w-[300px] h-[300px] rounded-full blur-[100px] transition-all duration-1000 ${isAISpeaking ? 'bg-blue-600/20 scale-110' : 'bg-white/5 scale-100'
                                    }`} />

                                {/* Inner Particle Sphere (SVG Implementation) */}
                                <div className="relative z-10 w-[240px] h-[240px] flex items-center justify-center">
                                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-white/10" />
                                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-white/20" />
                                        {!agentAudioTrack && (
                                            <circle cx="50" cy="50" r="2" fill="white" className="opacity-20 animate-pulse" />
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
                                        <h2 className={`text-2xl font-black tracking-tighter transition-all duration-500 ${isAISpeaking ? 'scale-110' : 'scale-100'}`}>
                                            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">ARJUNA</span>
                                        </h2>
                                        <span className="text-[8px] font-bold text-white/30 tracking-[0.4em] uppercase">Intelligence</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Center Controls */}
                            <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 lg:gap-3 bg-[#0f1117]/80 backdrop-blur-2xl px-4 lg:px-6 py-3 lg:py-4 rounded-[40px] border border-white/10 shadow-3xl w-[90%] lg:w-auto justify-center ring-1 ring-white/5">
                                <button onClick={toggleCamera} className={`p-2 lg:p-3 rounded-full transition-all ${cameraEnabled ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-red-400 bg-red-500/10'}`}>
                                    {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                </button>

                                <button
                                    onClick={toggleMute}
                                    className={`h-10 lg:h-12 px-6 lg:px-10 rounded-full font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-all border ${isMuted
                                        ? 'bg-red-500/10 border-red-500/50 text-red-500'
                                        : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                        }`}
                                >
                                    {isMuted ? 'Muted' : 'Speaking'}
                                </button>

                                <button
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className={`p-2 lg:p-3 rounded-full transition-all ${showTranscript ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Branding Footer */}
                            <div className="absolute bottom-4 w-full flex justify-center pb-2">
                                <span className="text-[7px] text-white/20 uppercase tracking-[0.5em] font-bold underline decoration-white/10 underline-offset-4">Powered by Arjuna AI v2.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transcript */}
                    {showTranscript && (
                        <div className="w-full lg:w-[360px] flex flex-col gap-4 order-3 h-[500px] lg:h-auto animate-in slide-in-from-bottom lg:slide-in-from-right duration-500">
                            <div className="flex-1 bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-purple-400" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Session Transcript</span>
                                    </div>
                                    <X className="h-3 w-3 text-white/20 cursor-pointer hover:text-white transition-colors" onClick={() => setShowTranscript(false)} />
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    {agentAudioTrack ? (
                                        <div className="h-full w-full">
                                            <TranscriptionTile
                                                agentAudioTrack={agentAudioTrack}
                                                accentColor="blue"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 animate-spin" />
                                            <span className="text-[10px] text-white/20 uppercase tracking-widest">Awaiting Active Link</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] ${roomState === ConnectionState.Connected ? "bg-blue-500" : "bg-red-500 animate-pulse"}`} />
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/70">
                                        {roomState === ConnectionState.Connected ? "Link Stable" : "Connecting..."}
                                    </span>
                                </div>
                                <div className="text-[8px] font-bold text-white/30 uppercase tracking-tighter group-hover:text-white/50 transition-colors">
                                    ID: {sessionId.slice(0, 8)}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Status Indicator Bar */}
                <div className="h-auto lg:h-12 flex items-center justify-center mt-4 lg:mt-2 pb-4 lg:pb-0 relative">
                    <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-8 px-8 py-3 bg-[#0f1117]/60 backdrop-blur-xl rounded-2xl lg:rounded-full border border-white/10 text-[8px] lg:text-[9px] uppercase tracking-[0.2em] font-bold text-white/40 max-w-[90%] shadow-2xl ring-1 ring-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="hover:text-white/70 transition-colors cursor-default">Real-time Monitoring</span>
                        </div>
                        <div className="hidden lg:block w-[1px] h-3 bg-white/10" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                            <span className="hover:text-white/70 transition-colors cursor-default">Neural Engine Active</span>
                        </div>
                        <div className="hidden lg:block w-[1px] h-3 bg-white/10" />
                        <div className="flex items-center gap-2.5">
                            <span className="text-white/20">Security: <span className="text-green-500/60 lowercase">encrypted</span></span>
                        </div>
                        <div className="hidden lg:block w-[1px] h-3 bg-white/10" />
                        <div className="flex items-center gap-2.5">
                            <span className="text-white/30 hover:text-white/70 transition-colors cursor-default">Build 1.4.2</span>
                        </div>
                    </div>
                </div>
            </div>

        </TranscriptProvider>
    );
}

const connectionState = ConnectionState;
