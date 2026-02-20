"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Sphere, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function NeuralNetwork({ hovered }: { hovered: boolean }) {
    const groupRef = useRef<THREE.Group>(null);
    const ambientRotRef = useRef(0);

    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 25; i++) {
            p.push(new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            ));
        }
        return p;
    }, []);

    const lines = useMemo(() => {
        const l = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                if (points[i].distanceTo(points[j]) < 3) {
                    l.push([points[i], points[j]]);
                }
            }
        }
        return l;
    }, [points]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (!groupRef.current) return;

        // Ambient rotation
        ambientRotRef.current += 0.002;
        groupRef.current.rotation.y = ambientRotRef.current + (hovered ? state.mouse.x * 0.5 : 0);
        groupRef.current.rotation.z = time * 0.05;

        // Neural "firing" effect
        groupRef.current.children.forEach((child, i) => {
            if (child.type === "Mesh") {
                const pulse = 1 + Math.sin(time * 2 + i) * 0.2;
                child.scale.setScalar(pulse);
            }
        });
    });

    return (
        <group ref={groupRef}>
            {points.map((p, i) => (
                <Sphere key={i} position={p} args={[0.08, 16, 16]}>
                    <meshStandardMaterial
                        color="#818cf8"
                        emissive="#818cf8"
                        emissiveIntensity={0.5}
                    />
                </Sphere>
            ))}
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={line}
                    color="#4f46e5"
                    lineWidth={1}
                    transparent
                    opacity={0.2}
                />
            ))}
        </group>
    );
}

export default function LogicVisual() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="w-full h-full min-h-[300px]"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
                <pointLight position={[-10, -5, -5]} intensity={0.5} color="#c084fc" />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <NeuralNetwork hovered={hovered} />
                </Float>
            </Canvas>
        </div>
    );
}
