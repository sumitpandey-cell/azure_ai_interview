"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Mic, Heart, Target, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { INTERVIEWER_AVATARS, getDefaultAvatar, type InterviewerAvatar } from "@/config/interviewer-avatars";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";

export default function AvatarSelection() {
    const { sessionId } = useParams();
    const [selectedAvatar, setSelectedAvatar] = useState<InterviewerAvatar>(getDefaultAvatar());
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { updateInterviewSession, fetchSessionDetail } = useOptimizedQueries();

    const handleContinue = async () => {
        if (!sessionId) {
            toast.error("Session not found");
            return;
        }

        const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        setIsLoading(true);

        try {
            const session = await fetchSessionDetail(sessionIdStr);

            if (!session) {
                toast.error("Session not found. Redirecting to start interview.");
                router.push("/start-interview");
                return;
            }

            const currentConfig = (session.config as Record<string, any>) || {};
            const updatedConfig = {
                ...currentConfig,
                selectedAvatar: selectedAvatar.id,
                selectedVoice: selectedAvatar.voice,
                currentStage: 'setup'
            };

            await updateInterviewSession(sessionIdStr, {
                config: updatedConfig
            });

            toast.success(`${selectedAvatar.name} will be your interviewer!`);

            setTimeout(() => {
                router.push(`/interview/${sessionIdStr}/setup`);
            }, 500);
        } catch (error) {
            console.error("Error saving avatar selection:", error);
            toast.error("Failed to save selection. Please try again.");
            setIsLoading(false);
        }
    };

    const getPersonalityTraits = (avatar: InterviewerAvatar) => {
        const traits: { icon: any; label: string }[] = [];

        if (avatar.description.toLowerCase().includes('empathetic') || avatar.description.toLowerCase().includes('encouraging')) {
            traits.push({ icon: Heart, label: 'Supportive' });
        }
        if (avatar.description.toLowerCase().includes('strategic') || avatar.description.toLowerCase().includes('analytical')) {
            traits.push({ icon: Target, label: 'Analytical' });
        }
        if (avatar.description.toLowerCase().includes('mentor') || avatar.description.toLowerCase().includes('experienced')) {
            traits.push({ icon: Award, label: 'Expert' });
        }
        if (avatar.description.toLowerCase().includes('practical') || avatar.description.toLowerCase().includes('results')) {
            traits.push({ icon: TrendingUp, label: 'Results-Driven' });
        }

        traits.push({ icon: Mic, label: `${avatar.gender === 'female' ? 'Female' : 'Male'} Voice` });

        return traits;
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <Badge variant="outline" className="mb-2">
                        Step 1 of 2
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                        Choose Your AI Interviewer
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Each interviewer brings a unique approach and personality. Select the one that resonates with your interview style.
                    </p>
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INTERVIEWER_AVATARS.map((avatar) => {
                        const traits = getPersonalityTraits(avatar);
                        const isSelected = selectedAvatar.id === avatar.id;

                        return (
                            <Card
                                key={avatar.id}
                                className={`relative cursor-pointer transition-all duration-300 ${isSelected
                                    ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20'
                                    : 'border hover:border-primary/50 hover:shadow-md'
                                    }`}
                                onClick={() => setSelectedAvatar(avatar)}
                            >
                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg z-10">
                                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}

                                <CardContent className="p-5">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 h-16 w-16 rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-3xl shadow-md`}>
                                            {avatar.avatar}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    {avatar.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {avatar.description}
                                                </p>
                                            </div>

                                            {/* Personality Quote */}
                                            <div className="pl-3 border-l-2 border-border">
                                                <p className="text-xs text-muted-foreground italic">
                                                    "{avatar.personality}"
                                                </p>
                                            </div>

                                            {/* Traits */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {traits.map((trait, idx) => {
                                                    const Icon = trait.icon;
                                                    return (
                                                        <Badge
                                                            key={idx}
                                                            variant={isSelected ? "default" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            <Icon className="h-3 w-3 mr-1" />
                                                            {trait.label}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Selected Summary */}
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br ${selectedAvatar.color} flex items-center justify-center text-2xl shadow-md`}>
                                {selectedAvatar.avatar}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                                    Selected Interviewer
                                </p>
                                <h3 className="text-lg font-bold text-foreground">
                                    {selectedAvatar.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {selectedAvatar.name} will guide you through your personalized interview
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push('/dashboard')}
                        className="min-w-[160px]"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleContinue}
                        disabled={isLoading}
                        className="min-w-[160px]"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue to Setup
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>

                {/* Footer Note */}
                <p className="text-center text-xs text-muted-foreground">
                    You can change your interviewer preference anytime from settings
                </p>
            </div>
        </DashboardLayout>
    );
}
