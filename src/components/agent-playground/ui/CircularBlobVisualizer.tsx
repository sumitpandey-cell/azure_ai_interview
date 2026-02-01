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
            const count = isMobile ? 80 : 200; // Increased for better detail
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                particlesRef.current.push({
                    phi,
                    theta,
                    size: Math.random() * 1.2 + 0.6,
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

            const effectiveDelta = Math.min(deltaTime, 33);
            frameCountRef.current++;

            const isDark = document.documentElement.classList.contains('dark');
            ctx.clearRect(0, 0, size, size);

            // Throttle volume sampling
            if (frameCountRef.current % 2 === 0) {
                let agentVolume = 0;
                let localVolume = 0;

                if (agentAnalyserRef.current && agentDataRef.current) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    agentAnalyserRef.current.getByteFrequencyData(agentDataRef.current as any);
                    let sum = 0;
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

            // Base Colors & Styles
            let primaryColor = { r: 168, g: 85, b: 247 }; // Purple
            let secondaryColor = { r: 236, g: 72, b: 153 }; // Pink

            if (!AGENT_ACTIVE && LOCAL_ACTIVE) {
                primaryColor = { r: 245, g: 158, b: 11 }; // Amber
                secondaryColor = { r: 251, g: 191, b: 36 };
            } else if (!AGENT_ACTIVE && !LOCAL_ACTIVE) {
                primaryColor = isDark ? { r: 71, g: 85, b: 105 } : { r: 15, g: 23, b: 42 };
                secondaryColor = primaryColor;
            }

            // 1. Draw Inner Glow (Nucleus)
            const nucleusRadius = baseRadius * (0.4 + normalizedVolume * 0.3);
            const nucleusGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, nucleusRadius);
            nucleusGradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${isDark ? 0.35 : 0.25})`);
            nucleusGradient.addColorStop(1, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0)`);

            ctx.fillStyle = nucleusGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, nucleusRadius, 0, Math.PI * 2);
            ctx.fill();

            // 2. Draw Outer Atmosphere
            const atmosphereRadius = baseRadius * (1.2 + normalizedVolume * 0.5);
            const atmosphereGradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.8, centerX, centerY, atmosphereRadius);
            atmosphereGradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0)`);
            atmosphereGradient.addColorStop(0.5, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, ${isDark ? 0.05 : 0.08})`);
            atmosphereGradient.addColorStop(1, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0)`);

            ctx.fillStyle = atmosphereGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, atmosphereRadius, 0, Math.PI * 2);
            ctx.fill();

            // Update Rotations
            const rotationSpeed = effectiveDelta / 1000;
            const targetRotationSpeed = (0.2 + normalizedVolume * 1.5);
            rotationY += targetRotationSpeed * rotationSpeed;
            rotationX += (targetRotationSpeed * 0.5) * rotationSpeed;

            const time = currentTime / 1000;
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);

            // 3. Render Particles with 3D sorting simulation (Back to Front)
            const sortedParticles = particlesRef.current.map(p => {
                const x = Math.sin(p.phi) * Math.cos(p.theta);
                const y = Math.sin(p.phi) * Math.sin(p.theta);
                const z = Math.cos(p.phi);

                // Rotation transforms
                const x1 = x * cosY - z * sinY;
                const z1 = x * sinY + z * cosY;
                const y2 = y * cosX - z1 * sinX;
                const z2 = y * sinX + z1 * cosX;

                return { ...p, rx: x1, ry: y2, rz: z2 };
            });

            // Sort by depth (Z)
            sortedParticles.sort((a, b) => a.rz - b.rz);

            sortedParticles.forEach(p => {
                const noise = Math.sin(p.phi * 8 + time * 1.2) * 0.03;
                const volumeOffset = normalizedVolume * 0.35 * (1 + Math.random() * 0.1);
                const radius = baseRadius * (1 + noise + volumeOffset);

                const px = centerX + p.rx * radius;
                const py = centerY + p.ry * radius;

                // Enhanced perspective scaling
                const perspective = (p.rz + 1.5) / 2.5;
                const psize = p.size * perspective * 0.8;

                // Color depth awareness
                const opacity = isDark ? Math.max(0.2, perspective) : Math.min(perspective * 1.2 + 0.1, 1.0);

                // Light source simulation (top-left)
                const lightEffect = Math.max(0, (-p.rx - p.ry + p.rz) / 3);

                ctx.beginPath();
                ctx.arc(px, py, Math.max(0.5, psize), 0, Math.PI * 2);

                if (AGENT_ACTIVE) {
                    const r = primaryColor.r + (secondaryColor.r - primaryColor.r) * lightEffect;
                    const g = primaryColor.g + (secondaryColor.g - primaryColor.g) * lightEffect;
                    const b = primaryColor.b + (secondaryColor.b - primaryColor.b) * lightEffect;
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                } else if (LOCAL_ACTIVE) {
                    ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${opacity})`;
                } else {
                    const idleColor = isDark ? 140 : 20;
                    ctx.fillStyle = `rgba(${idleColor}, ${idleColor}, ${idleColor}, ${opacity * 0.6})`;
                }

                ctx.fill();

                // Add small flare for front particles
                if (p.rz > 0.8 && activeVolume > 20) {
                    ctx.beginPath();
                    ctx.arc(px, py, psize * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${opacity * 0.3})`;
                    ctx.fill();
                }
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
