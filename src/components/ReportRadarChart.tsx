"use client";

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ReportRadarChartProps {
    data: Array<{
        name: string;
        score: number;
    }>;
    themeKey: string | number;
}

export const ReportRadarChart = React.memo(function ReportRadarChart({ data, themeKey }: ReportRadarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300} key={themeKey}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="hsl(var(--border))" opacity={0.5} />
                <PolarAngleAxis
                    dataKey="name"
                    tick={{ fontSize: 8, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
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
    );
});
