'use client';

import { motion } from 'framer-motion';
import { Target, Star, Brain, Lightbulb, Rocket, Lock, CheckCircle2, Hexagon, Zap, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillNode {
    id: string;
    title: string;
    type: 'phase' | 'goal';
    status: 'locked' | 'active' | 'completed';
    depth: number;
    children?: SkillNode[];
}

interface SkillTreeProps {
    phases: any[];
    progress: any[];
}

export function SkillTree({ phases, progress }: SkillTreeProps) {
    // Transform phases into a tree structure
    const treeData = phases.map((phase, pIdx) => {
        const isUnlocked = pIdx === 0 || (phases[pIdx - 1]?.goals?.length > 0 && phases[pIdx - 1]?.goals?.every((g: any) => progress.some((p: any) => p.milestone_id === g.id)));
        const isCompleted = phase.goals?.length > 0 && phase.goals?.every((g: any) => progress.some((p: any) => p.milestone_id === g.id));

        return {
            id: `phase-${phase.phase_number}`,
            title: phase.title,
            type: 'phase' as const,
            status: isCompleted ? 'completed' : isUnlocked ? 'active' : 'locked',
            depth: 0,
            children: phase.goals?.map((goal: any) => ({
                id: goal.id,
                title: goal.description,
                type: 'goal' as const,
                status: progress.some((p: any) => p.milestone_id === goal.id) ? 'completed' : (isUnlocked ? 'active' : 'locked'),
                depth: 1
            }))
        };
    });

    return (
        <div className="relative w-full overflow-hidden py-4 sm:py-6 px-1 sm:px-2 bg-grid-white/0 rounded-[1rem] sm:rounded-[1.5rem] border-none">
            {/* Legend for clarity */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Achieved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted border border-border" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Locked</span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-12 sm:gap-16 relative z-10 w-full">
                {treeData.map((phaseNode, pIdx) => (
                    <div key={phaseNode.id} className="relative flex flex-col items-center w-full max-w-4xl mx-auto">

                        {/* Phase Node */}
                        <div className="relative group z-20">
                            <SkillNodeItem node={phaseNode} />
                        </div>

                        {/* Branching Connections to Goals */}
                        {phaseNode.children && phaseNode.children.length > 0 && (
                            <div className="relative w-full flex flex-col items-center mt-8 sm:mt-12">
                                {/* Desktop/Tablet Horizontal Connectors */}
                                <div className="absolute -top-12 left-0 w-full h-12 hidden sm:flex justify-center">
                                    <svg width="100%" height="48" viewBox="0 0 1000 48" preserveAspectRatio="none" className="overflow-visible">
                                        {phaseNode.children.map((goalNode: any, gIdx: number) => {
                                            const total = phaseNode.children!.length;
                                            const step = 1000 / (total + 1);
                                            const targetX = (gIdx + 1) * step;
                                            const startX = 500;

                                            return (
                                                <motion.path
                                                    key={`path-${goalNode.id}`}
                                                    d={`M ${startX} 0 C ${startX} 24, ${targetX} 24, ${targetX} 48`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    className={cn(
                                                        goalNode.status === 'completed' ? "text-emerald-500" :
                                                            goalNode.status === 'active' ? "text-amber-500" : "text-border",
                                                        "transition-colors duration-500"
                                                    )}
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 1, delay: pIdx * 0.1 }}
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Mobile Vertical Conectors (Hidden on Desktop) */}
                                <div className="sm:hidden absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8">
                                    <div className={cn(
                                        "w-full h-full",
                                        phaseNode.status === 'completed' ? "bg-emerald-500" : "bg-border"
                                    )} />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 w-full">
                                    {phaseNode.children.map((goalNode: any) => (
                                        <div key={goalNode.id} className="relative w-full sm:w-auto flex flex-col items-center">
                                            {/* Mobile-only connector between stacked goals */}
                                            <SkillNodeItem node={goalNode} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vertical Connection to Next Phase */}
                        {pIdx < treeData.length - 1 && (
                            <div className="absolute -bottom-20 sm:-bottom-24 left-1/2 -translate-x-1/2 w-px h-16 sm:h-24 z-0">
                                <svg width="2" height="100%" className="overflow-visible h-full">
                                    <motion.line
                                        x1="0" y1="0" x2="0" y2="100%"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className={cn(
                                            treeData[pIdx + 1].status !== 'locked' ? "text-emerald-500" : "text-border"
                                        )}
                                        strokeDasharray="8 4"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1 }}
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SkillNodeItem({ node }: { node: any }) {
    const isPhase = node.type === 'phase';
    const isActive = node.status === 'active';
    const isCompleted = node.status === 'completed';
    const isLocked = node.status === 'locked';

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={cn(
                "relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-500 glass-card",
                isPhase ? "w-full sm:w-56 min-h-[85px] sm:h-24" : "w-[90%] sm:w-44 min-h-[75px] sm:h-20",
                isCompleted ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
                    isActive ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]" :
                        "border-border opacity-40 grayscale"
            )}
        >
            {/* Status Label (Bolder Indication) */}
            <div className={cn(
                "absolute -top-3 px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border",
                isCompleted ? "bg-emerald-500 border-emerald-400 text-white" :
                    isActive ? "bg-amber-500 border-amber-400 text-white" :
                        "bg-muted border-border text-muted-foreground shadow-sm"
            )}>
                {isCompleted ? "Achieved" : isActive ? "Current" : "Locked"}
            </div>

            <div className={cn(
                "mb-1.5 p-1 sm:p-1.5 rounded-lg",
                isCompleted ? "bg-emerald-500/20 text-emerald-500" :
                    isActive ? "bg-amber-500/20 text-amber-500" :
                        "bg-muted text-muted-foreground"
            )}>
                {isPhase ? <Hexagon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current opacity-20" /> : <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </div>

            <h3 className={cn(
                "text-center font-bold tracking-tight leading-tight line-clamp-2 px-2",
                isPhase ? "text-xs sm:text-sm uppercase" : "text-[10px] sm:text-xs text-balance",
                isCompleted ? "text-emerald-500" : isActive ? "text-amber-500" : "text-muted-foreground"
            )}>
                {node.title}
            </h3>

            {isCompleted && (
                <CheckCircle2 className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-background" />
            )}
        </motion.div>
    );
}
