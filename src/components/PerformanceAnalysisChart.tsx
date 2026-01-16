"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, Area, ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceAnalysisChartProps {
    data: Array<{
        month: string;
        interviewCount: number;
        averageScore: number;
    }>;
}

export function PerformanceAnalysisChart({ data }: PerformanceAnalysisChartProps) {
    const hasData = data.some(d => d.interviewCount > 0);

    // Calculate Trend (Mock logic for display purposes if real historical data isn't deep enough)
    const currentScore = data[data.length - 1]?.averageScore || 0;
    const previousScore = data[data.length - 2]?.averageScore || 0;
    const trend = currentScore - previousScore;
    const trendPercentage = previousScore > 0 ? ((trend / previousScore) * 100).toFixed(1) : 0;

    if (!hasData) {
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
                    <div className="text-center space-y-3 max-w-[200px]">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                            <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">No Data Available</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Complete your first interview to unlock AI-driven insights and progress tracking.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group">
            <CardHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            Performance Analytics
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">Interviews Vs. Average Score</CardDescription>
                    </div>

                    {/* Trend Badge */}
                    <div className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border",
                        trend > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            trend < 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                "bg-muted text-muted-foreground border-border"
                    )}>
                        {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> :
                            trend < 0 ? <TrendingDown className="h-3.5 w-3.5" /> :
                                <Minus className="h-3.5 w-3.5" />}
                        {Math.abs(Number(trendPercentage))}%
                        <span className="opacity-70 font-normal">vs last month</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="h-[250px] w-full mt-4 pr-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                dx={-5}
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
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '16px',
                                    padding: '12px',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ fontWeight: 600, paddingBottom: '4px' }}
                                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '20px', paddingBottom: '10px' }}
                                iconType="circle"
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="interviewCount"
                                fill="url(#barGradient)"
                                name="Interviews"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
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

                {/* Micro Insight Footer */}
                <div className="p-4 bg-muted/30 border-t border-border/50 flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">AI Insight:</span> Your consistency is improving. Try focusing on <span className="text-primary italic">System Design</span> topics to boost your average score above 85%.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
