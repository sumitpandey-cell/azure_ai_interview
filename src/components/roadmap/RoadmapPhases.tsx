import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Lock, CheckCircle2, Circle, Play, BookOpen, Clock, Lightbulb, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Goal {
    id: string;
    description: string;
    success_criteria: string;
}

interface RecommendedInterview {
    template_id: string;
    template_title: string;
    difficulty: string;
    frequency: string;
    focus_areas: string[];
}

interface LearningResource {
    type: string;
    title: string;
    description: string;
    url?: string;
    estimated_time_minutes?: number;
}

interface Phase {
    phase_number: number;
    title: string;
    description: string;
    duration_weeks: number;
    goals: Goal[];
    recommended_interviews: RecommendedInterview[];
    learning_resources: LearningResource[];
}

interface RoadmapPhasesProps {
    phases: Phase[];
    progress: any[];
    roadmapId: string;
    onProgressUpdate?: () => void;
}

export function RoadmapPhases({ phases, progress, roadmapId, onProgressUpdate }: RoadmapPhasesProps) {
    const router = useRouter();
    const [expandedPhases, setExpandedPhases] = useState<number[]>([1]);

    const togglePhase = (phaseNumber: number) => {
        setExpandedPhases(prev =>
            prev.includes(phaseNumber)
                ? prev.filter(p => p !== phaseNumber)
                : [...prev, phaseNumber]
        );
    };

    const isGoalCompleted = (goalId: string) => {
        return progress.some(p => p.milestone_id === goalId && p.item_type === 'goal');
    };

    const handleGoalToggle = async (goal: Goal, phaseNumber: number) => {
        const isCompleted = isGoalCompleted(goal.id);
        if (isCompleted) return;

        try {
            const response = await fetch('/api/roadmap/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roadmapId,
                    itemType: 'goal',
                    itemId: goal.id,
                    phaseNumber,
                }),
            });

            if (response.ok) {
                onProgressUpdate?.();
            }
        } catch (error) {
            console.error('Error tracking progress:', error);
        }
    };

    const calculatePhaseProgress = (phase: Phase) => {
        if (!phase.goals || phase.goals.length === 0) return 0;
        const completedGoals = phase.goals.filter(g => isGoalCompleted(g.id)).length;
        return Math.round((completedGoals / phase.goals.length) * 100);
    };

    const isPhaseUnlocked = (phaseNumber: number) => {
        if (phaseNumber === 1) return true;
        const previousPhase = phases.find(p => p.phase_number === phaseNumber - 1);
        if (!previousPhase) return false;
        return calculatePhaseProgress(previousPhase) === 100;
    };

    if (!phases || phases.length === 0) return null;

    return (
        <div className="space-y-8 py-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Your Learning Path
                </h2>
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground bg-accent/30 px-3 py-1.5 rounded-full border border-accent uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated: {phases.reduce((acc, p) => acc + p.duration_weeks, 0)} Weeks</span>
                </div>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border/30 before:to-transparent">
                {phases.map((phase) => {
                    const isExpanded = expandedPhases.includes(phase.phase_number);
                    const isUnlocked = isPhaseUnlocked(phase.phase_number);
                    const phaseProgress = calculatePhaseProgress(phase);
                    const isCompleted = phaseProgress === 100;

                    return (
                        <div key={phase.phase_number} className="relative pl-12 group">
                            {/* Phase Indicator Node */}
                            <div className={cn(
                                "absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 border-4 bg-background",
                                !isUnlocked ? "border-muted-foreground/20 text-muted-foreground grayscale" :
                                    isCompleted ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                                        "border-primary text-primary shadow-lg shadow-primary/20"
                            )}>
                                {!isUnlocked ? (
                                    <Lock className="w-4 h-4" />
                                ) : isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <span className="text-sm font-bold">{phase.phase_number}</span>
                                )}
                            </div>

                            <Card className={cn(
                                "border-none shadow-sm transition-all duration-300 overflow-hidden glass-card hover-lift",
                                !isUnlocked ? "opacity-50 pointer-events-none grayscale" : "hover:neon-glow-primary"
                            )}>
                                <CardHeader
                                    className="cursor-pointer select-none bg-gradient-to-r from-accent/10 to-transparent transition-colors hover:from-accent/20"
                                    onClick={() => isUnlocked && togglePhase(phase.phase_number)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg">
                                                    Phase {phase.phase_number}: {phase.title}
                                                </CardTitle>
                                                {isUnlocked && !isCompleted && (
                                                    <span className="text-[9px] font-black uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-md">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <CardDescription className="text-xs max-w-2xl">
                                                {phase.description}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                                    Progression
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <Progress value={phaseProgress} className="w-24 h-1.5" />
                                                    <span className="text-sm font-bold tabular-nums">
                                                        {phaseProgress}%
                                                    </span>
                                                </div>
                                            </div>
                                            {isUnlocked && (
                                                <div className="p-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                {isExpanded && isUnlocked && (
                                    <CardContent className="p-5 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {/* Goals Section */}
                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-4 h-4 text-primary" />
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Learning Goals</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {phase.goals.map((goal) => {
                                                    const completed = isGoalCompleted(goal.id);
                                                    return (
                                                        <div
                                                            key={goal.id}
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-xl border transition-all duration-300",
                                                                completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-accent/5 border-accent/10 hover:border-primary/20"
                                                            )}
                                                        >
                                                            <div className="pt-1">
                                                                <Checkbox
                                                                    disabled={completed}
                                                                    checked={completed}
                                                                    onCheckedChange={() => handleGoalToggle(goal, phase.phase_number)}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className={cn("text-sm font-semibold leading-relaxed", completed && "text-muted-foreground line-through opacity-70")}>
                                                                    {goal.description}
                                                                </p>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                                                    <p className="text-xs text-muted-foreground italic">
                                                                        {goal.success_criteria}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Practice Section */}
                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Play className="w-4 h-4 text-primary" />
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Recommended Practice</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {phase.recommended_interviews.map((interview, idx) => (
                                                    <div key={idx} className="group/item flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-b from-white to-accent/20 dark:from-black/40 dark:to-accent/10 border border-accent/20 shadow-sm transition-all hover:shadow-md">
                                                        <div className="space-y-1.5">
                                                            <h5 className="font-bold text-xs leading-tight text-foreground/90">{interview.template_title}</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                                    {interview.difficulty}
                                                                </span>
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/50 text-muted-foreground font-medium">
                                                                    {interview.frequency}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="rounded-xl shadow-sm hover-lift active-scale"
                                                            onClick={() => router.push('/dashboard')}
                                                        >
                                                            Start session
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Resources Section */}
                                        <div className="grid gap-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BookOpen className="w-4 h-4 text-primary" />
                                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Expert Resources</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {phase.learning_resources.map((resource, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex flex-col justify-between p-3 rounded-xl border border-accent/20 bg-accent/10 hover:bg-accent/20 transition-all cursor-pointer group/card"
                                                        onClick={() => resource.url && window.open(resource.url, '_blank')}
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{resource.type}</span>
                                                                {resource.estimated_time_minutes && (
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" /> {resource.estimated_time_minutes}m
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-bold leading-tight line-clamp-2 group-hover/card:text-primary transition-colors">
                                                                {resource.title}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-3 line-clamp-2 opacity-80">
                                                            {resource.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
