"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Zap, CalendarDays } from "lucide-react";

interface WeeklyActivityChartProps {
    data: Array<{
        day: string;
        count: number;
    }>;
    currentStreak: number;
}

export function WeeklyActivityChart({ data, currentStreak }: WeeklyActivityChartProps) {
    const hasActivity = data.some(d => d.count > 0);

    if (!hasActivity) {
        return (
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden flex flex-col">
                <CardHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Activity className="h-5 w-5 text-amber-500" />
                            </div>
                            Activity Pulse
                        </CardTitle>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 shadow-sm">
                            <Zap className="h-3 w-3 fill-current animate-pulse" />
                            {currentStreak} DAY STREAK
                        </div>
                    </div>
                    <CardDescription>Your weekly interview cadence.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 min-h-[200px]">
                    <div className="text-center space-y-3 max-w-[200px]">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                            <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">No Weekly Activity</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Interviews completed this week will appear here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/40 shadow-xl shadow-amber-500/5 bg-card/50 backdrop-blur-xl rounded-3xl h-full overflow-hidden hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 group flex flex-col">
            <CardHeader className="p-6 pb-2 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            Activity Pulse
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">Session Frequency</CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 shadow-sm group-hover:scale-105 transition-transform">
                        <Zap className="h-3.5 w-3.5 fill-current animate-pulse" />
                        {currentStreak} DAY STREAK
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--amber-500))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--amber-500))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                dx={-5}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '16px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
                                }}
                                itemStyle={{ color: 'hsl(var(--amber-600))' }}
                                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="hsl(var(--amber-500))"
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                strokeWidth={3}
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
