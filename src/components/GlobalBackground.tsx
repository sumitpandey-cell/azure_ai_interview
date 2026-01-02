'use client';

export function GlobalBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50">
            <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] animate-blob" />
            <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-accent/10 dark:bg-accent/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
            <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 dark:bg-primary/5 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        </div>
    );
}
