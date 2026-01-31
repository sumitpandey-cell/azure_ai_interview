import React from 'react';

interface MiniBarChartProps {
    data?: number[];
    height?: number;
    barWidth?: number;
    color?: string;
}

export function MiniBarChart({
    data = [30, 50, 40, 70, 60],
    height = 32,
    barWidth = 4,
    color = 'currentColor'
}: MiniBarChartProps) {
    // Normalize data to fit within the height
    const maxValue = Math.max(...data);
    const normalizedData = data.map(value => (value / maxValue) * height);

    return (
        <div
            className="flex items-end gap-[3px]"
            style={{ height: `${height}px` }}
        >
            {normalizedData.map((barHeight, index) => (
                <div
                    key={index}
                    className="rounded-t-sm transition-all duration-300 hover:opacity-70"
                    style={{
                        width: `${barWidth}px`,
                        height: `${barHeight}px`,
                        backgroundColor: color,
                        minHeight: '4px' // Ensure bars are visible even with low values
                    }}
                />
            ))}
        </div>
    );
}
