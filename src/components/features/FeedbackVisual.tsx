"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function RadarShape({ hovered }: { hovered: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const ambientRotRef = useRef(0);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Ambient rotation
        ambientRotRef.current += 0.005;

        if (meshRef.current) {
            meshRef.current.rotation.y = time * 0.3 + ambientRotRef.current;
            meshRef.current.rotation.z = time * 0.1;
        }
        if (wireRef.current) {
            wireRef.current.rotation.y = time * 0.3 + ambientRotRef.current;
            wireRef.current.rotation.z = time * 0.1;
        }

        // Pulse effect for the core (like a heart beat or recalibration)
        if (coreRef.current) {
            const pulse = 1 + Math.sin(time * 3) * 0.1 * (hovered ? 1.5 : 1);
            coreRef.current.scale.setScalar(pulse);

            // Subtle morphing
            coreRef.current.rotation.x = time * 0.5;
        }
    });

    // Create axis lines (radar chart skeleton)
    const axes = useMemo(() => {
        const lines = [];
        const vertices = [
            [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1],
            [1, 1, -1], [1, -1, 1], [-1, 1, 1], [-1, -1, -1]
        ].map(v => new THREE.Vector3(...v).normalize().multiplyScalar(2.5));

        return vertices.map((v, i) => (
            <line key={i}>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([0, 0, 0, v.x, v.y, v.z])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial attach="material" color="#10b981" transparent opacity={0.2} />
            </line>
        ));
    }, []);

    return (
        <group>
            {/* Axis Lines - Meaningful Radar Skeleton */}
            <group box={undefined}>{axes}</group>

            {/* Outer faceted shape */}
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[2.5, 0]} />
                <meshStandardMaterial
                    color="#10b981"
                    transparent
                    opacity={0.1}
                    flatShading
                    emissive="#10b981"
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Wireframe overlay */}
            <mesh ref={wireRef}>
                <icosahedronGeometry args={[2.51, 0]} />
                <meshStandardMaterial
                    color="#34d399"
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Pulsing Core - The Score Center */}
            <mesh ref={coreRef}>
                <octahedronGeometry args={[0.8, 0]} />
                <MeshDistortMaterial
                    color="#059669"
                    speed={hovered ? 6 : 3}
                    distort={0.4}
                    radius={1}
                    emissive="#059669"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Decorative Rings */}
            {[1.5, 2.5].map((r, i) => (
                <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[r, 0.005, 16, 100]} />
                    <meshBasicMaterial color="#10b981" transparent opacity={0.05} />
                </mesh>
            ))}
        </group>
    );
}

export default function FeedbackVisual() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="w-full h-full min-h-[220px]"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#10b981" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#34d399" />
                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
                    <RadarShape hovered={hovered} />
                </Float>
            </Canvas>
        </div>
    );
}
