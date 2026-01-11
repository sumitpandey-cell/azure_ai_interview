"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Zap } from "lucide-react";

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
            <Card className="border-2 border-border/50 shadow-sm bg-card rounded-2xl h-full overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                    <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Activity Pulse
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500">
                            <Zap className="h-3 w-3 fill-current" />
                            {currentStreak} DAY STREAK
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4 sm:p-6 h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <div className="h-12 w-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="h-6 w-6 opacity-30" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">No activity detected in the current cycle</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-border/50 shadow-sm bg-card rounded-2xl h-full overflow-hidden transition-all hover:border-primary/30">
            <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                <CardTitle className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Activity Pulse
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500">
                        <Zap className="h-3 w-3 fill-current" />
                        {currentStreak} DAY STREAK
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
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
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
