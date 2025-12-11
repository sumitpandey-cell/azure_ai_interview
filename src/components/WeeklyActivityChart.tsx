"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity } from "lucide-react";

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
            <Card className="border-none shadow-sm h-full">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                        <span>Weekly Activity</span>
                        <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                            <span>🔥</span>
                            <span>{currentStreak} Day Streak</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Start interviewing to track your activity</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Weekly Activity</span>
                    <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                        <span>🔥</span>
                        <span>{currentStreak} Day Streak</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            stroke="hsl(var(--border))"
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            stroke="hsl(var(--border))"
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
