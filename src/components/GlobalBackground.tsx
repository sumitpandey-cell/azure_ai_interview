'use client';

export function GlobalBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50">
            <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[120px] animate-blob" />
            <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-500/5 dark:bg-purple-600/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
            <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-500/5 dark:bg-emerald-600/5 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay" />
        </div>
    );
}
