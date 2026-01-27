import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Target, Calendar, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
    id: string;
    title: string;
    description: string;
    target_score: number;
    phase_number: number;
    estimated_date: string;
}

interface ProgressItem {
    milestone_id: string;
    item_type: 'goal' | 'interview' | 'resource' | 'milestone';
    completed_at: string;
}

interface RoadmapMilestonesProps {
    milestones: Milestone[];
    progress: ProgressItem[];
}

export function RoadmapMilestones({ milestones, progress }: RoadmapMilestonesProps) {
    if (!milestones || milestones.length === 0) {
        return null;
    }

    const isMilestoneCompleted = (milestoneId: string) => {
        return progress.some(p => p.milestone_id === milestoneId && p.item_type === 'milestone');
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Success Milestones</h2>
                    <p className="text-[11px] text-muted-foreground">Track your progression towards mastery</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 relative">
                {milestones.map((milestone, idx) => {
                    const isCompleted = isMilestoneCompleted(milestone.id);
                    const isLast = idx === milestones.length - 1;

                    return (
                        <div key={milestone.id} className="group relative">
                            <Card className={cn(
                                "border-none shadow-sm ring-1 transition-all duration-300 overflow-hidden",
                                isCompleted ? "ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/5" : "ring-black/5 dark:ring-white/5 bg-accent/5"
                            )}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-stretch">
                                        {/* Status Sidebar */}
                                        <div className={cn(
                                            "md:w-28 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r transition-colors",
                                            isCompleted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-accent/30 border-accent/20"
                                        )}>
                                            {isCompleted ? (
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Achieved</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/40">
                                                        <Circle className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Upcoming</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 p-5 space-y-3">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest py-0.5 px-2 bg-primary/10 text-primary rounded-md">
                                                            Phase {milestone.phase_number}
                                                        </span>
                                                        <h4 className={cn("text-base font-bold", isCompleted && "text-emerald-700 dark:text-emerald-400")}>
                                                            {milestone.title}
                                                        </h4>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                                                        {milestone.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center md:flex-col md:items-end gap-3 md:gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(milestone.estimated_date)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-black">
                                                        <Target className="w-3.5 h-3.5 text-primary" />
                                                        Target: {milestone.target_score}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress indicator link line */}
                                            {!isLast && (
                                                <div className="hidden md:block absolute left-16 top-full h-6 w-0.5 bg-gradient-to-b from-accent/50 to-transparent" />
                                            )}
                                        </div>

                                        {/* Action Area (if needed) */}
                                        {isCompleted && (
                                            <div className="p-6 flex items-center justify-center bg-emerald-500/5 border-t md:border-t-0 md:border-l border-emerald-500/10">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 flex items-center justify-center text-emerald-500 shadow-sm">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
