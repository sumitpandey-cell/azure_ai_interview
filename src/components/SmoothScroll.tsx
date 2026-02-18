'use client';

import { ReactNode, useLayoutEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);
    const requestRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestRef.current = requestAnimationFrame(raf);
        }

        requestRef.current = requestAnimationFrame(raf);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
