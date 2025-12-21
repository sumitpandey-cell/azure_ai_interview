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
import { LoadingSVG } from "./ui/LoadingSVG";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArjunaLoader, BowLoader } from "@/components/ArjunaLoader";
import { TranscriptProvider } from "@/contexts/TranscriptContext";
import "@/styles/arjuna-animations.css";

interface LiveInterviewSessionProps {
    onEndSession: () => void;
    timeElapsed: number;
    formatTime: (seconds: number) => string;
    initialMicEnabled?: boolean;
    initialCameraEnabled?: boolean;
}

export function LiveInterviewSession({
    onEndSession,
    timeElapsed,
    formatTime,
    initialMicEnabled = true,
    initialCameraEnabled = true,
}: LiveInterviewSessionProps) {
    const roomState = useConnectionState();
    const { localParticipant } = useLocalParticipant();
    const { state: agentState, audioTrack: agentAudioTrack, agent } =
        useVoiceAssistant();
    const room = useRoomContext();

    const [isMuted, setIsMuted] = useState(!initialMicEnabled);
    const [cameraEnabled, setCameraEnabled] = useState(initialCameraEnabled);
    const [showTranscript, setShowTranscript] = useState(false);

    // Track local media state
    useEffect(() => {
        // Sync initial state
        setIsMuted(!localParticipant.isMicrophoneEnabled);
        setCameraEnabled(localParticipant.isCameraEnabled);
    }, [localParticipant]);

    // Set initial mic/camera state when room connects (respect user's setup choice)
    useEffect(() => {
        if (roomState === ConnectionState.Connected) {
            localParticipant.setMicrophoneEnabled(initialMicEnabled);
            localParticipant.setCameraEnabled(initialCameraEnabled);
            setIsMuted(!initialMicEnabled);
            setCameraEnabled(initialCameraEnabled);
        }
    }, [roomState, localParticipant, initialMicEnabled, initialCameraEnabled]);

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
            room.disconnect();
            onEndSession();
        }
    };

    // Status text based on room state and agent state
    const getStatusText = () => {
        // If room is not connected, show room status
        if (roomState !== ConnectionState.Connected) {
            switch (roomState) {
                case ConnectionState.Connecting:
                    return "Connecting...";
                case ConnectionState.Reconnecting:
                    return "Reconnecting...";
                case ConnectionState.Disconnected:
                    return "Disconnected";
                default:
                    return "Initializing...";
            }
        }

        // Room is connected, show AI agent status
        if (!agent) {
            return "Waiting for AI...";
        }

        switch (agentState) {
            case "listening":
                return "AI Listening";
            case "thinking":
                return "AI Thinking";
            case "speaking":
                return "AI Speaking";
            default:
                return "AI Connected";
        }
    };

    const status = getStatusText();
    const isAISpeaking = agentState === "speaking";

    // Determine status color based on state
    const getStatusColor = () => {
        if (roomState !== ConnectionState.Connected) {
            return roomState === ConnectionState.Connecting || roomState === ConnectionState.Reconnecting
                ? "text-yellow-400"
                : "text-red-400";
        }

        if (!agent) {
            return "text-yellow-400";
        }

        return "text-green-400";
    };

    const statusColor = getStatusColor();

    // Replicate the video element for local camera
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && localParticipant) {
            const track = localParticipant.getTrackPublication(Track.Source.Camera)?.track;
            if (track) {
                track.attach(videoRef.current);
            } else {
                // Handle case where track might be muted/missing
            }
        }
        return () => {
            // Cleanup if needed
        }
    }, [localParticipant, cameraEnabled]);

    // We actually need to attach the track whenever it changes
    useEffect(() => {
        const handleTrackSubscribed = (track: any) => {
            if (track.kind === Track.Kind.Video && track.source === Track.Source.Camera && videoRef.current) {
                track.attach(videoRef.current);
            }
        };

        // The LocalParticipant track handling is a bit specific in LiveKit components
        // Usually <VideoTrack> is used. I'll use <VideoTrack> if I can import it, otherwise manual attach.
        // Let's rely on manual attach for now or check if I can import VideoTrack.
        // I'll stick to manual attach logic similar to page.tsx but properly hooked.
        const videoTrack = Array.from(localParticipant.videoTrackPublications.values())
            .map(pub => pub.track)
            .find(track => track?.source === Track.Source.Camera);

        if (videoTrack && videoRef.current) {
            videoTrack.attach(videoRef.current);
        }

    }, [localParticipant, cameraEnabled, localParticipant.videoTrackPublications]);


    return (
        <TranscriptProvider>
            <div className="min-h-screen bg-black relative overflow-hidden text-white">
                {/* Main Video Area */}
                <div className="absolute inset-0">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-300 ${cameraEnabled ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                    />
                    <div
                        className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-300 ${cameraEnabled ? "opacity-0 pointer-events-none" : "opacity-100"
                            }`}
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
                        }}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Status Bar - Branding */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Brain className="h-6 w-6 text-blue-400" />
                            <h1 className="text-xl font-extrabold tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-violet-300">
                                    ARJUNA
                                </span>
                                <span className="text-white/40 ml-1 text-sm">AI</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* AI Status Box with Timer */}
                <div className="absolute top-4 right-4 z-10 w-fit">
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 min-w-[280px]">
                        {/* Avatar Section */}
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

                        {/* Name and Status */}
                        <div className="flex-1">
                            <p className="text-white font-semibold text-sm">Arjuna AI</p>
                            <p className={`text-xs flex items-center gap-2 ${statusColor}`}>
                                <span className={`w-2 h-2 rounded-full ${statusColor === "text-green-400"
                                    ? "bg-green-500 animate-pulse"
                                    : statusColor === "text-yellow-400"
                                        ? "bg-yellow-500 animate-pulse"
                                        : "bg-red-500"
                                    }`} />
                                {status}
                            </p>
                        </div>

                        {/* Timer */}
                        <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-white font-mono text-sm">{formatTime(timeElapsed)}</span>
                        </div>

                        {/* Visualizer or Loader */}
                        <div className="h-10 w-16 flex items-center justify-center">
                            {roomState === ConnectionState.Connecting || agentState === "connecting" ? (
                                <BowLoader size="tiny" />
                            ) : roomState === ConnectionState.Connected && agentAudioTrack ? (
                                <BarVisualizer
                                    state={agentState}
                                    trackRef={agentAudioTrack}
                                    barCount={4}
                                    options={{ minHeight: 4, maxHeight: 24 }}
                                    style={{ color: "#60a5fa" }}
                                    className="h-full w-full"
                                />
                            ) : (
                                <div className="text-xs text-white">...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Avatar (when camera off) */}
                {!cameraEnabled && (
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
                )}

                {/* Control Bar */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-black/80 backdrop-blur-md rounded-full p-2 flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className={`w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center ${isMuted ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30" : "bg-slate-700 hover:bg-slate-600"
                                }`}
                        >
                            {isMuted ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-lg shadow-red-500/30"
                        >
                            <PhoneOff className="h-6 w-6 text-white" />
                        </button>
                        <button
                            onClick={toggleCamera}
                            className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 transition-all duration-200 flex items-center justify-center"
                        >
                            {cameraEnabled ? <Video className="h-6 w-6 text-white" /> : <VideoOff className="h-6 w-6 text-white" />}
                        </button>
                        <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            className={`w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center ${showTranscript ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30" : "bg-slate-700 hover:bg-slate-600"
                                }`}
                        >
                            <MessageSquare className="h-6 w-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Transcript Sidebar */}
                {showTranscript && (
                    <div className="fixed lg:absolute top-0 right-0 h-full w-full max-w-md lg:max-w-sm bg-black/90 backdrop-blur-md border-l border-slate-700/50 z-20 flex flex-col">
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="font-semibold text-white">Live Transcript</h3>
                            <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            {agentAudioTrack ? (
                                <div className="h-full w-full">
                                    <TranscriptionTile agentAudioTrack={agentAudioTrack} accentColor="blue" />
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 mt-10">Waiting for agent audio...</div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </TranscriptProvider>
    );
}


// Helper for connection state enum usage if needed, though imported
const connectionState = ConnectionState;
