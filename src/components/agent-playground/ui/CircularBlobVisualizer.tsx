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

    // Performance tracking
    const frameCountRef = useRef(0);

    // Setup Agent Audio
    useEffect(() => {
        const audioTrack = agentTrackRef?.publication?.track;
        if (audioTrack && audioTrack.kind === "audio") {
            const mediaStreamTrack = audioTrack.mediaStreamTrack;
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            if (audioContext.state === 'suspended') audioContext.resume();
            const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64; // Smaller FFT for performance
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
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            if (audioContext.state === 'suspended') audioContext.resume();
            const source = audioContext.createMediaStreamSource(new MediaStream([localTrack]));
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64; // Smaller FFT for performance
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

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const baseRadius = size * 0.32;

        // Initialize particles with adaptive count
        if (particlesRef.current.length === 0) {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            const count = isMobile ? 60 : 150; // Optimized count
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                particlesRef.current.push({
                    phi,
                    theta,
                    size: Math.random() * 0.8 + 0.5,
                });
            }
        }

        let rotationY = 0;
        let rotationX = 0;
        let smoothedVolume = 0;
        let smoothedAgentVolume = 0;
        let smoothedLocalVolume = 0;
        let lastFrameTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastFrameTime;
            lastFrameTime = currentTime;

            // Cap deltaTime
            const effectiveDelta = Math.min(deltaTime, 33);
            frameCountRef.current++;

            // Adaptive frame skipping on heavy loads if needed
            // For now just optimized rendering

            const isDark = document.documentElement.classList.contains('dark');
            ctx.clearRect(0, 0, size, size);

            // Throttle volume sampling (every 2 frames)
            if (frameCountRef.current % 2 === 0) {
                let agentVolume = 0;
                let localVolume = 0;

                if (agentAnalyserRef.current && agentDataRef.current) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    agentAnalyserRef.current.getByteFrequencyData(agentDataRef.current as any);
                    let sum = 0;
                    // Only sample relevant frequency range for performance
                    const len = Math.floor(agentDataRef.current.length * 0.8);
                    for (let i = 0; i < len; i++) sum += agentDataRef.current[i];
                    agentVolume = sum / len;
                }

                if (localAnalyserRef.current && localDataRef.current) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    localAnalyserRef.current.getByteFrequencyData(localDataRef.current as any);
                    let sum = 0;
                    const len = Math.floor(localDataRef.current.length * 0.8);
                    for (let i = 0; i < len; i++) sum += localDataRef.current[i];
                    localVolume = sum / len;
                }

                const lerpFactor = 0.3;
                smoothedAgentVolume = smoothedAgentVolume * (1 - lerpFactor) + agentVolume * lerpFactor;
                smoothedLocalVolume = smoothedLocalVolume * (1 - lerpFactor) + localVolume * lerpFactor;
            }

            const activeVolume = Math.max(smoothedLocalVolume, smoothedAgentVolume);
            smoothedVolume = smoothedVolume * 0.8 + activeVolume * 0.2;
            const normalizedVolume = Math.min(smoothedVolume / 140, 1.0);

            const AGENT_ACTIVE = state === "speaking" || smoothedAgentVolume > 8;
            const LOCAL_ACTIVE = smoothedLocalVolume > 10;

            // Base Colors
            let primaryColor = { r: 168, g: 85, b: 247 };
            let glowOpacity = isDark ? 0.08 : 0.12;

            if (!AGENT_ACTIVE && LOCAL_ACTIVE) {
                primaryColor = { r: 245, g: 158, b: 11 };
            } else if (!AGENT_ACTIVE && !LOCAL_ACTIVE) {
                primaryColor = isDark ? { r: 71, g: 85, b: 105 } : { r: 15, g: 23, b: 42 };
                glowOpacity = isDark ? 0.02 : 0.08;
            }

            // Draw Background Glow
            const dynamicGlow = glowOpacity + (normalizedVolume * (isDark ? 0.2 : 0.1));
            ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${dynamicGlow})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Update Rotations
            const rotationSpeed = effectiveDelta / 1000;
            rotationY += (0.15 + normalizedVolume * 1.2) * rotationSpeed;
            rotationX += (0.08 + normalizedVolume * 0.6) * rotationSpeed;

            const time = currentTime / 1000;
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);

            // Batched Particle Rendering
            // Group particles by opacity regions to potentially reduce state changes if using complex paths,
            // but for arc() + fill(), we just minimize stroke/fill changes.

            const idleColor = isDark ? '148, 163, 184' : '30, 41, 59';
            const agentFill = isDark ? '192, 132, 252' : '126, 34, 206';
            const localFill = isDark ? '252, 211, 77' : '217, 119, 6';

            particlesRef.current.forEach(p => {
                let x = Math.sin(p.phi) * Math.cos(p.theta);
                let y = Math.sin(p.phi) * Math.sin(p.theta);
                let z = Math.cos(p.phi);

                // Inline math for speed
                const x1 = x * cosY - z * sinY;
                const z1 = x * sinY + z * cosY;
                const y2 = y * cosX - z1 * sinX;
                const z2 = y * sinX + z1 * cosX;

                x = x1; y = y2; z = z2;

                const noise = Math.sin(p.phi * 5 + time * 1.5) * 0.02;
                const volumeOffset = normalizedVolume * 0.25;
                const radius = baseRadius * (1 + noise + volumeOffset);

                const px = centerX + x * radius;
                const py = centerY + y * radius;
                const psize = p.size * (z + 2) * 0.45;

                const depthFactor = (z + 1.5) / 2.5;
                const opacity = isDark ? depthFactor : Math.min(depthFactor * 1.1 + 0.2, 1.0);

                ctx.beginPath();
                ctx.arc(px, py, Math.max(0.1, psize), 0, Math.PI * 2);

                if (AGENT_ACTIVE) {
                    ctx.fillStyle = `rgba(${agentFill}, ${opacity})`;
                } else if (LOCAL_ACTIVE) {
                    ctx.fillStyle = `rgba(${localFill}, ${opacity})`;
                } else {
                    ctx.fillStyle = `rgba(${idleColor}, ${opacity})`;
                }
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

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
                imageRendering: "auto",
                willChange: "transform"
            }}
        />
    );
}
