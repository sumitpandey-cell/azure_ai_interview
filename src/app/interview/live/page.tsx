"use client";

import { Room, RoomEvent, Track } from "livekit-client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
    VideoOff
} from "lucide-react";

export default function LiveInterview() {
    const router = useRouter();
    const [status, setStatus] = useState("Connecting...");
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<Array<{
        speaker: "user" | "ai";
        text: string;
        timestamp: number;
        isComplete: boolean;
    }>>([]);

    const [isMuted, setIsMuted] = useState(false);
    const [showTranscript, setShowTranscript] = useState(true);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [cameraEnabled, setCameraEnabled] = useState(false);

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<Room | null>(null);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let room: Room | null = null;

        const start = async () => {
            try {
                setStatus("Fetching token...");
                const r = await fetch("/api/livekit_token");

                if (!r.ok) {
                    throw new Error(`Failed to fetch token: ${r.statusText}`);
                }

                const { url, token } = await r.json();

                setStatus("Connecting to LiveKit...");
                room = new Room();
                roomRef.current = room;
                await room.connect(url, token);

                setStatus("Connected! Starting microphone...");

                // MIC → LiveKit
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                await room.localParticipant.publishTrack(stream.getAudioTracks()[0]);

                setStatus("Interview active");

                // PLAY AI AUDIO (only from remote participants, not our own audio)
                room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    if (!room) return; // Safety check

                    console.log("🔊 Track subscribed:", {
                        kind: track.kind,
                        participantIdentity: participant.identity,
                        isLocal: participant.isLocal,
                        localIdentity: room.localParticipant?.identity
                    });

                    if (track.kind === Track.Kind.Audio) {
                        // Only play audio from REMOTE participants (AI agent), never from local participant (user)
                        if (!participant.isLocal && participant.identity !== room.localParticipant?.identity) {
                            console.log("✅ Playing AI audio from remote participant:", participant.identity);
                            const audioElement = track.attach();
                            audioElement.autoplay = true;
                            audioElement.volume = 1.0; // Ensure volume is at 100%
                            audioElement.play().catch(e => console.error("❌ Error playing audio:", e));
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

                            setTranscripts((prev) => {
                                // If it's a partial AI transcript, update the last AI entry
                                if (speaker === "ai" && !isComplete) {
                                    const lastIndex = prev.length - 1;
                                    if (lastIndex >= 0 && prev[lastIndex].speaker === "ai" && !prev[lastIndex].isComplete) {
                                        // Update existing partial transcript
                                        const updated = [...prev];
                                        updated[lastIndex] = { speaker, text: transcript, timestamp, isComplete };
                                        return updated;
                                    }
                                }

                                // Otherwise, add new transcript entry
                                return [...prev, { speaker, text: transcript, timestamp, isComplete }];
                            });

                            console.log(`📝 ${speaker === "user" ? "User" : "AI"} transcript:`, transcript);
                        }
                    } catch (err) {
                        console.error("Error parsing data message:", err);
                    }
                });

                room.on(RoomEvent.Disconnected, () => {
                    setStatus("Disconnected");
                });

            } catch (err) {
                console.error("Error:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
                setStatus("Error");
            }
        };

        start();

        // Cleanup on unmount
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, []);

    // Auto-scroll to latest transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcripts]);

    const handleMuteToggle = () => {
        if (roomRef.current) {
            const audioTrack = roomRef.current.localParticipant.audioTrackPublications.values().next().value;
            if (audioTrack) {
                if (isMuted) {
                    audioTrack.unmute();
                } else {
                    audioTrack.mute();
                }
                setIsMuted(!isMuted);
            }
        }
    };

    const handleEndCall = () => {
        if (confirm("Are you sure you want to end the interview?")) {
            if (roomRef.current) {
                roomRef.current.disconnect();
            }
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-4 sm:px-6 py-3 sm:py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm sm:text-base font-medium">{formatTime(timeElapsed)}</span>
                        </div>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs sm:text-sm">
                            {status}
                        </Badge>
                    </div>

                    {/* Mobile: Show transcript toggle */}
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="lg:hidden p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white transition-colors"
                    >
                        <MessageSquare className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center p-4 sm:p-6">
                    {/* Main Video (Candidate) */}
                    <div className="relative w-full h-full max-w-5xl max-h-[calc(100vh-200px)] bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
                        {/* Camera Off State */}
                        {!cameraEnabled && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                                    <User className="h-10 w-10 sm:h-16 sm:w-16 text-white" />
                                </div>
                                <p className="text-slate-400 text-base sm:text-lg font-medium">Camera is off</p>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">You're in audio-only mode</p>
                            </div>
                        )}

                        {/* AI Interviewer Box (Bottom Right) */}
                        <div className="absolute bottom-4 right-4 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-slate-700 rounded-lg overflow-hidden shadow-xl border-2 border-blue-500/50">
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mb-2 border-2 border-white/50">
                                    <AvatarImage src="/arjuna-icon.png" />
                                    <AvatarFallback className="bg-blue-500 text-white text-lg sm:text-xl">AI</AvatarFallback>
                                </Avatar>
                                <p className="text-white text-xs sm:text-sm font-semibold">Arjuna AI</p>
                                <p className="text-blue-200 text-[10px] sm:text-xs">Interviewer</p>
                            </div>
                        </div>

                        {/* Status Indicator (Top Left) */}
                        {error && (
                            <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs sm:text-sm shadow-lg">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Transcript Sidebar */}
                <div className={`
          ${showTranscript ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          fixed lg:relative inset-y-0 right-0 w-full sm:w-96 lg:w-96 xl:w-[28rem]
          bg-slate-800 border-l border-slate-700 flex flex-col
          transition-transform duration-300 ease-in-out z-40
          lg:z-auto h-full
        `}>
                    {/* Transcript Header */}
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/95 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-400" />
                            <h3 className="font-semibold text-white text-sm sm:text-base">Live Transcript</h3>
                        </div>
                        <button
                            onClick={() => setShowTranscript(false)}
                            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Transcript Messages - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-slate-900/50 min-h-0">
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
                        max-w-[85%] px-3 py-2 rounded-lg shadow-md
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
            </div>

            {/* Control Bar */}
            <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-4 sm:px-6 py-4 sm:py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-4">
                    {/* Camera Toggle */}
                    <Button
                        onClick={() => setCameraEnabled(!cameraEnabled)}
                        size="lg"
                        className={`
              rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0
              ${cameraEnabled
                                ? "bg-slate-700 hover:bg-slate-600"
                                : "bg-slate-700 hover:bg-slate-600"
                            }
              transition-all shadow-lg
            `}
                    >
                        {cameraEnabled ? (
                            <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        ) : (
                            <VideoOff className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        )}
                    </Button>

                    {/* Mute Toggle */}
                    <Button
                        onClick={handleMuteToggle}
                        size="lg"
                        className={`
              rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0
              ${isMuted
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-slate-700 hover:bg-slate-600"
                            }
              transition-all shadow-lg
            `}
                    >
                        {isMuted ? (
                            <MicOff className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        ) : (
                            <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        )}
                    </Button>

                    {/* End Call */}
                    <Button
                        onClick={handleEndCall}
                        size="lg"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 bg-red-500 hover:bg-red-600 transition-all shadow-lg"
                    >
                        <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </Button>

                    {/* Transcript Toggle (Desktop) */}
                    <Button
                        onClick={() => setShowTranscript(!showTranscript)}
                        size="lg"
                        className={`
              hidden lg:flex rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0
              ${showTranscript
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-slate-700 hover:bg-slate-600"
                            }
              transition-all shadow-lg
            `}
                    >
                        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
