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
            <Card className="border-2 border-border/50 shadow-sm bg-card rounded-2xl h-full overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                    <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Operational Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4 sm:p-6 h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <div className="h-12 w-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-6 w-6 opacity-30" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">Awaiting longitudinal performance data</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-border/50 shadow-sm bg-card rounded-2xl h-full overflow-hidden transition-all hover:border-primary/30">
            <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Operational Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '2px solid hsl(var(--border)/0.5)',
                                borderRadius: '1rem',
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            iconType="circle"
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="interviewCount"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                            name="Enactments"
                            radius={[6, 6, 0, 0]}
                            barSize={30}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="averageScore"
                            stroke="hsl(var(--accent))"
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--accent))', r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            name="Mean Precision (%)"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
