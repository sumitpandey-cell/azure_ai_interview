"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, RoundedBox, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function RoleCard({ position, color, text, delay }: { position: [number, number, number], color: string, text: string, delay: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (!meshRef.current) return;

        // Parallax depth effect
        const mx = state.mouse.x * 0.8;
        const my = state.mouse.y * 0.8;

        // Individual float offset
        const floatY = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.2;

        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, position[0] + mx, 0.05);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1] + my + floatY, 0.05);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, position[2] + (hovered ? 1 : 0), 0.1);

        // Hover scale & rotation
        const targetScale = hovered ? 1.05 : 1;
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1));

        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, mx * 0.1, 0.05);
    });

    return (
        <mesh
            ref={meshRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <RoundedBox args={[3.2, 1.2, 0.15]} radius={0.12} smoothness={4}>
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.4}
                    metalness={0.8}
                    roughness={0.1}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.6 : 0.2}
                />
            </RoundedBox>
            <Text
                position={[0, 0, 0.1]}
                fontSize={0.24}
                color="white"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
            >
                {text}
            </Text>
        </mesh>
    );
}

export default function RolesVisual() {
    // Rebalanced positions for better composition
    const badges = [
        { text: "Frontend Developer", color: "#6366f1", pos: [-2.5, 1.4, 0] as [number, number, number], delay: 0 },
        { text: "Backend Architect", color: "#8b5cf6", pos: [2.5, 1.2, -1.5] as [number, number, number], delay: 1.5 },
        { text: "System Design", color: "#ec4899", pos: [0, 0, 1] as [number, number, number], delay: 3.0 },
        { text: "Product Strategy", color: "#f59e0b", pos: [-2.8, -1.3, -0.5] as [number, number, number], delay: 4.5 },
        { text: "AI Engineer", color: "#10b981", pos: [2.8, -1.5, 0.5] as [number, number, number], delay: 6.0 },
    ];

    return (
        <div className="w-full h-full min-h-[220px]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={35} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
                <pointLight position={[-10, -5, -5]} intensity={0.8} color="#c084fc" />
                <group>
                    {badges.map((badge, i) => (
                        <RoleCard key={i} {...badge} position={badge.pos} />
                    ))}
                </group>
            </Canvas>
        </div>
    );
}
