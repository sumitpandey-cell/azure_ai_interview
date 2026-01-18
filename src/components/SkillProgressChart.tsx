"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Code, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SkillProgressChartProps {
    data: Array<{
        name: string;
        averageScore: number;
        count: number;
    }>;
    loading?: boolean;
}

export function SkillProgressChart({ data, loading }: SkillProgressChartProps) {
    // Transform data for radar chart
    const chartData = data.slice(0, 6).map(skill => ({
        skill: skill.name,
        score: skill.averageScore,
        fullMark: 100
    }));

    if (loading || data.length === 0) {
        return (
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden flex flex-col">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <BrainCircuit className="h-5 w-5 text-emerald-500" />
                        </div>
                        Skill Matrix
                    </CardTitle>
                    <CardDescription>Visualize your technical strengths.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 min-h-[200px]">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="relative h-40 w-40">
                                <Skeleton className="absolute inset-0 rounded-full bg-muted/50" />
                                <div className="absolute inset-4 rounded-full border-2 border-dashed border-border/50 animate-spin-slow" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <BrainCircuit className="h-10 w-10 text-muted-foreground/20" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-3 max-w-[200px]">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                                <Code className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">No Skills Analyzed</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Start an interview to map your technical proficiencies.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/40 shadow-xl shadow-emerald-500/5 bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group flex flex-col">
            <CardHeader className="p-6 pb-2 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            Skill Matrix
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">Proficiency by Category</CardDescription>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Target className="h-4 w-4 text-emerald-600" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <div className="h-full w-full flex items-center justify-center p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <defs>
                                <radialGradient id="radarFill" cx="0.5" cy="0.5" r="0.5">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                </radialGradient>
                            </defs>
                            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
                            <PolarAngleAxis
                                dataKey="skill"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={false}
                                axisLine={false}
                            />
                            <Radar
                                name="Proficiency"
                                dataKey="score"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fill="url(#radarFill)"
                                fillOpacity={1}
                                animationDuration={1500}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '12px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
