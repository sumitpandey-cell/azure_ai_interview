"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, Area, ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceAnalysisChartProps {
    data: Array<{
        month: string;
        interviewCount: number;
        averageScore: number;
    }>;
    loading?: boolean;
}

export function PerformanceAnalysisChart({ data, loading }: PerformanceAnalysisChartProps) {
    const hasData = data.some(d => d.interviewCount > 0);

    if (loading || !hasData) {
        return (
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden flex flex-col">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        Performance Analytics
                    </CardTitle>
                    <CardDescription>Track your interview mastery over time.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 min-h-[200px]">
                    {loading ? (
                        <div className="w-full h-full space-y-6">
                            <div className="flex items-end justify-between h-32 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full">
                                        <Skeleton className="w-full bg-accent/30 rounded-t-md" style={{ height: `${Math.random() * 40 + 10}%` }} />
                                        <Skeleton className="w-full bg-primary/20 rounded-md" style={{ height: `${Math.random() * 30 + 30}%` }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-2 w-10 bg-muted/40" />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-3 max-w-[200px]">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                                <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">No Data Available</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Complete your first interview to unlock AI-driven insights and progress tracking.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group flex flex-col">
            <CardHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            Performance Analytics
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">Interviews Vs. Average Score</CardDescription>
                    </div>


                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex-1 w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={1} />
                                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                width={50}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                hide
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    backdropFilter: 'blur(12px)',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '16px',
                                    padding: '12px',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ fontWeight: 600, paddingBottom: '4px', color: 'hsl(var(--primary))' }}
                                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '10px', fontWeight: '600', paddingTop: '20px' }}
                                iconType="circle"
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="interviewCount"
                                fill="url(#barGradient)"
                                name="Interviews"
                                radius={[6, 6, 0, 0]}
                                barSize={32}
                                animationDuration={1500}
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="averageScore"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                name="Avg. Score (%)"
                                animationDuration={2000}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

            </CardContent>
        </Card>
    );
}
