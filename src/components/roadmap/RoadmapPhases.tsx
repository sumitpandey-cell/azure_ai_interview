import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Lock, CheckCircle2, Play, BookOpen, Clock, Target, ChevronRight } from 'lucide-react';
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

interface ProgressItem {
    milestone_id: string;
    item_type: 'goal' | 'interview' | 'resource';
    completed_at: string;
}

interface RoadmapPhasesProps {
    phases: Phase[];
    progress: ProgressItem[];
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
        <div className="space-y-6 py-2">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Your Learning Path
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Est. {phases.reduce((acc, p) => acc + p.duration_weeks, 0)} Weeks</span>
                </div>
            </div>

            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-px before:bg-border/60">
                {phases.map((phase) => {
                    const isExpanded = expandedPhases.includes(phase.phase_number);
                    const isUnlocked = isPhaseUnlocked(phase.phase_number);
                    const phaseProgress = calculatePhaseProgress(phase);
                    const isCompleted = phaseProgress === 100;

                    return (
                        <div key={phase.phase_number} className="relative pl-12">
                            {/* Phase Indicator Node */}
                            <div className={cn(
                                "absolute left-0 top-6 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-background border z-10",
                                !isUnlocked ? "border-border text-muted-foreground" :
                                    isCompleted ? "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" :
                                        "border-primary text-primary bg-primary/5"
                            )}>
                                {!isUnlocked ? (
                                    <Lock className="w-4 h-4" />
                                ) : isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <span className="text-sm font-bold">{phase.phase_number}</span>
                                )}
                            </div>

                            <div
                                className={cn(
                                    "rounded-xl border bg-card transition-all duration-200",
                                    !isUnlocked && "opacity-60 bg-muted/30 border-dashed"
                                )}
                            >
                                <div
                                    className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row gap-6 md:items-start justify-between"
                                    onClick={() => isUnlocked && togglePhase(phase.phase_number)}
                                >
                                    <div className="space-y-2 max-w-2xl">
                                        <div className="flex items-center gap-3">
                                            <h3 className={cn("text-base font-semibold", !isUnlocked && "text-muted-foreground")}>
                                                Phase {phase.phase_number}: {phase.title}
                                            </h3>
                                            {isUnlocked && !isCompleted && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {phase.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6 min-w-[200px] justify-between md:justify-end">
                                        <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {phaseProgress}% Complete
                                            </span>
                                            <Progress value={phaseProgress} className="w-32 h-2" />
                                        </div>
                                        {isUnlocked && (
                                            <div className="text-muted-foreground">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && isUnlocked && (
                                    <div className="px-5 sm:px-6 pb-6 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="h-px bg-border/50 w-full mb-6" />

                                        {/* Goals Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Target className="w-4 h-4 text-primary" />
                                                <h4 className="text-sm font-semibold text-foreground">Learning Goals</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {phase.goals.map((goal) => {
                                                    const completed = isGoalCompleted(goal.id);
                                                    return (
                                                        <label
                                                            key={goal.id}
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/30",
                                                                completed ? "bg-muted/30 border-transparent" : "bg-card border-border/40"
                                                            )}
                                                        >
                                                            <div className="pt-0.5">
                                                                <Checkbox
                                                                    disabled={completed}
                                                                    checked={completed}
                                                                    onCheckedChange={() => handleGoalToggle(goal, phase.phase_number)}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className={cn("text-sm font-medium block", completed && "text-muted-foreground line-through decoration-muted-foreground/50")}>
                                                                    {goal.description}
                                                                </span>
                                                                <div className="text-xs text-muted-foreground pl-0.5 border-l-2 border-primary/20">
                                                                    Acceptance Criteria: {goal.success_criteria}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Practice Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Play className="w-4 h-4 text-primary" />
                                                    <h4 className="text-sm font-semibold text-foreground">Recommended Practice</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {phase.recommended_interviews.map((interview, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:border-primary/20 transition-colors">
                                                            <div className="space-y-1">
                                                                <div className="text-sm font-medium">{interview.template_title}</div>
                                                                <div className="flex gap-2">
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                                                        {interview.difficulty}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground">•</span>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {interview.frequency}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => router.push('/dashboard')}
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Resources Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-primary" />
                                                    <h4 className="text-sm font-semibold text-foreground">Resources</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    {phase.learning_resources.map((resource, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                                        >
                                                            <div className="mt-1 p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                                                                <BookOpen className="w-3 h-3" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                                                    {resource.title}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                                    {resource.description}
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
