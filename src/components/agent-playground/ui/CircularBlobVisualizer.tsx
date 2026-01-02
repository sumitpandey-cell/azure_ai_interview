"use client";

import { useEffect, useRef } from "react";
import type { TrackPublication } from "livekit-client";

interface CircularBlobVisualizerProps {
    agentTrackRef?: { publication?: TrackPublication };
    localTrack?: MediaStreamTrack | null;
    state?: string;
    className?: string;
    size?: number;
}

export function CircularBlobVisualizer({
    agentTrackRef,
    localTrack,
    state = "idle",
    className = "",
    size = 200,
}: CircularBlobVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    // Audio nodes for Agent
    const agentAnalyserRef = useRef<AnalyserNode | null>(null);
    const agentDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

    // Audio nodes for Local
    const localAnalyserRef = useRef<AnalyserNode | null>(null);
    const localDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

    // Setup Agent Audio
    useEffect(() => {
        const audioTrack = agentTrackRef?.publication?.track;
        if (audioTrack && audioTrack.kind === "audio") {
            const mediaStreamTrack = audioTrack.mediaStreamTrack;
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            agentAnalyserRef.current = analyser;
            agentDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

            return () => {
                source.disconnect();
                analyser.disconnect();
                if (audioContext.state !== "closed") audioContext.close();
            };
        }
    }, [agentTrackRef]);

    // Setup Local Audio
    useEffect(() => {
        if (localTrack && localTrack.kind === "audio") {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(new MediaStream([localTrack]));
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.7; // Faster response for local voice
            source.connect(analyser);
            localAnalyserRef.current = analyser;
            localDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

            return () => {
                source.disconnect();
                analyser.disconnect();
                if (audioContext.state !== "closed") audioContext.close();
            };
        }
    }, [localTrack]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const baseRadius = size * 0.3;

        let rotation = 0;

        const animate = () => {
            ctx.clearRect(0, 0, size, size);

            let agentVolume = 0;
            let localVolume = 0;

            if (agentAnalyserRef.current && agentDataRef.current) {
                agentAnalyserRef.current.getByteFrequencyData(agentDataRef.current);
                agentVolume = Array.from(agentDataRef.current).reduce((a, b) => a + b, 0) / agentDataRef.current.length;
            }

            if (localAnalyserRef.current && localDataRef.current) {
                localAnalyserRef.current.getByteFrequencyData(localDataRef.current);
                localVolume = Array.from(localDataRef.current).reduce((a, b) => a + b, 0) / localDataRef.current.length;
            }

            const activeVolume = Math.max(localVolume, agentVolume);
            const normalizedVolume = activeVolume / 255;

            // Background Glow
            const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
            const glowOpacity = 0.05 + normalizedVolume * 0.2;
            const glowColor = agentVolume > localVolume ? "rgba(168, 85, 247," : "rgba(255, 195, 77,"; // Purple for AI, Amber for User

            glowGradient.addColorStop(0, `${glowColor}${glowOpacity})`);
            glowGradient.addColorStop(1, `${glowColor}0)`);
            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, 0, size, size);

            // Draw Blob
            ctx.beginPath();
            const points = 60;
            const time = Date.now() / 1000;

            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;

                // Multi-layered noise effect
                const noise1 = Math.sin(angle * 3 + time * 2) * 5;
                const noise2 = Math.cos(angle * 5 - time * 3) * 3;
                const volumeEffect = normalizedVolume * baseRadius * 1.5;

                const radius = baseRadius + noise1 + noise2 + (Math.random() * volumeEffect * 0.1) + volumeEffect;

                const x = centerX + Math.cos(angle + rotation) * radius;
                const y = centerY + Math.sin(angle + rotation) * radius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            // Blob Styling
            const blobGradient = ctx.createRadialGradient(centerX - 10, centerY - 10, 0, centerX, centerY, baseRadius * 2);
            if (agentVolume > localVolume || (agentVolume === 0 && localVolume === 0 && state === "speaking")) {
                blobGradient.addColorStop(0, "#C084FC"); // purple-400
                blobGradient.addColorStop(0.5, "#A855F7"); // purple-500
                blobGradient.addColorStop(1, "#7E22CE"); // purple-700
            } else if (localVolume > 0) {
                blobGradient.addColorStop(0, "#FCD34D"); // amber-300
                blobGradient.addColorStop(0.5, "#FBBF24"); // amber-400
                blobGradient.addColorStop(1, "#D97706"); // amber-600
            } else {
                blobGradient.addColorStop(0, "#1F2937"); // gray-800
                blobGradient.addColorStop(1, "#111827"); // gray-900
            }

            ctx.fillStyle = blobGradient;
            ctx.fill();


            // Add a subtle rim light/stroke
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Inner circle highlight (3D effect)
            ctx.beginPath();
            ctx.arc(centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, baseRadius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fill();

            rotation += 0.005 + normalizedVolume * 0.05;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [size, state]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                width: size,
                height: size,
                imageRendering: "auto"
            }}
        />
    );
}
