"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PublicPerformanceChartProps {
    data: Array<{
        time: string;
        score: number;
    }>;
}

export function PublicPerformanceChart({ data }: PublicPerformanceChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    dy={15}
                />
                <YAxis hide domain={[0, 105]} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#0c1221',
                        border: '1px solid #ffffff10',
                        borderRadius: '16px',
                        padding: '12px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 800 }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    dot={{ fill: '#6366f1', strokeWidth: 3, r: 5, stroke: '#0c1221' }}
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3, fill: '#6366f1' }}
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
