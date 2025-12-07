"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    VideoOff,
    MicOff,
    Video,
    Mic,
    PhoneOff,
    User,
    MoreVertical
} from "lucide-react";

export default function LiveInterview() {
    const router = useRouter();
    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

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

    const handleEndInterview = () => {
        if (confirm("Are you sure you want to end the interview?")) {
            router.push('/dashboard');
        }
    };

    // Keyboard shortcuts data
    const shortcuts = [
        { key: "Toggle Mic", value: "Ctrl+D" },
        { key: "Toggle Camera", value: "Ctrl+E" },
        { key: "Toggle Transcript", value: "Ctrl+T" }
    ];

    return (
        <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
            {/* Header */}
            <div className="bg-[#0F1117] px-6 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">{formatTime(timeElapsed)}</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10">
                        ● REC
                    </Badge>
                </div>
                <Button
                    onClick={handleEndInterview}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                >
                    End Interview
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar - "You" label */}
                <div className="w-12 bg-[#0F1117] border-r border-slate-800 flex items-center justify-center">
                    <div className="text-white text-xs font-medium transform -rotate-90 whitespace-nowrap">
                        You
                    </div>
                </div>

                {/* Center - Video Area */}
                <div className="flex-1 flex items-center justify-center p-8 relative">
                    <div className="w-full max-w-5xl">
                        {/* Camera Off State */}
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 rounded-full bg-slate-800/50 border-2 border-slate-700 flex items-center justify-center mx-auto mb-4">
                                <User className="h-12 w-12 text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-lg">Camera is turned off</p>
                        </div>

                        {/* Keyboard Shortcuts Card */}
                        <div className="flex justify-center mb-8">
                            <Card className="bg-[#1A1F2E] border-slate-700 px-6 py-3 inline-block">
                                <div className="flex items-center gap-6 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">● Keyboard Shortcuts</span>
                                    </div>
                                    {shortcuts.map((shortcut, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-slate-400">{shortcut.key}:</span>
                                            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600 text-xs px-2 py-0.5">
                                                {shortcut.value}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setCameraEnabled(!cameraEnabled)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraEnabled
                                        ? "bg-slate-700 hover:bg-slate-600"
                                        : "bg-slate-700 hover:bg-slate-600"
                                    }`}
                            >
                                {cameraEnabled ? (
                                    <Video className="h-5 w-5 text-white" />
                                ) : (
                                    <VideoOff className="h-5 w-5 text-white" />
                                )}
                            </button>
                            <button
                                onClick={() => setMicEnabled(!micEnabled)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micEnabled
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-slate-700 hover:bg-slate-600"
                                    }`}
                            >
                                {micEnabled ? (
                                    <Mic className="h-5 w-5 text-white" />
                                ) : (
                                    <MicOff className="h-5 w-5 text-white" />
                                )}
                            </button>
                            <button
                                className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all"
                            >
                                <PhoneOff className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Loading Button - Bottom Right */}
                    <div className="absolute bottom-8 right-8">
                        <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            ● LOADING
                        </Button>
                    </div>
                </div>

                {/* Right Sidebar - AI Interviewer */}
                <div className="w-80 bg-[#0F1117] border-l border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-blue-500">
                                <AvatarImage src="/arjuna-icon.png" />
                                <AvatarFallback className="bg-blue-500 text-white">AI</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Arjuna AI</h3>
                                <p className="text-slate-400 text-xs">AI Interviewer • Online</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-white">
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-slate-300 text-sm">
                                    Welcome to your interview session. I'm ready to begin when you are.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
