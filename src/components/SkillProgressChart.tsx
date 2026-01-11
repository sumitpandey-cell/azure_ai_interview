"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Code, Target } from "lucide-react";

interface SkillProgressChartProps {
    data: Array<{
        name: string;
        averageScore: number;
        count: number;
    }>;
}

export function SkillProgressChart({ data }: SkillProgressChartProps) {
    // Transform data for radar chart
    const chartData = data.slice(0, 6).map(skill => ({
        skill: skill.name,
        score: skill.averageScore
    }));

    if (data.length === 0) {
        return (
            <Card className="border-2 border-border/50 shadow-sm bg-card rounded-2xl h-full overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                    <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Skill Proficiency
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4 sm:p-6 h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <div className="h-12 w-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Code className="h-6 w-6 opacity-30" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">Awaiting operational data for neural mapping</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-border/50 shadow-sm bg-card rounded-2xl h-full overflow-hidden transition-all hover:border-primary/30">
            <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Skill Proficiency
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={chartData}>
                        <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <PolarAngleAxis
                            dataKey="skill"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
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
                            strokeWidth={2}
                            fill="hsl(var(--primary))"
                            fillOpacity={0.2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
