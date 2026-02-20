"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";

function WaveTerrain({ hovered }: { hovered: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const amplitudeRef = useRef(0.4);

    // Create a dense grid for the terrain
    const { positions, indices, colors } = useMemo(() => {
        const size = 30;
        const resolution = 60;
        const pos = [];
        const ind = [];
        const cols = [];

        const color1 = new THREE.Color("#6366f1"); // Indigo
        const color2 = new THREE.Color("#a855f7"); // Purple

        for (let x = 0; x <= resolution; x++) {
            for (let z = 0; z <= resolution; z++) {
                const px = (x / resolution - 0.5) * size;
                const pz = (z / resolution - 0.5) * size;
                pos.push(px, 0, pz);

                // Gradient based on X position (left to right)
                const mixedColor = color1.clone().lerp(color2, x / resolution);
                cols.push(mixedColor.r, mixedColor.g, mixedColor.b);
            }
        }

        for (let x = 0; x < resolution; x++) {
            for (let z = 0; z < resolution; z++) {
                const i = x * (resolution + 1) + z;
                ind.push(i, i + 1, i + resolution + 1);
                ind.push(i + 1, i + resolution + 2, i + resolution + 1);
            }
        }

        return {
            positions: new Float32Array(pos),
            indices: new Uint16Array(ind),
            colors: new Float32Array(cols)
        };
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const posAttr = meshRef.current.geometry.attributes.position;

        // Smoothly transition amplitude based on hover state
        const targetAmp = hovered ? 1.0 : 0.4;
        amplitudeRef.current = THREE.MathUtils.lerp(amplitudeRef.current, targetAmp, 0.05);

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);

            // Directional flow (left to right)
            // Using (x - time) makes waves travel right
            const h1 = Math.sin(x * 0.5 - time * 2.5) * Math.cos(z * 0.3 + time * 0.5);
            const h2 = Math.sin(x * 1.2 - time * 4.0) * 0.3;
            const h3 = Math.sin(z * 0.5 + time * 1.0) * 0.2;

            // Distance falloff from center 
            const dist = Math.sqrt(x * x + z * z);
            const falloff = Math.max(0, 1 - dist / 14);

            posAttr.setY(i, (h1 + h2 + h3) * amplitudeRef.current * falloff * 2.8);
        }

        posAttr.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 10, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="index"
                    count={indices.length}
                    array={indices}
                    itemSize={1}
                    args={[indices, 1]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <meshStandardMaterial
                vertexColors
                wireframe
                transparent
                opacity={0.35}
                emissive="#4f46e5"
                emissiveIntensity={0.5}
            />
        </mesh>
    );
}

export default function WaveVisual() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="w-full h-full min-h-[220px]"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
                <pointLight position={[-10, 5, -5]} intensity={0.8} color="#c084fc" />
                <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                    <WaveTerrain hovered={hovered} />
                </Float>
            </Canvas>
        </div>
    );
}
