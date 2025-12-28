"use client";

import { useEffect, useRef, useState } from "react";
import type { TrackPublication } from "livekit-client";

interface BeautifulBarVisualizerProps {
    trackRef: { publication?: TrackPublication };
    state?: string;
    barCount?: number;
    className?: string;
}

export function BeautifulBarVisualizer({
    trackRef,
    state = "idle",
    barCount = 7,
    className = "",
}: BeautifulBarVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const [bars, setBars] = useState<number[]>(new Array(barCount).fill(0));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 80 * dpr;
        canvas.height = 40 * dpr;
        canvas.style.width = "80px";
        canvas.style.height = "40px";
        ctx.scale(dpr, dpr);

        // Try to get audio track
        const audioTrack = trackRef.publication?.track;
        if (audioTrack && audioTrack.kind === "audio") {
            const mediaStreamTrack = audioTrack.mediaStreamTrack;
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(
                new MediaStream([mediaStreamTrack])
            );
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);

            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [trackRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animate = () => {
            ctx.clearRect(0, 0, 80, 40);

            let heights: number[] = [];

            if (analyserRef.current && dataArrayRef.current && state === "speaking") {
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);

                // Sample data for bars
                const step = Math.floor(dataArrayRef.current.length / barCount);
                for (let i = 0; i < barCount; i++) {
                    const index = i * step;
                    const value = dataArrayRef.current[index] || 0;
                    heights.push((value / 255) * 36 + 4); // 4-40px range
                }
            } else if (state === "thinking") {
                // Pulsing animation for thinking
                const time = Date.now() / 200;
                heights = Array.from({ length: barCount }, (_, i) => {
                    const offset = i * 0.5;
                    return Math.sin(time + offset) * 12 + 16; // 4-28px range
                });
            } else if (state === "listening") {
                // Gentle wave for listening
                const time = Date.now() / 400;
                heights = Array.from({ length: barCount }, (_, i) => {
                    const offset = i * 0.8;
                    return Math.sin(time + offset) * 6 + 10; // 4-16px range
                });
            } else {
                // Idle state - minimal bars
                heights = Array.from({ length: barCount }, () => 4);
            }

            // Draw bars with gradient
            const barWidth = 6;
            const gap = 4;
            const totalWidth = barCount * barWidth + (barCount - 1) * gap;
            const startX = (80 - totalWidth) / 2;

            heights.forEach((height, i) => {
                const x = startX + i * (barWidth + gap);
                const y = 40 - height;

                // Create gradient based on state
                const gradient = ctx.createLinearGradient(x, y, x, 40);

                if (state === "speaking") {
                    gradient.addColorStop(0, "#60a5fa"); // blue-400
                    gradient.addColorStop(0.5, "#3b82f6"); // blue-500
                    gradient.addColorStop(1, "#2563eb"); // blue-600
                } else if (state === "thinking") {
                    gradient.addColorStop(0, "#a78bfa"); // violet-400
                    gradient.addColorStop(0.5, "#8b5cf6"); // violet-500
                    gradient.addColorStop(1, "#7c3aed"); // violet-600
                } else if (state === "listening") {
                    gradient.addColorStop(0, "#34d399"); // emerald-400
                    gradient.addColorStop(0.5, "#10b981"); // emerald-500
                    gradient.addColorStop(1, "#059669"); // emerald-600
                } else {
                    gradient.addColorStop(0, "#64748b"); // slate-500
                    gradient.addColorStop(1, "#475569"); // slate-600
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, height, 3);
                ctx.fill();

                // Add glow effect for active states
                if (state === "speaking" || state === "thinking") {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = state === "speaking" ? "#3b82f6" : "#8b5cf6";
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [state, barCount]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ imageRendering: "auto" }}
        />
    );
}
