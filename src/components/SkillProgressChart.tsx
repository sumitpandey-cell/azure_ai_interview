"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Code } from "lucide-react";

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
            <Card className="border-none shadow-sm h-full">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">Skill Progress</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Complete interviews to see skill progress</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">Skill Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={chartData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                            dataKey="skill"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <Radar
                            name="Score"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
