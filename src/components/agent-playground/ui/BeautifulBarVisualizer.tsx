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
    const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const [bars, setBars] = useState<number[]>(new Array(barCount).fill(0));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size based on container or default
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || 120;
        const height = rect.height || 60;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
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
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
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
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);

            ctx.clearRect(0, 0, width, height);

            let heights: number[] = [];

            if (analyserRef.current && dataArrayRef.current && state === "speaking") {
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);

                // Sample data for bars
                const step = Math.floor(dataArrayRef.current.length / barCount);
                for (let i = 0; i < barCount; i++) {
                    const index = i * step;
                    const value = dataArrayRef.current[index] || 0;
                    heights.push((value / 255) * (height * 0.9) + (height * 0.1));
                }
            } else if (state === "thinking") {
                // Pulsing animation for thinking
                const time = Date.now() / 200;
                heights = Array.from({ length: barCount }, (_, i) => {
                    const offset = i * 0.5;
                    return Math.sin(time + offset) * (height * 0.3) + (height * 0.4);
                });
            } else if (state === "listening") {
                // Gentle wave for listening
                const time = Date.now() / 400;
                heights = Array.from({ length: barCount }, (_, i) => {
                    const offset = i * 0.8;
                    return Math.sin(time + offset) * (height * 0.15) + (height * 0.25);
                });
            } else {
                // Idle state - minimal bars
                heights = Array.from({ length: barCount }, () => 4);
            }

            // Draw bars with gradient
            const barWidth = Math.max(2, (width / barCount) * 0.6);
            const gap = (width - barCount * barWidth) / (barCount + 1);
            const startX = gap;

            heights.forEach((h, i) => {
                const x = startX + i * (barWidth + gap);
                const y = height - h;

                // Create gradient based on state
                const gradient = ctx.createLinearGradient(x, y, x, height);

                if (state === "speaking") {
                    gradient.addColorStop(0, "#4fd1c5"); // teal-400
                    gradient.addColorStop(0.5, "#38b2ac"); // teal-500
                    gradient.addColorStop(1, "#2c7a7b"); // teal-600
                } else if (state === "thinking") {
                    gradient.addColorStop(0, "#a78bfa"); // violet-400
                    gradient.addColorStop(0.5, "#8b5cf6"); // violet-500
                    gradient.addColorStop(1, "#7c3aed"); // violet-600
                } else if (state === "listening") {
                    gradient.addColorStop(0, "#4fd1c5"); // teal-400
                    gradient.addColorStop(1, "#2d3748"); // slate-700
                } else {
                    gradient.addColorStop(0, "#718096"); // slate-400
                    gradient.addColorStop(1, "#2d3748"); // slate-700
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, h, barWidth / 2);
                ctx.fill();

                // Add glow effect for active states
                if (state === "speaking" || state === "thinking") {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = state === "speaking" ? "#4fd1c5" : "#8b5cf6";
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
