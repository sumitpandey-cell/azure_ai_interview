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

    // Fetch existing roadmap on mount
    useEffect(() => {
        fetchRoadmap();
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

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError(null);

            const response = await fetch('/api/roadmap/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok) {
                setRoadmap(data.roadmap);
                setProgress([]);
            } else if (response.status === 400 && data.error === 'insufficient_interviews') {
                setError('insufficient_interviews');
            } else if (response.status === 402) {
                // Payment required - show modal
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
        // For now, allow generation without payment (as per requirements)
        if (generating) {
            await handleGenerate();
        } else if (refreshing) {
            await handleRefresh();
        }
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
                <div className="container max-w-3xl mx-auto px-4 py-16">
                    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl text-orange-900 dark:text-orange-100">
                                        Complete More Interviews to Unlock Your Roadmap
                                    </CardTitle>
                                    <CardDescription className="mt-2 text-orange-700 dark:text-orange-300">
                                        You need at least 3 completed interviews to generate a personalized learning roadmap
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                <h4 className="font-semibold mb-3 text-sm">How to Get Started:</h4>
                                <ol className="space-y-3 text-sm">
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            1
                                        </span>
                                        <span>
                                            Click <strong>"Start Interview"</strong> from your dashboard
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            2
                                        </span>
                                        <span>
                                            Choose your role, difficulty level, and interview type
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            3
                                        </span>
                                        <span>
                                            Complete the interview session to receive feedback
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                            4
                                        </span>
                                        <span>
                                            Repeat 2 more times to build enough data for your personalized roadmap
                                        </span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    <strong>💡 Pro Tip:</strong> Try different interview types (Technical, Behavioral, System Design)
                                    to get a more comprehensive roadmap analysis!
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    onClick={() => router.push('/dashboard')}
                                    className="flex-1"
                                    size="lg"
                                >
                                    Start Interview
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button
                                    onClick={() => router.push('/reports')}
                                    variant="outline"
                                    className="flex-1"
                                    size="lg"
                                >
                                    View My Progress
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !roadmap) {
        return (
            <DashboardLayout>
                <div className="container max-w-4xl mx-auto px-4 py-16">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="mt-6 flex justify-center">
                        <Button onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!roadmap || roadmap.roadmap_data?.status === 'generating') {
        return (
            <DashboardLayout>
                <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
                    <Sparkles className={cn("w-16 h-16 mx-auto mb-6", generating ? "text-primary animate-pulse" : "text-primary")} />
                    <h1 className="text-3xl font-bold mb-3">
                        {generating ? "Building Your Professional Roadmap" : "Get Your Personalized Roadmap"}
                    </h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        {generating
                            ? "Our AI is currently synthesizing your performance data into a tactical growth strategy. This usually takes 30-60 seconds."
                            : "Our AI will analyze your interview history and create a customized learning plan tailored to your strengths and weaknesses."}
                    </p>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-8"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing Your Progress...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate My Roadmap (Free)
                            </>
                        )}
                    </Button>

                    {!generating && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            First roadmap is completely free!
                        </p>
                    )}

                    {generating && (
                        <div className="mt-12 space-y-6 max-w-md mx-auto">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    <span>AI Neural Processing</span>
                                    <span className="text-primary italic">In Progress</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[40%] animate-progress-indeterminate rounded-full" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                                You can safely navigate away. We'll continue the calculation.
                            </p>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-transparent pt-10 sm:pt-0">
                <div className="container mx-auto px-4 py-12">
                    {/* Header Section */}
                    <div className="relative mb-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-1 w-8 bg-primary rounded-full" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Personalized Path</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/60 tracking-tight">
                                    Your Learning Roadmap
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/50 border border-accent text-xs font-medium">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Generated {new Date(roadmap.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    {roadmap.overall_level && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                                            Current Level: {roadmap.overall_level}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="rounded-xl border-accent hover:bg-accent transition-all duration-300 shadow-sm px-4 h-9"
                                >
                                    {refreshing ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                    )}
                                    Refresh Path
                                </Button>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-8 border-none bg-destructive/10 text-destructive shadow-sm rounded-2xl">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Roadmap Content Grid */}
                    <div className="space-y-12">
                        <section className="relative glass-card rounded-xl p-4 sm:p-5 overflow-hidden">
                            <Tabs defaultValue="visual" className="w-full">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl font-bold">Path Visualization</h2>
                                        <p className="text-[11px] text-muted-foreground">Toggle between visual tree and technical overview</p>
                                    </div>
                                    <TabsList className="bg-background/50 border border-border/50 p-1 rounded-lg h-10">
                                        <TabsTrigger value="visual" className="rounded-md font-bold px-3 sm:px-4 text-xs">Skill Tree</TabsTrigger>
                                        <TabsTrigger value="analysis" className="rounded-md font-bold px-3 sm:px-4 text-xs">Detailed Analysis</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="visual" className="mt-0 px-0">
                                    <SkillTree phases={roadmap.roadmap_data?.phases || []} progress={progress} />
                                </TabsContent>
                                <TabsContent value="analysis" className="mt-4 px-2 sm:px-4">
                                    <RoadmapOverview data={roadmap.roadmap_data?.analysis} />
                                </TabsContent>
                            </Tabs>
                        </section>

                        <section className="relative">
                            <div className="flex items-center gap-2 mb-6 border-l-2 border-primary pl-4 py-0.5">
                                <h2 className="text-xl font-bold">Execution Plan</h2>
                            </div>
                            <RoadmapPhases
                                phases={roadmap.roadmap_data?.phases || []}
                                progress={progress}
                                roadmapId={roadmap.id}
                                onProgressUpdate={fetchRoadmap}
                            />
                        </section>

                        <section className="relative border-t pt-12">
                            <div className="flex items-center gap-2 mb-6 border-l-2 border-primary pl-4 py-0.5">
                                <h2 className="text-xl font-bold">Success Milestones</h2>
                            </div>
                            <RoadmapMilestones
                                milestones={roadmap.roadmap_data?.milestones || []}
                                progress={progress}
                            />
                        </section>

                        {/* Career Call to Action */}
                        <div className="mt-16 p-6 md:p-10 rounded-xl bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground shadow-xl shadow-primary/10 relative overflow-hidden group">
                            <div className="relative z-10 max-w-2xl">
                                <h3 className="text-2xl font-bold mb-3">Ready for your next challenge?</h3>
                                <p className="text-primary-foreground/80 text-base mb-6">
                                    The best way to progress through your roadmap is consistent practice. Kick off an interview session now to apply what you've learned.
                                </p>
                                <Button
                                    size="default"
                                    variant="secondary"
                                    className="rounded-xl px-6 font-bold text-primary hover:scale-105 transition-transform"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    Start Practice Session
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            <Sparkles className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                        </div>
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
