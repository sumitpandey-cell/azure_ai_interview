"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoOff, MicOff, Video, Mic, Sparkles, CheckCircle2, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Type for user metadata
interface UserMetadata {
    full_name?: string;
    avatar_url?: string;
    gender?: string;
}

export default function InterviewSetup() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const userMetadata = user?.user_metadata as UserMetadata | undefined;

    const [micEnabled, setMicEnabled] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);

    // Get session details from URL params or use defaults
    const sessionDetails = {
        type: searchParams?.get('type') || "Technical",
        position: searchParams?.get('position') || "frontend developer",
        skills: searchParams?.get('skills')?.split(',') || ["html", "css", "js"]
    };

    const handleStartInterview = () => {
        if (!micEnabled || !cameraEnabled) {
            return; // Don't proceed if permissions not enabled
        }
        router.push('/interview/live');
    };

    const instructions = [
        "Enable camera and microphone permissions",
        "Find a quiet, well-lit environment",
        "Speak clearly and naturally",
        "Ensure stable internet connection"
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Preview Section - 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Video Card */}
                    <Card className="bg-[#0A0E1A] border-none shadow-2xl overflow-hidden rounded-2xl">
                        <div className="relative aspect-video bg-[#0F1117] flex items-center justify-center">
                            {/* User Name Badge - Top Left */}
                            <div className="absolute top-6 left-6 z-10">
                                <Badge variant="destructive" className="px-3 py-1.5 bg-red-500 hover:bg-red-500">
                                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                                    {userMetadata?.full_name || "Ujjawal Mishra"}
                                </Badge>
                            </div>

                            {/* Camera Off State - Center */}
                            <div className="text-center">
                                <div className="w-28 h-28 rounded-full bg-slate-800/50 border-2 border-slate-700 flex items-center justify-center mx-auto mb-4">
                                    <VideoOff className="h-14 w-14 text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-lg font-medium">Camera is turned off</p>
                            </div>

                            {/* Control Buttons - Bottom Center */}
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                                <button
                                    onClick={() => setMicEnabled(!micEnabled)}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${micEnabled
                                        ? "bg-slate-700 hover:bg-slate-600"
                                        : "bg-red-500 hover:bg-red-600"
                                        }`}
                                    aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
                                >
                                    {micEnabled ? (
                                        <Mic className="h-6 w-6 text-white" />
                                    ) : (
                                        <MicOff className="h-6 w-6 text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setCameraEnabled(!cameraEnabled)}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${cameraEnabled
                                        ? "bg-slate-700 hover:bg-slate-600"
                                        : "bg-red-500 hover:bg-red-600"
                                        }`}
                                    aria-label={cameraEnabled ? "Turn off camera" : "Turn on camera"}
                                >
                                    {cameraEnabled ? (
                                        <Video className="h-6 w-6 text-white" />
                                    ) : (
                                        <VideoOff className="h-6 w-6 text-white" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Helper Text */}
                    <p className="text-center text-sm text-muted-foreground">
                        Check your appearance and audio before joining the session.
                    </p>
                </div>

                {/* Right Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* Session Details Card */}
                    <Card className="p-6 border border-border bg-card shadow-md rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-foreground">Session Details</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Type</p>
                                <p className="font-semibold text-foreground">{sessionDetails.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Position</p>
                                <p className="font-semibold text-foreground">{sessionDetails.position}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Skills to be assessed</p>
                                <div className="flex flex-wrap gap-2">
                                    {sessionDetails.skills.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Ready to Join Card */}
                    <Card className="p-6 border border-border bg-card shadow-md rounded-xl">
                        <div className="text-center space-y-4">
                            <h3 className="text-xl font-bold text-foreground">Ready to join?</h3>
                            <p className="text-sm text-muted-foreground">
                                The AI interviewer is waiting for you.
                            </p>
                            <Button
                                onClick={handleStartInterview}
                                disabled={!micEnabled || !cameraEnabled}
                                className="w-full h-12 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                                size="lg"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                Start Interview Now
                            </Button>
                            {(!micEnabled || !cameraEnabled) && (
                                <p className="text-xs text-red-500 font-medium">
                                    Please enable microphone and camera access
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Instructions Card */}
                    <Card className="p-6 border border-border bg-card shadow-md rounded-xl">
                        <h3 className="font-bold text-foreground mb-4 uppercase text-xs tracking-wider">
                            Instructions
                        </h3>
                        <div className="space-y-3">
                            {instructions.map((instruction, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="shrink-0 mt-0.5">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {instruction}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
