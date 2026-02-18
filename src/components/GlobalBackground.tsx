'use client';

export function GlobalBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50">
            {/* Top Left Soft Glow */}
            <div className="absolute top-[-10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] opacity-60 mix-blend-multiply" />
            {/* Bottom Right Soft Glow */}
            <div className="absolute bottom-[-10%] -right-[10%] w-[60%] h-[60%] bg-accent/5 rounded-full blur-[140px] opacity-40 mix-blend-multiply" />

            {/* Fine Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 translate-y-[-1px]" />

            {/* Subtle Horizontal/Vertical Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:120px_120px] opacity-30" />
        </div>
    );
}
