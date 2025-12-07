"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Video, Phone, MessageSquare } from "lucide-react";

export default function InterviewRoom() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId') || 'demo-session';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Interview Session</h1>
                        <p className="text-sm text-muted-foreground">AI-Powered Interview Practice</p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => router.push(`/interview/${sessionId}/complete`)}
                    >
                        <Phone className="mr-2 h-4 w-4" />
                        End Interview
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Video/Audio Section */}
                    <div className="lg:col-span-2">
                        <Card className="h-full border-none shadow-lg">
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full min-h-[500px]">
                                <div className="text-center space-y-4">
                                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                        <Video className="h-16 w-16 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Interview Room</h2>
                                    <p className="text-muted-foreground max-w-md">
                                        Backend removed - Ready for implementation of video/audio interview functionality
                                    </p>
                                    <div className="flex gap-4 justify-center pt-4">
                                        <Button size="lg" variant="outline" className="rounded-full">
                                            <Mic className="h-5 w-5" />
                                        </Button>
                                        <Button size="lg" variant="outline" className="rounded-full">
                                            <Video className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat/Questions Section */}
                    <div className="lg:col-span-1">
                        <Card className="h-full border-none shadow-lg">
                            <CardContent className="p-6 flex flex-col h-full min-h-[500px]">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-foreground">Interview Questions</h3>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Questions will appear here during the interview
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
