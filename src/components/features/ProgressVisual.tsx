"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function DynamicGraph({ hovered }: { hovered: boolean }) {
    const lineRef = useRef<any>(null);
    const barsRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);

    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i <= 10; i++) {
            const x = i * 0.8 - 4;
            const y = Math.sin(i * 0.6) * 1.5 + (i * 0.2); // Upward trend
            const z = 0;
            p.push(new THREE.Vector3(x, y, z));
        }
        return p;
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Tilt based on mouse
        if (groupRef.current) {
            const targetRotY = state.mouse.x * 0.2;
            const targetRotX = -state.mouse.y * 0.2;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.1);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.1);
        }

        // Animate line drawing
        if (lineRef.current) {
            const drawProgress = (Math.sin(time * 0.4) * 0.5 + 0.5);
            lineRef.current.dashed = true;
            lineRef.current.dashArray = 1;
            lineRef.current.dashRatio = 1 - (hovered ? 1 : drawProgress);
        }

        // Animate bars growth
        if (barsRef.current) {
            barsRef.current.children.forEach((child, i) => {
                const baseScale = 1 + (i * 0.1);
                const targetScale = hovered ? baseScale * 1.5 : baseScale + Math.sin(time * 2 + i) * 0.2;
                child.scale.y = THREE.MathUtils.lerp(child.scale.y, targetScale, 0.1);
            });
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Main Trend Line */}
            <Line
                ref={lineRef}
                points={points}
                color="#818cf8"
                lineWidth={hovered ? 4 : 3}
            />

            {/* Glowing Points */}
            {points.map((p, i) => (
                <group key={i} position={p}>
                    <mesh>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshBasicMaterial color="#6366f1" />
                    </mesh>
                    <mesh scale={hovered ? 2.5 : 2}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.2} />
                    </mesh>
                </group>
            ))}

            {/* Background Bars - Data Analytics Feel */}
            <group ref={barsRef} position={[0, -2, -0.5]}>
                {points.map((p, i) => (
                    <mesh key={i} position={[p.x, 0, 0]}>
                        <boxGeometry args={[0.3, 3, 0.1]} />
                        <meshStandardMaterial
                            color="#8b5cf6"
                            transparent
                            opacity={0.15}
                            metalness={0.8}
                            roughness={0.2}
                            emissive="#8b5cf6"
                            emissiveIntensity={0.1}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default function ProgressVisual() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="w-full h-full min-h-[220px]"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 1.5, 8]} fov={40} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#c084fc" />
                <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                    <DynamicGraph hovered={hovered} />
                </Float>
            </Canvas>
        </div>
    );
}
