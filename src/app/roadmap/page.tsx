'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RoadmapOverview } from '@/components/roadmap/RoadmapOverview';
import { RoadmapPhases } from '@/components/roadmap/RoadmapPhases';
import { RoadmapMilestones } from '@/components/roadmap/RoadmapMilestones';
import { RoadmapSkeleton } from '@/components/roadmap/RoadmapSkeleton';
import { PaymentPendingModal } from '@/components/roadmap/PaymentPendingModal';
import { RoadmapWizard } from '@/components/roadmap/RoadmapWizard';
import { SkillTree } from '@/components/roadmap/SkillTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RoadmapPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [roadmap, setRoadmap] = useState<any>(null);
    const [progress, setProgress] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [lastWizardData, setLastWizardData] = useState<any>(null);

    // Fetch existing roadmap on mount
    useEffect(() => {
        fetchRoadmap();
    }, []);

    // Handle payment return
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get('payment');
        const orderId = params.get('order_id');

        if (paymentStatus === 'success' && orderId) {
            import('sonner').then(({ toast }) => toast.success("Payment verified! Generating your roadmap..."));
            handleGenerate(null, orderId);

            // Clean URL
            window.history.replaceState({}, '', '/roadmap');
        } else if (paymentStatus === 'failed') {
            import('sonner').then(({ toast }) => toast.error("Payment failed. Please try again."));
            window.history.replaceState({}, '', '/roadmap');
        }
    }, []);

    const fetchRoadmap = async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);
            setError(null);

            const response = await fetch('/api/roadmap/generate');
            const data = await response.json();

            if (response.ok && data.roadmap) {
                setRoadmap(data.roadmap);
                setProgress(data.progress || []);

                // If currently generating, start polling
                if (data.roadmap.roadmap_data?.status === 'generating') {
                    setGenerating(true);
                } else {
                    setGenerating(false);
                }
            } else if (response.ok) {
                setRoadmap(null);
            } else {
                setError(data.error || 'Failed to fetch roadmap');
            }
        } catch (err: any) {
            console.error('Error fetching roadmap:', err);
            setError('Failed to load roadmap');
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    // Polling logic
    useEffect(() => {
        let intervalId: any;
        if (generating) {
            intervalId = setInterval(() => {
                fetchRoadmap(true);
            }, 5000); // Poll every 5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [generating]);

    const handleGenerate = async (wizardData?: any, paymentId?: string) => {
        try {
            setGenerating(true);
            setError(null);

            if (wizardData) {
                setLastWizardData(wizardData);
            }

            const payload = {
                ...(wizardData || lastWizardData || {}),
                paymentId: paymentId || null
            };

            const response = await fetch('/api/roadmap/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setRoadmap(data.roadmap);
                setProgress([]);
                setShowWizard(false);
            } else if (response.status === 400 && data.error === 'insufficient_interviews') {
                setError('insufficient_interviews');
            } else if (response.status === 402) {
                // Payment required
                setShowPaymentModal(true);
            } else {
                setError(data.message || 'Failed to generate roadmap');
            }
        } catch (err: any) {
            console.error('Error generating roadmap:', err);
            setError('Failed to generate roadmap. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);

            const response = await fetch('/api/roadmap/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok) {
                setRoadmap(data.roadmap);
                setProgress([]);
            } else if (response.status === 402) {
                // Payment required - show modal
                setShowPaymentModal(true);
            } else {
                setError(data.message || 'Failed to refresh roadmap');
            }
        } catch (err: any) {
            console.error('Error refreshing roadmap:', err);
            setError('Failed to refresh roadmap. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    const handlePaymentModalContinue = async () => {
        setShowPaymentModal(false);
        // Continue with last attempt
        await handleGenerate();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <RoadmapSkeleton />
            </DashboardLayout>
        );
    }

    // Insufficient interviews error state
    if (error === 'insufficient_interviews') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-3 max-w-md">
                        Unlock Your Personal Roadmap
                    </h2>
                    <p className="text-muted-foreground max-w-lg mb-8 text-base">
                        To generate a highly accurate learning path, we need a bit more data.
                        Complete 3 interview sessions to unlock your personalized strategy.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-10">
                        {[
                            { step: "1", text: "Start an Interview" },
                            { step: "2", text: "Get Analyzed" },
                            { step: "3", text: "Repeat" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center p-4 rounded-xl border border-border/60 bg-card">
                                <span className="text-xs font-bold text-primary mb-2">STEP {item.step}</span>
                                <span className="font-medium text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <Button
                            size="lg"
                            onClick={() => router.push('/dashboard')}
                            className="rounded-full px-8 font-semibold shadow-lg shadow-primary/20"
                        >
                            Start Interview <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => router.push('/reports')}
                            className="rounded-full px-8"
                        >
                            Check Progress
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !roadmap) {
        return (
            <DashboardLayout>
                <div className="container max-w-2xl mx-auto px-4 py-32 text-center">
                    <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 inline-block text-left">
                        <div className="flex items-center gap-3 mb-2 text-destructive font-semibold">
                            <AlertCircle className="h-5 w-5" />
                            <span>Unable to load roadmap</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!roadmap || roadmap.roadmap_data?.status === 'generating' || showWizard) {
        return (
            <DashboardLayout>
                <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
                    {!roadmap && !generating && !showWizard ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
                            <div className="h-20 w-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-8">
                                <Sparkles className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight mb-4">Master Your Next Interview</h1>
                            <p className="text-muted-foreground text-lg mb-10 max-w-lg leading-relaxed">
                                Create a high-performance roadmap tailored to your target position and domain.
                            </p>
                            <Button
                                size="lg"
                                onClick={() => setShowWizard(true)}
                                className="h-12 px-8 rounded-full font-semibold shadow-xl shadow-primary/20 text-base"
                            >
                                <Sparkles className="w-5 h-5 mr-2 fill-current" />
                                Start Personalization
                            </Button>
                            <p className="mt-6 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                                First Roadmap is Free
                            </p>
                        </div>
                    ) : (roadmap?.roadmap_data?.status === 'generating' || generating) && !showWizard ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto animate-in fade-in duration-700">
                            <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-8 animate-bounce">
                                <Sparkles className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight mb-4 text-foreground">Building Your Professional Blueprint</h2>
                            <p className="text-muted-foreground text-base mb-12">
                                We're cross-referencing industry standards with your target profile to build an optimal learning path.
                            </p>
                            <div className="w-full max-w-sm space-y-4">
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-progress-indeterminate rounded-full" />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                    <span>Analyzing Role</span>
                                    <span>Generating Modules</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2 mb-8">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Personalize Your Path</h1>
                                <p className="text-muted-foreground">Tell us about your next big opportunity.</p>
                            </div>
                            <RoadmapWizard
                                isLoading={generating}
                                onGenerate={(data) => handleGenerate(data)}
                            />
                            {showWizard && roadmap && (
                                <div className="flex justify-center mt-6">
                                    <Button variant="ghost" onClick={() => setShowWizard(false)} className="text-muted-foreground">
                                        Cancel and return to current roadmap
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-transparent sm:pt-0">
                <div className="max-w-[1600px] mx-auto space-y-8 sm:space-y-12 pb-12 sm:pb-16 sm:pt-0">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div className="space-y-1.5">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Learning Roadmap
                            </h1>
                            <p className="text-muted-foreground text-base max-w-2xl">
                                Your personalized strategic plan for technical mastery and career growth.
                            </p>

                            <div className="flex items-center gap-2 pt-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground">
                                    <Sparkles className="w-3 h-3" />
                                    Updated {new Date(roadmap.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {roadmap.overall_level && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                                        Level: {roadmap.overall_level}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="h-10 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                            >
                                {refreshing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Refresh Path
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-8 bg-destructive/5 border-destructive/20 text-destructive shadow-none rounded-xl">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Roadmap Content Grid */}
                    <div className="space-y-10">
                        {/* Execution Plan */}
                        <section className="space-y-6">

                            <RoadmapPhases
                                phases={roadmap.roadmap_data?.phases || []}
                                progress={progress}
                                roadmapId={roadmap.id}
                                onProgressUpdate={fetchRoadmap}
                            />
                        </section>

                        {/* Career Call to Action */}
                        <Card className="border-primary/20 bg-primary/5 shadow-none rounded-xl overflow-hidden max-w-3xl mx-auto">
                            <CardContent className="p-8 text-center">
                                <div className="max-w-xl mx-auto space-y-4">
                                    <h3 className="text-xl font-bold text-foreground">Ready to Put This Into Practice?</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        The fastest way to master these skills is through consistent application. Start a new interview session now.
                                    </p>
                                    <div className="pt-2 flex justify-center">
                                        <Button
                                            size="lg"
                                            className="rounded-full font-semibold shadow-lg shadow-primary/20 px-8"
                                            onClick={() => router.push('/dashboard')}
                                        >
                                            Start Practice Session
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Pending Modal */}
                    <PaymentPendingModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        onContinue={handlePaymentModalContinue}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
