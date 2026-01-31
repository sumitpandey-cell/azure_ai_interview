import React from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";

interface PerformanceChartProps {
    data: Array<{
        time: string;
        score: number;
    }>;
}

const ProfilePerformanceChart = React.memo(function ProfilePerformanceChart({ data }: PerformanceChartProps) {
    if (!data.length) return null;

    return (
        <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground) / 0.5)"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground) / 0.5)"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        ticks={[0, 50, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            padding: '8px 12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--primary))', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: 11 }}
                        formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorScore)"
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
});

export default ProfilePerformanceChart;
