"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } ;
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CheckCircle2, ArrowRight, Mic, Zap, Heart, Target, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { INTERVIEWER_AVATARS, getDefaultAvatar, type InterviewerAvatar } from "@/config/interviewer-avatars";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function AvatarSelection() {
    const { sessionId } = useParams();
    const [selectedAvatar, setSelectedAvatar] = useState<InterviewerAvatar>(getDefaultAvatar());
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleContinue = async () => {
        if (!sessionId) {
            toast.error("Session not found");
            return;
        }

        setIsLoading(true);

        try {
            // Fetch current session config
            const { data: session, error: fetchError } = await supabase
                .from('interview_sessions')
                .select('config')
                .eq('id', sessionId)
                .single();

            if (fetchError) throw fetchError;

            // Update session config with selected avatar
            const currentConfig = (session?.config as Record<string, any>) || {};
            const updatedConfig = {
                ...currentConfig,
                selectedAvatar: selectedAvatar.id
            };

            const { error: updateError } = await supabase
                .from('interview_sessions')
                .update({ config: updatedConfig })
                .eq('id', sessionId);

            if (updateError) throw updateError;

            toast.success(`${selectedAvatar.name} will be your interviewer!`);

            // Navigate to interview setup
            setTimeout(() => {
                router.push(`/interview/${sessionId}/setup`);
            }, 500);
        } catch (error) {
            console.error("Error saving avatar selection:", error);
            toast.error("Failed to save selection. Please try again.");
            setIsLoading(false);
        }
    };

    // Get personality traits based on description
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

        // Add voice trait for all
        traits.push({ icon: Mic, label: `${avatar.gender === 'female' ? 'Female' : 'Male'} Voice` });

        return traits;
    };

    return (
        <DashboardLayout>
            {/* Animated Background Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/5 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 space-y-6 pb-8">
                {/* Title Section */}
                <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border border-primary/20 text-primary text-xs font-semibold shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        Step 1 of 2
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                        Choose Your AI
                        <span className="block mt-1 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient">
                            Interview Partner
                        </span>
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Each interviewer brings a unique approach and personality. Select the one that resonates with your interview style.
                    </p>
                </div>

                {/* Avatar Grid - Bento Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    {INTERVIEWER_AVATARS.map((avatar, index) => {
                        const traits = getPersonalityTraits(avatar);
                        const isSelected = selectedAvatar.id === avatar.id;
                        const isHovered = hoveredId === avatar.id;

                        return (
                            <Card
                                key={avatar.id}
                                className={`group relative cursor-pointer transition-all duration-500 overflow-hidden ${isSelected
                                    ? 'border-2 border-primary shadow-2xl shadow-primary/30 scale-[1.02] bg-gradient-to-br from-primary/10 via-card to-card'
                                    : 'border border-border/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur-sm hover:scale-[1.01]'
                                    }`}
                                onClick={() => setSelectedAvatar(avatar)}
                                onMouseEnter={() => setHoveredId(avatar.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}
                            >
                                {/* Animated Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${avatar.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                {/* Selected Badge */}
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl z-10 animate-in zoom-in duration-300">
                                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                )}

                                {/* Glow Effect on Hover */}
                                {isHovered && !isSelected && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${avatar.color} opacity-10 blur-xl transition-opacity duration-500`} />
                                )}

                                <CardContent className="relative p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                        {/* Avatar with Animated Border */}
                                        <div className="relative flex-shrink-0">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${avatar.color} rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                                            <div className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-3xl sm:text-4xl shadow-2xl transform transition-all duration-500 ${isSelected ? 'scale-110 rotate-3' : isHovered ? 'scale-105' : ''
                                                }`}>
                                                {avatar.avatar}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                                            <div>
                                                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 tracking-tight">
                                                    {avatar.name}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                                    {avatar.description}
                                                </p>
                                            </div>

                                            {/* Personality Quote */}
                                            <div className="relative pl-3 border-l-2 border-primary/30">
                                                <p className="text-xs text-foreground/70 italic leading-relaxed">
                                                    "{avatar.personality}"
                                                </p>
                                            </div>

                                            {/* Traits Badges */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {traits.map((trait, idx) => {
                                                    const Icon = trait.icon;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${isSelected
                                                                ? 'bg-primary/20 text-primary border border-primary/30'
                                                                : 'bg-muted/50 text-muted-foreground border border-border/50 group-hover:bg-muted group-hover:border-border'
                                                                }`}
                                                        >
                                                            <Icon className="h-2.5 w-2.5" />
                                                            <span>{trait.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Status Indicator */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <div className="relative">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    Available Now
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Selected Avatar Summary */}
                <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-purple-500/5 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${selectedAvatar.color} opacity-5`} />

                    <CardContent className="relative p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="relative flex-shrink-0">
                                <div className={`absolute inset-0 bg-gradient-to-br ${selectedAvatar.color} rounded-xl blur-lg opacity-60 animate-pulse`} />
                                <div className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br ${selectedAvatar.color} flex items-center justify-center text-2xl sm:text-3xl shadow-2xl`}>
                                    {selectedAvatar.avatar}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="h-3.5 w-3.5 text-primary" />
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                                        Your Interview Partner
                                    </p>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 tracking-tight">
                                    {selectedAvatar.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    {selectedAvatar.name} will introduce themselves and guide you through a personalized interview experience
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => router.push('/dashboard')}
                        className="min-w-[160px] sm:min-w-[180px] border-border/50 hover:border-border hover:bg-muted/50 transition-all"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="default"
                        onClick={handleContinue}
                        disabled={isLoading}
                        className="min-w-[160px] sm:min-w-[180px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
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
                <div className="text-center text-xs text-muted-foreground pt-2">
                    <p className="flex items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                        You can change your interviewer preference anytime from your dashboard
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
