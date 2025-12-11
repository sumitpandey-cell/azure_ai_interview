"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line, ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";

interface PerformanceAnalysisChartProps {
    data: Array<{
        month: string;
        interviewCount: number;
        averageScore: number;
    }>;
}

export function PerformanceAnalysisChart({ data }: PerformanceAnalysisChartProps) {
    const hasData = data.some(d => d.interviewCount > 0);

    if (!hasData) {
        return (
            <Card className="border-none shadow-sm h-full">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Performance data will appear here</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            stroke="hsl(var(--border))"
                            allowDecimals={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 100]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            stroke="hsl(var(--border))"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '11px' }}
                            iconType="circle"
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="interviewCount"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                            name="Interviews"
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="averageScore"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                            name="Avg Score (%)"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
