import React from 'react';

/**
 * BowLoader Component
 * Reusable SVG loader with animated bow and arrow
 */
interface BowLoaderProps {
    size?: 'tiny' | 'small' | 'medium' | 'large';
}

export const BowLoader: React.FC<BowLoaderProps> = ({ size = 'medium' }) => {
    const dimensions = {
        tiny: 'w-5 h-5',
        small: 'w-16 h-16',
        medium: 'w-24 h-24',
        large: 'w-40 h-40',
    };

    const strokeWidths = {
        tiny: 4,
        small: 2.5,
        medium: 2,
        large: 1.5,
    };

    return (
        <div className={`relative flex items-center justify-center ${dimensions[size]}`}>
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full overflow-visible"
                style={{ filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.4))' }}
            >
                <defs>
                    <linearGradient id="arjunaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" /> {/* Blue-400 */}
                        <stop offset="50%" stopColor="#818CF8" /> {/* Indigo-400 */}
                        <stop offset="100%" stopColor="#C084FC" /> {/* Purple-400 */}
                    </linearGradient>
                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" className="text-foreground" />
                        <stop offset="100%" stopColor="#E0E7FF" />
                    </linearGradient>
                </defs>

                {/* Decorative Ring (Tech Feel) */}
                {size !== 'tiny' && (
                    <>
                        <circle
                            cx="50" cy="50" r="45"
                            stroke="url(#arjunaGradient)" strokeWidth="0.5" fill="none" opacity="0.2"
                            strokeDasharray="4 4"
                            className="origin-center animate-[spin_10s_linear_infinite]"
                        />
                        <circle
                            cx="50" cy="50" r="35"
                            stroke="currentColor" strokeWidth="0.2" fill="none" opacity="0.1"
                            className="origin-center animate-[spin_10s_linear_infinite_reverse] text-foreground"
                        />
                    </>
                )}

                {/* The Bow */}
                <path
                    className="origin-center"
                    fill="none"
                    stroke="url(#arjunaGradient)"
                    strokeWidth={strokeWidths[size] + 4}
                    strokeLinecap="round"
                    style={{ animation: 'arjuna-drawBow 2s ease-in-out infinite' }}
                    d="M40,10 Q60,50 40,90"
                />

                {/* The String */}
                <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{ animation: 'arjuna-pullString 2s ease-in-out infinite' }}
                    className="opacity-60 text-foreground"
                    d="M40,10 L40,90"
                />

                {/* The Arrow */}
                <g style={{ animation: 'arjuna-arrowFly 2s ease-in-out infinite' }}>
                    <line
                        x1="15" y1="50" x2="65" y2="50"
                        stroke="url(#arrowGradient)"
                        strokeWidth={strokeWidths[size]}
                        strokeLinecap="round"
                    />
                    <path
                        d="M55,42 L65,50 L55,58"
                        fill="none"
                        stroke="url(#arrowGradient)"
                        strokeWidth={strokeWidths[size]}
                        strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                        d="M15,50 L10,45 M15,50 L10,55"
                        fill="none"
                        stroke="url(#arrowGradient)"
                        strokeWidth={strokeWidths[size] - 1}
                        strokeLinecap="round"
                    />
                </g>
            </svg>
        </div>
    );
};

/**
 * ArjunaLoader Component
 * Full-screen loading experience for Arjuna AI platform
 */
interface ArjunaLoaderProps {
    variant?: 'fullscreen' | 'inline' | 'card';
    message?: string;
}

export const ArjunaLoader: React.FC<ArjunaLoaderProps> = ({
    variant = 'fullscreen',
    message = 'Calibrating Neural Matrix'
}) => {
    if (variant === 'fullscreen') {
        return (
            <div className="fixed inset-0 bg-background text-foreground font-sans z-50 flex items-center justify-center overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 dark:bg-primary/10 rounded-full blur-[120px] animate-arjuna-blob"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 dark:bg-accent/10 rounded-full blur-[120px] animate-arjuna-blob [animation-delay:2s]"></div>
                    <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-primary/5 dark:bg-primary/5 rounded-full blur-[120px] animate-arjuna-blob [animation-delay:4s]"></div>
                </div>

                {/* Subtle Grid Pattern */}
                <div
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                    className="absolute inset-0 opacity-10 dark:opacity-10 text-foreground/5"
                ></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative">
                        {/* Energy Ripple Effect behind loader */}
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-slow"></div>
                        <BowLoader size="large" />
                    </div>

                    <div className="mt-10 flex flex-col items-center text-center space-y-4">
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent">
                                ARJUNA
                            </span>
                            <span className="text-foreground/60 dark:text-foreground/20 ml-2 font-black">AI</span>
                        </h1>

                        <div className="flex flex-col items-center space-y-3">
                            <div className="h-[3px] w-36 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
                            <p className="text-foreground dark:text-primary/70 text-xs md:text-sm font-black tracking-[0.5em] uppercase animate-pulse">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="bg-black/20 rounded-2xl p-10 flex flex-col items-center justify-center border border-white/5 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <BowLoader size="medium" />
                <span className="mt-6 text-xs font-medium text-violet-300/80 animate-pulse tracking-wide">
                    {message}
                </span>
            </div>
        );
    }

    // inline variant
    return (
        <div className="flex items-center gap-3">
            <BowLoader size="small" />
            <span className="text-sm text-slate-300 animate-pulse">{message}</span>
        </div>
    );
};

export default ArjunaLoader;
