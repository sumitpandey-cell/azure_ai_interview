"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Zap, CheckCircle2, ArrowRight, Star, Mic, PlayCircle, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Layers, ShieldCheck } from "lucide-react";
import { TransitionButton } from "@/components/TransitionButton";
import { PublicHeader } from "@/components/PublicHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PremiumLogoLoader } from "@/components/PremiumLogoLoader";

// Animations removed for performance

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Section Wrapper - Animations Enabled for Premium Experience
const SectionWrapper = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
};

const VoiceSphere = ({ isActive }: { isActive: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const requestRef = useRef<number | null>(null);
  const targetActiveRef = useRef(0);

  useEffect(() => {
    targetActiveRef.current = isActive ? 1 : 0;
  }, [isActive]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.15);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear any existing children to prevent double rendering
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const particleCount = 4500;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const originalPositions: number[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      const scale = 1.35;
      positions.push(x * scale, y * scale, z * scale);
      originalPositions.push(x * scale, y * scale, z * scale);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('initialPosition', new THREE.Float32BufferAttribute(originalPositions, 3));

    const vertexShader = `
        uniform float uTime;
        uniform float uActive;
        
        attribute vec3 initialPosition;
        
        varying float vDepth;
        varying float vWave;

        void main() {
            vec3 pos = initialPosition;

            float angle = uTime * (0.05 + uActive * 0.1);
            mat3 rotY = mat3(
                cos(angle), 0.0, sin(angle),
                0.0, 1.0, 0.0,
                -sin(angle), 0.0, cos(angle)
            );
            pos = rotY * pos;

            float waveFreq = 5.0 + uActive * 2.5;
            float waveAmp = 0.03 + uActive * 0.15;
            float wave = sin(pos.y * waveFreq - uTime * (1.2 + uActive * 3.0));
            float waveDisp = wave * waveAmp; 
            
            float wave2 = cos(pos.x * 7.0 + uTime * 2.5);
            waveDisp += wave2 * (0.01 + uActive * 0.04);

            vec3 normal = normalize(pos);
            pos += normal * waveDisp;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            vDepth = smoothstep(-2.0, 2.0, pos.z);
            vWave = wave;

            gl_PointSize = (2.0 + wave * 1.5 + uActive * 3.0) * (5.5 / -mvPosition.z);

            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        varying float vDepth;
        varying float vWave;
        uniform float uActive;

        void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;

            // Light Mode Colors - Obsidian to Paper White
            vec3 backColor = vec3(0.92, 0.94, 0.98); 
            vec3 frontColorFront = vec3(0.04, 0.08, 0.15);
            vec3 activeColorFront = vec3(0.4, 0.2, 0.9);
            
            vec3 frontColor = mix(frontColorFront, activeColorFront, uActive);
            
            vec3 color = mix(backColor, frontColor, vDepth);

            // Active glow ripples
            vec3 activeGlow = vec3(0.3, 0.6, 1.0);
            float glow = smoothstep(0.6, 1.0, vWave) * vDepth;
            color = mix(color, activeGlow, glow * uActive * 0.8);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActive: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: true,
      depthWrite: true
    });
    materialRef.current = material;

    const sphere = new THREE.Points(geometry, material);
    scene.add(sphere);

    let time = 0;
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      time += 0.01;
      material.uniforms.uTime.value = time;

      // Smoothed Active Transition
      const current = material.uniforms.uActive.value;
      const target = targetActiveRef.current;
      if (Math.abs(current - target) > 0.001) {
        material.uniforms.uActive.value += (target - current) * 0.08;
      } else {
        material.uniforms.uActive.value = target;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none" />;
};


const CapabilitiesSection = () => {
  return (
    <SectionWrapper id="capabilities" className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Background decoration matching hero */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary)/.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black tracking-widest uppercase mb-6 text-primary"
            >
              The ArjunaAI Advantage
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground tracking-tight leading-[0.9]"
            >
              Capabilities that <br />
              <span className="text-primary italic">win offers.</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-sm font-medium leading-relaxed lg:text-right"
          >
            Arjuna AI isn&apos;t just a coach. It&apos;s a high-performance simulation engine designed to push you to the technical and behavioral limits of FAANG+ standards.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto h-auto lg:h-[800px]">

          {/* Card 1: Large Featured Card (Logic Probing) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-8 bg-secondary/20 rounded-[2rem] lg:rounded-[3rem] border border-border/50 p-6 lg:p-10 relative overflow-hidden group flex flex-col justify-between"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 lg:mb-8">
                <Cpu className="w-6 h-6 lg:w-8 lg:h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground mb-3 lg:mb-4 tracking-tighter">Recursive Logic Probing</h3>
              <p className="text-muted-foreground text-lg max-w-md font-medium leading-relaxed">
                The AI hunts for logical &quot;thin spots&quot; in real-time, mapping your architecture and generating follow-ups to test your edge-case depth.
              </p>
            </div>

            {/* Visual: Logic Tree Visualization */}
            <div className="absolute right-[-10%] bottom-[-10%] w-[60%] aspect-square opacity-20 lg:opacity-100 group-hover:scale-105 transition-transform duration-1000">
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-indigo-500/30 rounded-full"
                />
                <div className="flex flex-col gap-8">
                  {[0.6, 1, 0.6].map((op, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        x: [0, 20 * (i - 1), 0],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-20 h-[2px] bg-gradient-to-r from-transparent to-indigo-500" />
                      <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy_Rate</span>
                <span className="text-xl lg:text-2xl font-black text-indigo-400 font-mono tabular-nums">98.42%</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-border/50" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analysis_Depth</span>
                <span className="text-xl lg:text-2xl font-black text-white/40 font-mono tabular-nums">DEEP_RECURSIVE</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Adaptive Difficulty (Vertical Tall) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-4 bg-primary/10 rounded-[2rem] lg:rounded-[3rem] border border-primary/20 p-6 lg:p-10 relative overflow-hidden group flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-8">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3 lg:mb-4 tracking-tighter leading-tight">Adaptive Stress Induction</h3>
            <p className="text-muted-foreground font-medium mb-12">
              Performance-weighted difficulty scaling. The better you do, the sharper it gets—mimicking the pressure of a Lead Engineer interview.
            </p>

            {/* Visual: Mechanical Meter */}
            <div className="flex-1 flex items-end justify-center py-10">
              <div className="relative w-full h-40 flex items-end justify-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [20 * i, 100 + (Math.random() * 40), 20 * i],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                    className="w-full max-w-[12px] bg-primary rounded-full"
                  />
                ))}
              </div>
            </div>

            <div className="relative px-6 py-3 rounded-2xl bg-black border border-white/10 text-center font-mono text-[11px] font-black text-primary tracking-widest uppercase overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-white/5 skew-x-12"
              />
              Level_SCALING: ACTIVE
            </div>
          </motion.div>

          {/* Card 3: Behavioral Prosody (Wide Bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-7 bg-cyan-500/[0.03] rounded-[2rem] lg:rounded-[3rem] border border-cyan-500/20 p-6 lg:p-10 relative overflow-hidden group"
          >
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-8">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3 lg:mb-4 tracking-tight">Behavioral Prosody Analysis</h3>
                <p className="text-muted-foreground font-medium max-w-sm">
                  We track your tone, speed, and confidence markers to ensure your soft skills convert as much as your technical logic.
                </p>
              </div>

              {/* Visual: Waveform */}
              <div className="w-full lg:w-48 h-24 flex items-center justify-center gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [4, Math.random() * 40 + 10, 4]
                    }}
                    transition={{ duration: 0.8, delay: i * 0.05, repeat: Infinity }}
                    className="w-1.5 bg-cyan-500/40 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 4: Roadmap (Small Corner) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="col-span-12 lg:col-span-5 bg-purple-500/[0.03] rounded-[2rem] lg:rounded-[3rem] border border-purple-500/20 p-6 lg:p-10 relative overflow-hidden group flex items-center justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Instant Expert Roadmap</h3>
              <p className="text-sm text-muted-foreground font-medium max-w-[180px]">
                AI-curated study plan mapped directly to your detected skill gaps.
              </p>
            </div>

            {/* Visual: Mini Path */}
            <div className="w-24 h-24 relative opacity-40">
              <svg viewBox="0 0 100 100" className="w-full h-full text-purple-500 stroke-current">
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2 }}
                  d="M10,90 Q50,90 50,50 T90,10"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>

        </div>
      </div>
    </SectionWrapper>
  );
};

const ModernBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <div className="absolute inset-0 bg-background" />

      {/* Interactive Spotlight - uses CSS variables for performance */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.1) 0%, transparent 65%)`,
        }}
      />

      {/* Hero Atmosphere Glow */}
      <div className="absolute top-0 left-0 w-full h-[70vh] bg-gradient-to-b from-primary/[0.03] to-transparent" />

      {/* Premium Geometric Pattern Layer */}
      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]">
        <svg width="100%" height="100%" className="text-foreground">
          <defs>
            <pattern id="modernPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1.2" fill="currentColor" />
              <path d="M0,50 L12,50 M88,50 L100,50 M50,0 L50,12 M50,88 L50,100" stroke="currentColor" strokeWidth="0.8" />
              <rect x="42" y="42" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#modernPattern)" />
        </svg>
      </div>

      {/* Subtle Dot Matrix Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#80808010_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      {/* Cinematic noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
    </div>
  );
};


function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipIntro = searchParams.get('skip_intro') === 'true';

  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Tap to start");

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setStatus("Listening...");
    } else {
      setStatus("Processing...");
      setTimeout(() => setStatus("Tap to start"), 2000);
    }
  };


  useEffect(() => {
    setMounted(true);
    if (skipIntro) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [skipIntro]);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push("/dashboard");
    }
  }, [mounted, loading, user, router]);


  if ((!mounted || loading || user) && !skipIntro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PremiumLogoLoader text="Connecting to Arjuna AI..." />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground max-w-[100vw]">
      {/* JSON-LD Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Arjuna AI", "alternateName": ["ArjunaAI", "AI Interviewer", "Arjuna Interview Coach"], "operatingSystem": "Web", "applicationCategory": "EducationalApplication", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "description": "Arjuna AI is your personal AI Interviewer. Practice with realistic AI mock interviews for coding, system design, and behavioral rounds. Get real-time scoring, personalized feedback, and master your technical skills.", "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "20000" } }) }} />

      <PublicHeader />

      {/* Hero Section - Split Layout */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-24 lg:pt-0">
        <ModernBackground />

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Text Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0 py-10 lg:py-24">
              {/* Top Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-sm text-sm font-semibold text-slate-600"
              >
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                AI Voice Intelligence 2.0
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl md:text-7xl xl:text-6xl font-black tracking-tight text-foreground leading-[1.02]"
              >
                Master your next <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-primary animate-gradient-x">
                  voice interview.
                </span>
              </motion.h1>

              {/* Subhead */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-medium tracking-tight max-w-xl"
              >
                Arjuna AI simulates real-world interview pressure with low-latency voice interaction. Get deep insights into your logic, tone, and technical depth.
              </motion.p>

              {/* CTA Group */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4"
              >
                <TransitionButton size="lg" href="/auth" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-8 lg:px-10 h-14 lg:h-16 text-lg lg:text-xl font-bold shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
                  Get Started for Free
                </TransitionButton>

                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/60 bg-white/40 backdrop-blur-md hover:bg-white/60 rounded-2xl px-8 lg:px-10 h-14 lg:h-16 text-lg lg:text-xl font-bold transition-all border shadow-lg" asChild>
                  <Link href="#demo">
                    <PlayCircle className="mr-2 h-6 w-6" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="flex items-center gap-2 text-sm text-muted-foreground/60 font-medium pt-2"
              >
                <CheckCircle2 className="h-4 w-4 text-primary opacity-60" />
                No credit card required
                <span className="mx-2 text-border">•</span>
                <CheckCircle2 className="h-4 w-4 text-primary opacity-60" />
                Join 10,000+ candidates
              </motion.div>

              {/* Trust Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-full pt-16"
              >
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8">Candidates hired at</p>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 md:gap-12 grayscale brightness-110 contrast-125">
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" width={80} height={20} className="h-5 lg:h-6 w-auto" />
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" width={80} height={20} className="h-5 lg:h-6 w-auto" />
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" width={90} height={20} className="h-5 lg:h-6 w-auto" />
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" width={80} height={20} className="h-5 lg:h-6 w-auto" />
                </div>
              </motion.div>
            </div>

            {/* Right Column: VoiceSphere Visualization */}
            <div className="relative w-full aspect-square lg:aspect-square flex items-center justify-center p-4 lg:p-0 order-last min-h-[280px] lg:min-h-0 scale-[0.85] lg:scale-100">

              <div className="relative w-full h-full max-w-[600px] aspect-square flex items-center justify-center">
                {/* Background Glows for the Sphere */}
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />

                {/* VoiceSphere Container */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                  <VoiceSphere isActive={isListening} />
                </div>

                {/* Floating Contextual Tags - Premium Placement */}
                <AnimatePresence>
                  {!isListening && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -40, y: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-[18%] left-[5%] lg:left-[5%] z-10"
                      >
                        <div className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-2xl border border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-xl text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-primary hover:text-primary transition-all cursor-pointer">
                          #PracticeLogic
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 40, y: -40 }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="absolute top-[28%] right-[5%] lg:right-[5%] z-10"
                      >
                        <div className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-2xl border border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-xl text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-primary hover:text-primary transition-all cursor-pointer">
                          #AuraVibeCheck
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Assistant Controls - Centered Bottom */}
                <div className="absolute bottom-[5%] lg:bottom-[8%] left-0 right-0 flex flex-col items-center gap-8 z-30">
                  <motion.div
                    layout
                    className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-2xl border border-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                      {status}
                    </span>
                  </motion.div>

                  <div className="flex items-center gap-10 relative">

                    <div className="relative flex items-center justify-center">
                      <AnimatePresence>
                        {isListening && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 2.5, opacity: 0.15 }}
                            exit={{ opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                            className="absolute w-20 h-20 bg-primary rounded-full pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleListening}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl z-20 ${isListening
                          ? 'bg-slate-900 border-[6px] border-slate-800'
                          : 'bg-primary border-[6px] border-white/60'
                          }`}
                      >
                        {isListening ? (
                          <X className="h-8 w-8 text-white" />
                        ) : (
                          <Mic className="h-8 w-8 text-white" />
                        )}
                      </motion.button>
                    </div>

                  </div>

                  {/* Real-time Telemetry Mockup */}
                  <div className="flex gap-12 mt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">P_Latency</span>
                      <span className="text-[11px] font-black text-primary font-mono tabular-nums leading-none">125ms</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">V_Quality</span>
                      <span className="text-[11px] font-black text-emerald-500 font-mono leading-none">HD_FLUID</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">M_Status</span>
                      <span className="text-[11px] font-black text-indigo-400 font-mono leading-none">ACTIVE_V2</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      <CapabilitiesSection />

      {/* Company Templates Section - Premium Light Mode Recreated */}
      <SectionWrapper className="py-24 lg:py-36 bg-slate-50/50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="absolute top-20 left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-20 right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] opacity-40" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black tracking-widest uppercase mb-8 shadow-sm"
            >
              <Trophy className="h-3 w-3 text-amber-500" />
              <span>Premium Company Tracks</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-6xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.95]"
            >
              Crack the <span className="text-primary">Big Tech</span> Code
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed"
            >
              Don&apos;t practice randomly. Train with the exact questions, patterns, and evaluation criteria used by top tech giants.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {/* Google Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative rounded-[2.5rem] bg-white border border-slate-200 p-8 lg:p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute top-6 right-8">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Most Popular</span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <svg viewBox="0 0 24 24" className="w-8 h-8"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Google</h3>
              <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
                Master the art of &quot;Googleyness&quot;, dynamic programming, and scalable system design.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty:</span>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100/50 inline-block">
                  Avg selection rate improvement: +23%
                </p>
                <div className="pt-4 space-y-3">
                  {[
                    "Algorithm Challenges",
                    "System Design",
                    "Googleyness & Leadership"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-sm font-semibold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold py-7 text-lg group shadow-xl shadow-slate-200" asChild>
                  <Link href="/templates" className="flex items-center justify-center gap-2">
                    Start Practice
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">~45 mins guided practice</span>
                </div>
              </div>
            </motion.div>

            {/* Amazon Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative rounded-[2.5rem] bg-white border border-slate-200 p-8 lg:p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-orange-500/20 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Image src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" alt="Amazon" width={32} height={32} className="w-8 h-8" />
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Amazon</h3>
              <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
                Deep dive into the 16 Leadership Principles and survive the Bar Raiser.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty:</span>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100/50 inline-block">
                  Avg selection rate improvement: +23%
                </p>
                <div className="pt-4 space-y-3">
                  {[
                    "Leadership Principles",
                    "Bar Raiser Prep",
                    "System Design"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-sm font-semibold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold py-7 text-lg group shadow-xl shadow-slate-200" asChild>
                  <Link href="/templates" className="flex items-center justify-center gap-2">
                    Start Practice
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">~45 mins guided practice</span>
                </div>
              </div>
            </motion.div>

            {/* Microsoft Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative rounded-[2.5rem] bg-indigo-50/20 border-2 border-primary/30 p-8 lg:p-10 shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            >
              {/* Premium Glow for Microsoft Featured Card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-10 -mt-10" />

              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-8 shadow-md group-hover:scale-110 transition-transform duration-500 relative z-10">
                <svg viewBox="0 0 23 23" className="w-8 h-8"><path fill="#f3f3f3" d="M0 0h23v23H0z" /><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" /></svg>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight relative z-10">Microsoft</h3>
              <p className="text-slate-500 text-base font-medium leading-relaxed mb-8 relative z-10">
                Prepare for technical rounds, OOP design, and behavioral questions.
              </p>

              <div className="space-y-4 mb-10 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty:</span>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100/50 inline-block">
                  Avg selection rate improvement: +23%
                </p>
                <div className="pt-4 space-y-3">
                  {[
                    "Data Structures",
                    "Object-Oriented Design",
                    "Culture Fit"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm font-semibold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold py-7 text-lg group shadow-xl shadow-primary/20" asChild>
                  <Link href="/templates" className="flex items-center justify-center gap-2">
                    Start Practice
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">~45 mins guided practice</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-20 text-center">
            <Link href="/templates" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 transition-all duration-300 font-bold group shadow-sm">
              View all 50+ companies
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </SectionWrapper>

      {/* Testimonials Section - Platinum Light */}
      < SectionWrapper id="testimonials" className="py-20 lg:py-32 bg-background relative overflow-hidden" >
        {/* Background Effect */}
        < div className="absolute inset-0 overflow-hidden pointer-events-none" >
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/3" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] translate-x-1/3" />
        </div >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-black tracking-[0.2em] uppercase">
                <MessageSquare className="h-4 w-4" />
                <span>What people say</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 tracking-tight leading-tight">
                Trusted by the world&apos;s <br />
                <span className="text-primary italic">best engineers.</span>
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground/90 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium tracking-tight">
                Join thousands of developers, product managers, and designers who are acing their interviews with Arjuna AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 pt-6">
                {/* Active Users */}
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-black text-foreground">50K+</div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Users</div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-16 bg-border"></div>

                {/* Rating with Facepile */}
                <div className="flex items-center gap-4">
                  {/* Facepile */}
                  <div className="flex -space-x-4">
                    {[
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                    ].map((src, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0A0A0B] overflow-hidden">
                        <Image src={src} alt="User" width={100} height={100} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {/* Stars & Rating */}
                  <div className="space-y-1">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <div className="font-black text-foreground text-lg">
                      4.9/5 <span className="text-muted-foreground font-medium text-sm">Top Rated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Scrolling Cards */}
            <div className="lg:col-span-7 relative h-[700px] overflow-hidden p-6" style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Column 1 - Scroll Up */}
                <div className="space-y-4 animate-scroll-vertical">
                  <div className="text-center md:hidden mb-4">
                    <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">⭐ Student Success Stories</span>
                  </div>
                  {[
                    {
                      text: "I was super nervous about my campus placements. Aura's system design templates helped me structure my thoughts. The AI's follow-up questions felt just like the real thing!",
                      name: "Aarav Patel",
                      role: "Final Year CSE, IIT Bombay",
                      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                      hero: true,
                    },
                    {
                      text: "The behavioral round prep is underrated. I used the STAR method template and practiced my stories. Nailed my interview at a top fintech.",
                      name: "Rohan Gupta",
                      role: "Product Manager at Paytm",
                      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                    },
                    {
                      text: "The technical depth in the AI/ML mock interviews is impressive. It caught me on some edge cases I usually miss. Highly recommend for senior roles.",
                      name: "Vikram Singh",
                      role: "Data Scientist at Zomato",
                      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "I was super nervous about my campus placements. Aura's system design templates helped me structure my thoughts. The AI's follow-up questions felt just like the real thing!",
                      name: "Aarav Patel",
                      role: "Final Year CSE, IIT Bombay",
                      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                      hero: true,
                    },
                    {
                      text: "The behavioral round prep is underrated. I used the STAR method template and practiced my stories. Nailed my interview at a top fintech.",
                      name: "Rohan Gupta",
                      role: "Product Manager at Paytm",
                      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,

                    },
                    {
                      text: "The technical depth in the AI/ML mock interviews is impressive. It caught me on some edge cases I usually miss. Highly recommend for senior roles.",
                      name: "Vikram Singh",
                      role: "Data Scientist at Zomato",
                      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                  ].map((testimonial, i) => (
                    <Card key={`col1-${i}`} className="p-5 lg:p-8 border border-border shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group hover:-translate-y-1 rounded-2xl relative overflow-hidden">
                      <p className="text-foreground font-medium mb-6 lg:mb-8 leading-relaxed italic text-base lg:text-lg tracking-tight">&quot;{testimonial.text}&quot;</p>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl p-0.5 bg-gradient-to-tr from-primary/20 to-accent/20">
                          <Image src={testimonial.image} alt={testimonial.name} width={48} height={48} className="h-full w-full rounded-[0.5rem] object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-base tracking-tight">{testimonial.name}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{testimonial.role}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Column 2 - Scroll Down */}
                <div className="space-y-4 animate-scroll-vertical-reverse hidden md:block">
                  {[
                    {
                      text: "Switching jobs after 3 years was scary. This tool helped me brush up on DSA. The voice feedback on my communication style was a game changer.",
                      name: "Priya Sharma",
                      role: "Software Engineer at Swiggy",
                      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "I love the daily challenges. It kept me consistent. The code review feature actually pointed out optimization tips I hadn't thought of.",
                      name: "Sneha Reddy",
                      role: "Frontend Dev at Razorpay",
                      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "Explaining design decisions is hard. Aura let me practice my rationale until I sounded confident. The 'why' is so important, and this tool gets it.",
                      name: "Ananya Iyer",
                      role: "UI/UX Designer at Cred",
                      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "Switching jobs after 3 years was scary. This tool helped me brush up on DSA. The voice feedback on my communication style was a game changer.",
                      name: "Priya Sharma",
                      role: "Software Engineer at Swiggy",
                      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "I love the daily challenges. It kept me consistent. The code review feature actually pointed out optimization tips I hadn't thought of.",
                      name: "Sneha Reddy",
                      role: "Frontend Dev at Razorpay",
                      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                    {
                      text: "Explaining design decisions is hard. Aura let me practice my rationale until I sounded confident. The 'why' is so important, and this tool gets it.",
                      name: "Ananya Iyer",
                      role: "UI/UX Designer at Cred",
                      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
                      rating: 5,
                    },
                  ].map((testimonial, i) => (
                    <Card key={`col2-${i}`} className="p-5 lg:p-8 border border-border shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group hover:-translate-y-1 rounded-2xl relative overflow-hidden">
                      <p className="text-foreground font-medium mb-6 lg:mb-8 leading-relaxed italic text-base lg:text-lg tracking-tight">&quot;{testimonial.text}&quot;</p>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl p-0.5 bg-gradient-to-tr from-primary/20 to-accent/20">
                          <Image src={testimonial.image} alt={testimonial.name} width={48} height={48} className="h-full w-full rounded-[0.5rem] object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-base tracking-tight">{testimonial.name}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{testimonial.role}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>



      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Landing() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><PremiumLogoLoader text="Connecting..." /></div>}>
      <HomeContent />
    </Suspense>
  );
}