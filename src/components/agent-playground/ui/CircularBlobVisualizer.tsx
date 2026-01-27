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
            const count = 400; // Increased density
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                particlesRef.current.push({
                    phi,
                    theta,
                    size: Math.random() * 1.0 + 0.5, // Slightly smaller dots
                });
            }
        }

        let rotationX = 0;
        let rotationY = 0;
        let smoothedVolume = 0;
        let smoothedAgentVolume = 0;
        let smoothedLocalVolume = 0;

        const animate = () => {
            const isDark = document.documentElement.classList.contains('dark');
            ctx.clearRect(0, 0, size, size);

            let agentVolume = 0;
            let localVolume = 0;

            if (agentAnalyserRef.current && agentDataRef.current) {
                if (agentAnalyserRef.current.context.state === 'suspended') {
                    (agentAnalyserRef.current.context as AudioContext).resume();
                }
                // @ts-expect-error - Uint8Array type mismatch in some TS versions with AudioContext
                agentAnalyserRef.current.getByteFrequencyData(agentDataRef.current);
                let sum = 0;
                for (let i = 0; i < agentDataRef.current.length; i++) sum += agentDataRef.current[i];
                agentVolume = sum / agentDataRef.current.length;
            }

            if (localAnalyserRef.current && localDataRef.current) {
                if (localAnalyserRef.current.context.state === 'suspended') {
                    (localAnalyserRef.current.context as AudioContext).resume();
                }
                // @ts-expect-error - Uint8Array type mismatch in some TS versions with AudioContext
                localAnalyserRef.current.getByteFrequencyData(localDataRef.current);
                let sum = 0;
                for (let i = 0; i < localDataRef.current.length; i++) sum += localDataRef.current[i];
                localVolume = sum / localDataRef.current.length;
            }

            // Smoothing
            smoothedAgentVolume = smoothedAgentVolume * 0.8 + agentVolume * 0.2;
            smoothedLocalVolume = smoothedLocalVolume * 0.8 + localVolume * 0.2;

            const activeVolume = Math.max(smoothedLocalVolume, smoothedAgentVolume);
            smoothedVolume = smoothedVolume * 0.7 + activeVolume * 0.3;
            const normalizedVolume = smoothedVolume / 150;

            // State indicators
            const AGENT_ACTIVE = state === "speaking" || smoothedAgentVolume > 10;
            const LOCAL_ACTIVE = smoothedLocalVolume > 12;

            // Base Colors & Opacities based on theme
            let primaryColor = { r: 168, g: 85, b: 247 }; // Purple (Agent)
            let glowOpacity = isDark ? 0.15 : 0.25;

            if (!AGENT_ACTIVE && LOCAL_ACTIVE) {
                primaryColor = { r: 251, g: 191, b: 36 }; // Amber (Local)
            } else if (!AGENT_ACTIVE && !LOCAL_ACTIVE) {
                // Adaptive Idle Color
                primaryColor = isDark ? { r: 71, g: 85, b: 105 } : { r: 15, g: 23, b: 42 };
                glowOpacity = isDark ? 0.08 : 0.12;
            }

            // Background Ambient Glow
            const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
            const dynamicGlow = glowOpacity + (normalizedVolume * (isDark ? 0.4 : 0.3));
            glowGradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${dynamicGlow})`);
            glowGradient.addColorStop(1, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, 0, size, size);

            // Update Rotations
            rotationY += 0.005 + normalizedVolume * 0.02;
            rotationX += 0.002 + normalizedVolume * 0.01;

            const time = Date.now() / 1000;

            // Projected Particles
            const projectedParticles = particlesRef.current.map(p => {
                let x = Math.sin(p.phi) * Math.cos(p.theta);
                let y = Math.sin(p.phi) * Math.sin(p.theta);
                let z = Math.cos(p.phi);

                // Rotate around Y
                const x1 = x * Math.cos(rotationY) - z * Math.sin(rotationY);
                const z1 = x * Math.sin(rotationY) + z * Math.cos(rotationY);
                x = x1; z = z1;

                // Rotate around X
                const y2 = y * Math.cos(rotationX) - z * Math.sin(rotationX);
                const z2 = y * Math.sin(rotationX) + z * Math.cos(rotationX);
                y = y2; z = z2;

                const noise = Math.sin(p.phi * 5 + time * 2) * Math.cos(p.theta * 5 + time * 3) * 0.05;
                const volumeOffset = normalizedVolume * 0.4;
                const radius = baseRadius * (1 + noise + volumeOffset);

                return {
                    x: centerX + x * radius,
                    y: centerY + y * radius,
                    z,
                    size: p.size * (z + 2) / 2
                };
            }).sort((a, b) => a.z - b.z);

            // Render Particles
            projectedParticles.forEach(p => {
                const depthFactor = (p.z + 1.5) / 2.5;
                const opacity = isDark ? depthFactor : depthFactor * 0.8 + 0.2; // Higher base opacity in light mode

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                if (AGENT_ACTIVE) {
                    ctx.fillStyle = isDark ? `rgba(192, 132, 252, ${opacity})` : `rgba(147, 51, 234, ${opacity})`;
                } else if (LOCAL_ACTIVE) {
                    ctx.fillStyle = isDark ? `rgba(252, 211, 77, ${opacity})` : `rgba(217, 119, 6, ${opacity})`;
                } else {
                    // Idle state particles
                    const idleColor = isDark ? '148, 163, 184' : '51, 65, 85';
                    ctx.fillStyle = `rgba(${idleColor}, ${opacity * (isDark ? 0.5 : 0.7)})`;
                }

                ctx.fill();

                // Add point glow for front particles
                if (p.z > 0.4 && (AGENT_ACTIVE || LOCAL_ACTIVE)) {
                    ctx.shadowBlur = isDark ? 4 : 2;
                    ctx.shadowColor = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${opacity})`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
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
