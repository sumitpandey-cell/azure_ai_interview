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
    const agentDataRef = useRef<Uint8Array | null>(null);

    // Audio nodes for Local
    const localAnalyserRef = useRef<AnalyserNode | null>(null);
    const localDataRef = useRef<Uint8Array | null>(null);

    // Particles for the globe
    const particlesRef = useRef<{ phi: number; theta: number; size: number }[]>([]);

    // Setup Agent Audio
    useEffect(() => {
        const audioTrack = agentTrackRef?.publication?.track;
        if (audioTrack && audioTrack.kind === "audio") {
            const mediaStreamTrack = audioTrack.mediaStreamTrack;
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            if (audioContext.state === 'suspended') audioContext.resume();
            const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            agentAnalyserRef.current = analyser;
            agentDataRef.current = new Uint8Array(analyser.frequencyBinCount);

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
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            if (audioContext.state === 'suspended') audioContext.resume();
            const source = audioContext.createMediaStreamSource(new MediaStream([localTrack]));
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.7;
            source.connect(analyser);
            localAnalyserRef.current = analyser;
            localDataRef.current = new Uint8Array(analyser.frequencyBinCount);

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
        const baseRadius = size * 0.32;

        // Initialize particles if not already done
        if (particlesRef.current.length === 0) {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            const count = isMobile ? 80 : 200; // Significantly reduced density
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                particlesRef.current.push({
                    phi,
                    theta,
                    size: Math.random() * 0.8 + 0.4,
                });
            }
        }

        let rotationY = 0;
        let rotationX = 0;
        let smoothedVolume = 0;
        let smoothedAgentVolume = 0;
        let smoothedLocalVolume = 0;
        let lastFrameTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const deltaTime = now - lastFrameTime;
            lastFrameTime = now;

            // Cap deltaTime to prevent jumps
            const effectiveDelta = Math.min(deltaTime, 33);

            const isDark = document.documentElement.classList.contains('dark');
            ctx.clearRect(0, 0, size, size);

            let agentVolume = 0;
            let localVolume = 0;

            if (agentAnalyserRef.current && agentDataRef.current) {
                // @ts-expect-error - frequency data buffer mismatch
                agentAnalyserRef.current.getByteFrequencyData(agentDataRef.current);
                let sum = 0;
                for (let i = 0; i < agentDataRef.current.length; i++) sum += agentDataRef.current[i];
                agentVolume = sum / agentDataRef.current.length;
            }

            if (localAnalyserRef.current && localDataRef.current) {
                // @ts-expect-error - frequency data buffer mismatch
                localAnalyserRef.current.getByteFrequencyData(localDataRef.current);
                let sum = 0;
                for (let i = 0; i < localDataRef.current.length; i++) sum += localDataRef.current[i];
                localVolume = sum / localDataRef.current.length;
            }

            // Smoothing
            const lerpFactor = Math.min(effectiveDelta / 50, 0.5);
            smoothedAgentVolume = smoothedAgentVolume * (1 - lerpFactor) + agentVolume * lerpFactor;
            smoothedLocalVolume = smoothedLocalVolume * (1 - lerpFactor) + localVolume * lerpFactor;

            const activeVolume = Math.max(smoothedLocalVolume, smoothedAgentVolume);
            smoothedVolume = smoothedVolume * 0.7 + activeVolume * 0.3;
            const normalizedVolume = Math.min(smoothedVolume / 150, 1.0);

            // State indicators
            const AGENT_ACTIVE = state === "speaking" || smoothedAgentVolume > 10;
            const LOCAL_ACTIVE = smoothedLocalVolume > 12;

            // Base Colors
            let primaryColor = { r: 168, g: 85, b: 247 };
            let glowOpacity = isDark ? 0.08 : 0.15;

            if (!AGENT_ACTIVE && LOCAL_ACTIVE) {
                primaryColor = { r: 245, g: 158, b: 11 };
            } else if (!AGENT_ACTIVE && !LOCAL_ACTIVE) {
                primaryColor = isDark ? { r: 71, g: 85, b: 105 } : { r: 15, g: 23, b: 42 };
                glowOpacity = isDark ? 0.03 : 0.1;
            }

            // Background Ambient Glow - Simplified
            const dynamicGlow = glowOpacity + (normalizedVolume * (isDark ? 0.25 : 0.15));
            ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${dynamicGlow})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size / 3, 0, Math.PI * 2);
            ctx.fill();

            // Update Rotations
            const rotationSpeed = effectiveDelta / 1000;
            rotationY += (0.2 + normalizedVolume * 1.5) * rotationSpeed;
            rotationX += (0.1 + normalizedVolume * 0.8) * rotationSpeed;

            const time = now / 1000;
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);

            // Render Particles without pre-sorting for performance
            particlesRef.current.forEach(p => {
                let x = Math.sin(p.phi) * Math.cos(p.theta);
                let y = Math.sin(p.phi) * Math.sin(p.theta);
                let z = Math.cos(p.phi);

                // Rotate Y
                const x1 = x * cosY - z * sinY;
                const z1 = x * sinY + z * cosY;
                x = x1; z = z1;

                // Rotate X
                const y2 = y * cosX - z * sinX;
                const z2 = y * sinX + z * cosX;
                y = y2; z = z2;

                const noise = Math.sin(p.phi * 5 + time * 2) * 0.03;
                const volumeOffset = normalizedVolume * 0.3;
                const radius = baseRadius * (1 + noise + volumeOffset);

                const px = centerX + x * radius;
                const py = centerY + y * radius;
                const psize = p.size * (z + 2) / 2;

                const depthFactor = (z + 1.5) / 2.5;
                const opacity = isDark ? depthFactor : Math.min(depthFactor * 1.2 + 0.3, 1.0);

                ctx.beginPath();
                ctx.arc(px, py, psize, 0, Math.PI * 2);

                if (AGENT_ACTIVE) {
                    ctx.fillStyle = isDark ? `rgba(192, 132, 252, ${opacity})` : `rgba(126, 34, 206, ${opacity})`;
                } else if (LOCAL_ACTIVE) {
                    ctx.fillStyle = isDark ? `rgba(252, 211, 77, ${opacity})` : `rgba(217, 119, 6, ${opacity})`;
                } else {
                    const idleColor = isDark ? '148, 163, 184' : '30, 41, 59';
                    ctx.fillStyle = `rgba(${idleColor}, ${opacity})`;
                }
                ctx.fill();
            });

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
